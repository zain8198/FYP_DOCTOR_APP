import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Image, ActivityIndicator, Alert, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Text, Avatar, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { ref, onValue, push, serverTimestamp, get, update, remove } from "firebase/database";
import { auth, db } from "../../firebase";
import { ReviewModal } from "../../components/ReviewModal";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { SearchBar } from "../../components/home/SearchBar";

// Reuse Gemini API Key
const GEMINI_API_KEY = "AIzaSyCGZbKMgPGzJMF3eZ87A2ACpjieLj_5r6M";

export default function AppointmentsScreen() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<{ name: string, id?: string } | null>(null);

    // New State for Search & Filter
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [healthSuggestions, setHealthSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const handleRatePress = (doctor: any) => {
        // Ensure we have a valid doctorId
        const doctorId = doctor.doctorId;
        if (!doctorId) {
            Alert.alert("Error", "Cannot rate this doctor (missing ID).");
            return;
        }
        setSelectedDoctor({ name: doctor.doctor, id: doctorId });
        setReviewModalVisible(true);
    };

    const handleCancelPress = (appointmentId: string) => {
        Alert.alert(
            "Cancel Appointment",
            "Are you sure you want to cancel this appointment?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: 'destructive',
                    onPress: () => cancelAppointment(appointmentId)
                }
            ]
        );
    };

    const cancelAppointment = async (appointmentId: string) => {
        if (!auth.currentUser) return;
        try {
            const appointmentRef = ref(db, `appointments/${auth.currentUser.uid}/${appointmentId}`);
            await remove(appointmentRef);
            // Optional: You could also save a record of cancelled appointments elsewhere
            Alert.alert("Cancelled", "Appointment has been cancelled successfully.");
            // close details modal if open and it's the same appointment
            if (selectedAppointment?.id === appointmentId) {
                setDetailsModalVisible(false);
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to cancel appointment: " + error.message);
        }
    };

    const submitReview = async (rating: number, review: string) => {
        if (!auth.currentUser || !selectedDoctor || !selectedDoctor.id) return;

        try {
            const doctorId = selectedDoctor.id;
            const reviewRef = ref(db, `reviews/${doctorId}`);

            // 1. Push the new review
            await push(reviewRef, {
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || "Anonymous",
                rating,
                review,
                timestamp: serverTimestamp(),
                doctorName: selectedDoctor.name
            });

            // 2. Fetch all reviews to calculate average
            const snapshot = await get(reviewRef);
            if (snapshot.exists()) {
                const reviews = snapshot.val();
                let totalRating = 0;
                let count = 0;

                Object.values(reviews).forEach((r: any) => {
                    if (r.rating) {
                        totalRating += r.rating;
                        count++;
                    }
                });

                if (count > 0) {
                    const averageRating = (totalRating / count).toFixed(1);
                    // 3. Update doctor's profile with new average
                    const doctorRatingRef = ref(db, `doctors/${doctorId}`);
                    await update(doctorRatingRef, { rating: parseFloat(averageRating) });
                }
            }

            Alert.alert("Thank you!", "Your review has been submitted.");
        } catch (error: any) {
            Alert.alert("Error", "Failed to submit review: " + error.message);
        }
    };

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                const appointmentRef = ref(db, `appointments/${user.uid}`);
                onValue(appointmentRef, (snapshot) => {
                    const data = snapshot.val();
                    // Map keys to objects so we have the appointment ID
                    const appointmentList = data ? Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    })) : [];
                    // sort by date/time desc (basic sort)
                    setAppointments(appointmentList.reverse());
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching appointments:", error);
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    // Generate AI Health Suggestions
    useEffect(() => {
        if (appointments.length < 3) return; // Only suggest if user has history

        const generateSuggestions = async () => {
            setLoadingSuggestions(true);
            try {
                // Prepare appointment history summary
                const history = appointments.slice(0, 10).map(apt =>
                    `${apt.professional || 'General'} - ${apt.date}`
                ).join('\n');

                const prompt = `Based on this patient's appointment history, suggest 1-2 health checkup reminders:\n\n${history}\n\nReturn ONLY valid JSON:\n{\n  "suggestions": [{\n    "specialty": "Cardiologist",\n    "reason": "It's been 6 months since your last heart checkup"\n  }]\n}`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                });

                const data = await response.json();
                if (data.error) throw new Error(data.error.message);

                const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
                const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                const aiResult = JSON.parse(cleanJson);

                setHealthSuggestions(aiResult.suggestions || []);
            } catch (error) {
                console.error("Suggestions Error:", error);
                setHealthSuggestions([]);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        generateSuggestions();
    }, [appointments]);

    // Filter Logic
    const filteredAppointments = appointments.filter(apt => {
        // 1. Status Filter
        const status = apt.status?.toLowerCase() || 'pending';
        let matchesStatus = true;

        if (activeTab === 'upcoming') {
            matchesStatus = status === 'pending' || status === 'confirmed';
        } else if (activeTab === 'completed') {
            matchesStatus = status === 'completed';
        } else if (activeTab === 'cancelled') {
            matchesStatus = status === 'cancelled';
        }

        // 2. Search Filter
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            apt.doctor?.toLowerCase().includes(query) ||
            apt.professional?.toLowerCase().includes(query) ||
            apt.date?.includes(query);

        return matchesStatus && matchesSearch;
    });

    const openDetails = (appointment: any) => {
        setSelectedAppointment(appointment);
        setDetailsModalVisible(true);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return { bg: '#FFF3E0', text: '#EF6C00', icon: 'time-outline' };
            case 'confirmed': return { bg: '#E3F2FD', text: '#2196F3', icon: 'checkmark-circle-outline' };
            case 'completed': return { bg: '#E8F5E9', text: '#2E7D32', icon: 'checkmark-done-outline' };
            case 'cancelled': return { bg: '#FFEBEE', text: '#C62828', icon: 'close-circle-outline' };
            default: return { bg: '#F5F5F5', text: '#757575', icon: 'help-circle-outline' };
        }
    };

    const renderFilterTab = (key: string, label: string) => (
        <TouchableOpacity
            style={[
                styles.filterTab,
                activeTab === key && styles.activeFilterTab
            ]}
            onPress={() => setActiveTab(key as any)}
        >
            <Text style={[
                styles.filterTabText,
                activeTab === key && styles.activeFilterTabText
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Appointments</Text>
            </View>

            <View style={{ paddingHorizontal: 20 }}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={{ marginBottom: 15 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    {renderFilterTab('all', 'All')}
                    {renderFilterTab('upcoming', 'Upcoming')}
                    {renderFilterTab('completed', 'Completed')}
                    {renderFilterTab('cancelled', 'Cancelled')}
                </ScrollView>
            </View>

            {/* AI Health Suggestions */}
            {healthSuggestions.length > 0 && (
                <View style={styles.suggestionsSection}>
                    <View style={styles.suggestionHeader}>
                        <Ionicons name="notifications" size={20} color={Colors.primary} />
                        <Text style={styles.suggestionTitle}>Health Reminders 🔔</Text>
                    </View>
                    {healthSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.suggestionCard}
                            onPress={() => {
                                router.push({ pathname: "/(tabs)/home", params: { category: suggestion.specialty } } as any);
                            }}
                        >
                            <View style={styles.suggestionContent}>
                                <View style={styles.suggestionIcon}>
                                    <Ionicons name="medical" size={20} color="#6C63FF" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.suggestionSpecialty}>{suggestion.specialty}</Text>
                                    <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {filteredAppointments.length === 0 ? (
                <View style={styles.emptyState}>
                    <Avatar.Icon size={80} icon="calendar-remove" style={{ backgroundColor: '#f0f0f0' }} color={Colors.textSecondary} />
                    <Text style={{ marginTop: 20, color: Colors.textSecondary, fontSize: 16 }}>
                        {searchQuery ? "No matching appointments found." : "No appointments found."}
                    </Text>
                    {activeTab === 'all' && !searchQuery && (
                        <TouchableOpacity
                            style={styles.findDoctorButton}
                            onPress={() => router.push("/(tabs)/home" as any)}
                        >
                            <Text style={styles.findDoctorText}>Find a Doctor</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filteredAppointments}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
                    renderItem={({ item }) => {
                        const statusStyle = getStatusColor(item.status || 'pending');
                        const isCancelled = item.status?.toLowerCase() === 'cancelled';
                        const isCompleted = item.status?.toLowerCase() === 'completed';

                        return (
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => openDetails(item)}
                                style={styles.card}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.doctorInfo}>
                                        <Avatar.Text
                                            size={50}
                                            label={item.doctor?.substring(0, 2).toUpperCase() || "DR"}
                                            style={{ backgroundColor: Colors.primary }}
                                            color="white"
                                        />
                                        <View style={{ marginLeft: 15 }}>
                                            <Text style={styles.doctorName}>Dr. {item.doctor}</Text>
                                            <Text style={styles.specialty}>{item.professional || "Specialist"}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}>
                                        <Ionicons name={statusStyle.icon as any} size={16} color={statusStyle.text} />
                                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                            {item.status || "Pending"}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.dateRow}>
                                    <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                                    <Text style={styles.dateText}>{item.date} | {item.time || "10:00 AM"}</Text>
                                </View>

                                <View style={styles.actionRow}>
                                    {!isCancelled && !isCompleted && (
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => handleCancelPress(item.id)}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    )}

                                    {isCompleted && (
                                        <TouchableOpacity
                                            style={styles.rateButton}
                                            onPress={() => handleRatePress(item)}
                                        >
                                            <Text style={styles.rateButtonText}>Rate Doctor</Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* Just a spacer if only one button or view details hint */}
                                    {/* We can act this entire card as view details, so maybe no extra button is cleaner */}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            {/* REVIEW MODAL */}
            <ReviewModal
                visible={reviewModalVisible}
                onClose={() => setReviewModalVisible(false)}
                onSubmit={submitReview}
                doctorName={selectedDoctor?.name || 'Doctor'}
            />

            {/* DETAILS MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailsModalVisible}
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Fixed Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Appointment Details</Text>
                            <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        {/* Scrollable Body */}
                        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 20 }}>
                            {selectedAppointment && (
                                <>
                                    <View style={styles.detailSection}>
                                        <View style={styles.doctorProfileRow}>
                                            <Avatar.Text size={56} label={selectedAppointment.doctor?.substring(0, 2).toUpperCase()} style={{ backgroundColor: Colors.primary }} color='white' />
                                            <View style={{ marginLeft: 15, flex: 1 }}>
                                                <Text style={styles.detailDoctorName}>Dr. {selectedAppointment.doctor}</Text>
                                                <Text style={styles.detailSpecialty}>{selectedAppointment.professional}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.infoGrid}>
                                        <View style={styles.infoItem}>
                                            <View style={styles.iconBox}>
                                                <Ionicons name="calendar" size={20} color={Colors.primary} />
                                            </View>
                                            <View>
                                                <Text style={styles.infoLabel}>Date</Text>
                                                <Text style={styles.infoValue}>{selectedAppointment.date}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.infoItem}>
                                            <View style={styles.iconBox}>
                                                <Ionicons name="time" size={20} color={Colors.primary} />
                                            </View>
                                            <View>
                                                <Text style={styles.infoLabel}>Time</Text>
                                                <Text style={styles.infoValue}>{selectedAppointment.time || "10:00 AM"}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionHeader}>Status</Text>
                                        <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedAppointment.status).bg }]}>
                                            <Ionicons name={getStatusColor(selectedAppointment.status).icon as any} size={20} color={getStatusColor(selectedAppointment.status).text} />
                                            <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedAppointment.status).text }]}>
                                                {selectedAppointment.status || "Pending"}
                                            </Text>
                                        </View>
                                    </View>

                                    {selectedAppointment.details && (
                                        <View style={styles.detailSection}>
                                            <Text style={styles.sectionHeader}>Rason for Visit</Text>
                                            <View style={styles.noteBox}>
                                                <Text style={styles.noteText}>{selectedAppointment.details}</Text>
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}
                        </ScrollView>

                        {/* Fixed Footer */}
                        {selectedAppointment && (
                            <View style={styles.modalFooter}>
                                {selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed' ? (
                                    <Button
                                        mode="contained"
                                        buttonColor={Colors.error}
                                        onPress={() => handleCancelPress(selectedAppointment.id)}
                                        style={styles.fullWidthButton}
                                        icon="close-circle-outline"
                                    >
                                        Cancel Appointment
                                    </Button>
                                ) : selectedAppointment.status === 'completed' ? (
                                    <Button
                                        mode="contained"
                                        buttonColor={Colors.primary}
                                        onPress={() => { setDetailsModalVisible(false); handleRatePress(selectedAppointment); }}
                                        style={styles.fullWidthButton}
                                        icon="star-outline"
                                    >
                                        Rate Doctor
                                    </Button>
                                ) : (
                                    <Button
                                        mode="outlined"
                                        onPress={() => setDetailsModalVisible(false)}
                                        style={styles.fullWidthButton}
                                        textColor={Colors.textSecondary}
                                    >
                                        Close
                                    </Button>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: Colors.white,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.text,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
    },
    activeFilterTab: {
        backgroundColor: Colors.primary,
    },
    filterTabText: {
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    activeFilterTabText: {
        color: 'white',
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    doctorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    doctorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    specialty: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 15,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dateText: {
        marginLeft: 10,
        color: Colors.text,
        fontSize: 14,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    rateButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    rateButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    findDoctorButton: {
        marginTop: 20,
        backgroundColor: Colors.primary,
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
    },
    findDoctorText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        height: '80%', // Fixed height as requested
        display: 'flex',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 20,
    },
    modalBody: {
        flex: 1,
        padding: 20,
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: 'white',
    },
    detailSection: {
        marginBottom: 25,
    },
    doctorProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailDoctorName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    detailSpecialty: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        marginBottom: 25,
    },
    infoItem: {
        width: '47%',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(47, 128, 98, 0.1)', // Primary with opacity
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    infoLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
    },
    statusBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusTextLarge: {
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    },
    noteBox: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 12,
    },
    noteText: {
        color: Colors.text,
        lineHeight: 20,
    },
    fullWidthButton: {
        borderRadius: 12,
        paddingVertical: 6,
    },
    suggestionsSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    suggestionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    suggestionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 8,
    },
    suggestionCard: {
        backgroundColor: '#F8F9FF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E0FF',
    },
    suggestionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    suggestionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEE9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    suggestionSpecialty: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    suggestionReason: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    }
});

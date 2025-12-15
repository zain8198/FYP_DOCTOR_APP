import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Image, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { Text, Avatar } from "react-native-paper";
import { useRouter } from "expo-router";
import { ref, onValue, push, serverTimestamp, get, update, remove } from "firebase/database";
import { auth, db } from "../../firebase";
import { ReviewModal } from "../../components/ReviewModal";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

export default function AppointmentsScreen() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<{ name: string, id?: string } | null>(null);

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
                    setAppointments(appointmentList);
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

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Appointments</Text>
            </View>

            {appointments.length === 0 ? (
                <View style={styles.emptyState}>
                    <Avatar.Icon size={80} icon="calendar-remove" style={{ backgroundColor: '#f0f0f0' }} color={Colors.textSecondary} />
                    <Text style={{ marginTop: 20, color: Colors.textSecondary, fontSize: 16 }}>No appointments found.</Text>
                    <TouchableOpacity
                        style={styles.findDoctorButton}
                        onPress={() => router.push("/(tabs)/home" as any)} // Navigate to Home
                    >
                        <Text style={styles.findDoctorText}>Find a Doctor</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.doctorInfo}>
                                    <Avatar.Text
                                        size={50}
                                        label={item.doctor.substring(0, 2).toUpperCase()}
                                        style={{ backgroundColor: Colors.primary }}
                                        color="white"
                                    />
                                    <View style={{ marginLeft: 15 }}>
                                        <Text style={styles.doctorName}>Dr. {item.doctor}</Text>
                                        <Text style={styles.specialty}>{item.professional || "Specialist"}</Text>
                                    </View>
                                </View>
                                <View style={styles.statusChip}>
                                    <Ionicons name="time-outline" size={16} color={Colors.primary} />
                                    <Text style={styles.statusText}>{item.meeting || "Consultation"}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.dateRow}>
                                <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                                <Text style={styles.dateText}>{item.date} | {item.time || "10:00 AM"}</Text>
                            </View>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => handleCancelPress(item.id)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.rateButton}
                                    onPress={() => handleRatePress(item)}
                                >
                                    <Text style={styles.rateButtonText}>Rate Doctor</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}

            <ReviewModal
                visible={reviewModalVisible}
                onClose={() => setReviewModalVisible(false)}
                onSubmit={submitReview}
                doctorName={selectedDoctor?.name || 'Doctor'}
            />
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
    }
});

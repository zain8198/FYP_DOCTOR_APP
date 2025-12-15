import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Platform, StatusBar } from "react-native";
import { Text, Avatar, ActivityIndicator } from "react-native-paper";
import { ref, get, update } from "firebase/database";
import { auth, db } from "../../firebase";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";

export default function DoctorDashboard() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctorProfile, setDoctorProfile] = useState<any>(null);
    const [stats, setStats] = useState({ patients: 0, experience: '3 Yrs', rating: 4.8 });
    const router = useRouter();

    const handleStatusUpdate = async (patientId: string, appointmentId: string, newStatus: string) => {
        try {
            // Update the specific appointment node
            const aptRef = ref(db, `appointments/${patientId}/${appointmentId}`);
            await update(aptRef, { status: newStatus });

            // Optimistically update local state to reflect change immediately
            setAppointments(prev => prev.map(apt =>
                apt.id === appointmentId ? { ...apt, status: newStatus } : apt
            ));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return { bg: '#FFF3E0', text: '#EF6C00' };
            case 'confirmed': return { bg: '#E3F2FD', text: '#2196F3' };
            case 'upcoming': return { bg: '#E3F2FD', text: '#2196F3' };
            case 'completed': return { bg: '#E8F5E9', text: '#2E7D32' };
            case 'cancelled': return { bg: '#FFEBEE', text: '#C62828' };
            default: return { bg: '#F5F5F5', text: '#757575' };
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!auth.currentUser) return;
            setLoading(true);
            try {
                // 1. Get Doctor Profile
                const doctorRef = ref(db, `doctors/${auth.currentUser.uid}`);
                const docSnap = await get(doctorRef);

                let docData = { name: "Doctor" };
                if (docSnap.exists()) {
                    docData = docSnap.val();
                    setDoctorProfile(docData);
                    // Use stored stats if available, else mock/calculate
                    if (docData.stats) setStats(docData.stats);
                    else setStats(s => ({ ...s, experience: docData.experience || '5 Yrs', rating: parseFloat(docData.rating || '4.8') }));
                }

                // 2. Get Appointments & Resolve Patient Names
                const aptRef = ref(db, "appointments");
                const aptSnap = await get(aptRef);

                if (aptSnap.exists()) {
                    const allApts = aptSnap.val();
                    let myApts: any[] = [];
                    let uniquePatients = new Set();

                    // Iterate over User IDs (Parent Nodes)
                    for (let userId in allApts) {
                        const userApts = allApts[userId];

                        // Fetch User Details for this ID
                        const userRef = ref(db, `users/${userId}`);
                        const userSnap = await get(userRef);
                        const userData = userSnap.exists() ? userSnap.val() : {};

                        for (let aptId in userApts) {
                            const apt = userApts[aptId];

                            // Match Doctor (by Name or ID)
                            const isMyPatient = (apt.doctor === docData.name) || (apt.doctorId === auth.currentUser.uid);

                            if (isMyPatient) {
                                uniquePatients.add(userId);
                                myApts.push({
                                    id: aptId,
                                    patientId: userId,
                                    // Robust Name Logic: Profile Name -> Appointment Name -> Fallback
                                    patientName: userData.name || apt.patientName || "Guest Patient",
                                    patientImage: userData.image, // Could be null
                                    ...apt,
                                    status: apt.status || 'Upcoming'
                                });
                            }
                        }
                    }
                    setAppointments(myApts);
                    setStats(prev => ({ ...prev, patients: uniquePatients.size }));
                }
            } catch (error) {
                console.error("Dashboard Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // Using Pastel Colors to match Patient Side Theme
    const renderStatCard = (icon: any, label: string, value: string | number, bgColor: string, iconColor: string) => (
        <View style={[styles.statCard, { backgroundColor: bgColor }]}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
                <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <View>
                <Text style={[styles.statValue, { color: iconColor }]}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </View>
        </View>
    );

    // 3. Approval Check
    if (!loading && doctorProfile && doctorProfile.status !== 'approved') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.loadingContainer, { padding: 40 }]}>
                    <Ionicons
                        name={doctorProfile.status === 'rejected' ? "close-circle" : "time-outline"}
                        size={80}
                        color={doctorProfile.status === 'rejected' ? Colors.error : Colors.primary}
                    />
                    <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 20, textAlign: 'center' }}>
                        {doctorProfile.status === 'rejected' ? "Application Rejected" : "Account Under Review"}
                    </Text>
                    <Text style={{ textAlign: 'center', color: '#666', marginTop: 10, lineHeight: 22 }}>
                        {doctorProfile.status === 'rejected'
                            ? "We're sorry, but your application to join Doctor App has been declined. Please contact support for more details."
                            : "Your profile is currently being reviewed by our admin team. You will get access to the dashboard once approved."}
                    </Text>
                    {doctorProfile.status !== 'rejected' && (
                        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#E3F2FD', borderRadius: 8 }}>
                            <Text style={{ color: Colors.primary, fontWeight: '600' }}>Status: Pending Approval</Text>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome Back,</Text>
                        <Text style={styles.docName}>Dr. {doctorProfile?.name || "Doctor"} 👋</Text>
                    </View>
                    <Avatar.Image size={50} source={doctorProfile?.image ? { uri: doctorProfile.image } : require('../../assets/images/default_doctor.jpg')} />
                </View>

                {/* Stats Row */}
                <View style={styles.statsContainer}>
                    {renderStatCard("people", "Patients", stats.patients, "#E3F2FD", "#1976D2")}
                    {renderStatCard("star", "Rating", stats.rating, "#FFF8E1", "#FBC02D")}
                    {renderStatCard("briefcase", "Experience", stats.experience, "#E8F5E9", "#388E3C")}
                </View>

                {/* Date / Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Appointments</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {/* Appointments List */}
                {appointments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={60} color="#DDD" />
                        <Text style={styles.emptyText}>No appointments scheduled today.</Text>
                    </View>
                ) : (
                    appointments.map((item) => (
                        <View key={item.id} style={styles.appointmentCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.patientInfo}>
                                    {item.patientImage ? (
                                        <Avatar.Image size={50} source={{ uri: item.patientImage }} />
                                    ) : (
                                        <Avatar.Text size={50} label={item.patientName.substring(0, 2).toUpperCase()} style={{ backgroundColor: Colors.primary }} color="white" />
                                    )}
                                    <View style={{ marginLeft: 15 }}>
                                        <Text style={styles.patientName}>{item.patientName}</Text>
                                        <Text style={styles.problemText}>{item.details || "General Checkup"}</Text>
                                    </View>
                                </View>
                                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status).bg }]}>
                                    <Text style={[styles.badgeText, { color: getStatusColor(item.status).text }]}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.cardFooter}>
                                <View style={styles.timeInfo}>
                                    <Ionicons name="time-outline" size={18} color={Colors.primary} />
                                    <Text style={styles.timeText}>{item.date || "Today, 10:00 AM"}</Text>
                                </View>
                                <View style={styles.actions}>
                                    {/* Status Actions */}
                                    {item.status === 'pending' && (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                                                onPress={() => handleStatusUpdate(item.patientId, item.id, 'confirmed')}
                                            >
                                                <Ionicons name="checkmark" size={16} color="white" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#F44336' }]}
                                                onPress={() => handleStatusUpdate(item.patientId, item.id, 'cancelled')}
                                            >
                                                <Ionicons name="close" size={16} color="white" />
                                            </TouchableOpacity>
                                        </>
                                    )}

                                    {(item.status === 'confirmed' || item.status === 'upcoming') && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: '#2196F3', width: 'auto', paddingHorizontal: 12 }]}
                                            onPress={() => handleStatusUpdate(item.patientId, item.id, 'completed')}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Complete</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.iconBtn, { backgroundColor: Colors.primary }]}
                                        onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.patientId, name: item.patientName, image: item.patientImage } } as any)}
                                    >
                                        <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    greeting: {
        fontSize: 14,
        color: '#666',
    },
    docName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    statCard: {
        flex: 1,
        height: 110,
        borderRadius: 16,
        padding: 12,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginHorizontal: 5,
        elevation: 1,
        // Removed heavy shadow for cleaner pastel look
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAll: {
        color: Colors.primary,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: '#999',
        marginTop: 10,
        fontSize: 14,
    },
    appointmentCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginBottom: 15,
        borderRadius: 16,
        padding: 15, // Reduced padding
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    patientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    patientName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
    },
    problemText: {
        fontSize: 14,
        color: '#777', // Lighter text
        marginTop: 4,
    },
    badge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 10, // Reduced vertical margin
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F5F7FA',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    timeText: {
        fontSize: 12, // Smaller font
        color: '#444',
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 6, // Tighter gap
    },
    iconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0F2F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtn: {
        height: 32,
        width: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
});

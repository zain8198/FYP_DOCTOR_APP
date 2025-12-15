import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Platform, StatusBar } from "react-native";
import { Text, Avatar, ActivityIndicator } from "react-native-paper";
import { ref, get } from "firebase/database";
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
                    <Avatar.Image size={50} source={{ uri: doctorProfile?.image || 'https://i.pravatar.cc/150?img=11' }} />
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
                                    <Avatar.Image size={50} source={{ uri: item.patientImage || 'https://i.pravatar.cc/150?img=8' }} />
                                    <View style={{ marginLeft: 15 }}>
                                        <Text style={styles.patientName}>{item.patientName}</Text>
                                        <Text style={styles.problemText}>{item.details || "General Checkup"}</Text>
                                    </View>
                                </View>
                                <View style={[styles.badge, { backgroundColor: item.status === 'Completed' ? '#E8F5E9' : '#E3F2FD' }]}>
                                    <Text style={[styles.badgeText, { color: item.status === 'Completed' ? '#2E7D32' : '#1565C0' }]}>
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
                                    <TouchableOpacity
                                        style={[styles.iconBtn, { backgroundColor: Colors.primary }]}
                                        onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.patientId, name: item.patientName } } as any)}
                                    >
                                        <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
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
        padding: 20, // Increased padding
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
        marginVertical: 15,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F5F7FA',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    timeText: {
        fontSize: 14,
        color: '#444',
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F2F5', // Soft grey
        justifyContent: 'center',
        alignItems: 'center',
    },
});

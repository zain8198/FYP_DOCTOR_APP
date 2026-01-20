import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Avatar, ActivityIndicator } from "react-native-paper";
import { ref, get, update, onValue } from "firebase/database";
import { auth, db } from "../../firebase";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";
import Constants from 'expo-constants';
import { useCache } from "../../utils/useCache";
import { callGeminiAPI } from "../../utils/geminiAPI";
import { DoctorHeader } from "../../components/doctor/DoctorHeader";

export default function DoctorDashboardScreen() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctorProfile, setDoctorProfile] = useState<any>(null);
    const [stats, setStats] = useState({ patients: 0, experience: '3 Yrs', rating: 0 });
    const router = useRouter();
    const [feedbackInsights, setFeedbackInsights] = useState<any>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const cache = useCache(); // Initialize cache hook
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

    const handleStartCall = async (patientId: string, appointmentId: string, patientName: string) => {
        try {
            const aptRef = ref(db, `appointments/${patientId}/${appointmentId}`);
            await update(aptRef, {
                callStatus: 'active',
                lastCallTimestamp: Date.now()
            });

            router.push({
                pathname: "/call",
                params: {
                    appointmentId,
                    patientId,
                    doctorName: doctorProfile?.name || "Doctor",
                    patientName,
                    role: 'doctor'
                }
            } as any);
        } catch (error) {
            console.error("Error starting call:", error);
            alert("Failed to start call");
        }
    };

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

    const fetchData = useCallback(async () => {
        if (!auth.currentUser) return;
        setLoading(true);
        try {
            // 1. Get Doctor Profile with caching
            const cacheKey = `doctor_own_profile_${auth.currentUser.uid}`;
            const cachedProfile = cache.getCachedData<any>(cacheKey);

            let docData: any = { name: "Doctor" };
            if (cachedProfile) {
                docData = cachedProfile;
                setDoctorProfile(docData);
                // Use stored stats if available
                if (docData.stats) setStats(docData.stats);
                else setStats(s => ({ ...s, experience: docData.experience || '5 Yrs' }));
            } else {
                // Cache miss - fetch from Firebase
                const doctorRef = ref(db, `doctors/${auth.currentUser.uid}`);
                const docSnap = await get(doctorRef);

                if (docSnap.exists()) {
                    docData = docSnap.val();
                    setDoctorProfile(docData);
                    // Store in cache
                    cache.setCachedData(cacheKey, docData);
                    // Use stored stats if available, else mock/calculate
                    if (docData.stats) setStats(docData.stats);
                    else setStats(s => ({ ...s, experience: docData.experience || '5 Yrs' }));
                }
            }

            // 2. Get Appointments with REAL-TIME listener
            const aptRef = ref(db, "appointments");

            // Use onValue for real-time updates
            const unsubscribe = onValue(aptRef, async (aptSnap) => {
                const currentUser = auth.currentUser;
                if (!currentUser) return;

                if (aptSnap.exists()) {
                    const allApts = aptSnap.val();
                    let myApts: any[] = [];
                    let uniquePatients = new Set();

                    // Use Promise.all to fetch all user profiles in parallel
                    const userIds = Object.keys(allApts);
                    const userProfiles: { [key: string]: any } = {};

                    await Promise.all(userIds.map(async (uid) => {
                        const userCacheKey = `user_profile_simple_${uid}`;
                        const cachedUser = cache.getCachedData<any>(userCacheKey);
                        if (cachedUser) {
                            userProfiles[uid] = cachedUser;
                        } else {
                            const userRef = ref(db, `users/${uid}`);
                            const userSnap = await get(userRef);
                            const userData = userSnap.exists() ? userSnap.val() : {};
                            userProfiles[uid] = userData;
                            cache.setCachedData(userCacheKey, userData, 30 * 60 * 1000); // Cache for 30 mins
                        }
                    }));

                    for (let userId in allApts) {
                        const userApts = allApts[userId];
                        const userData = userProfiles[userId] || {};

                        for (let aptId in userApts) {
                            const apt = userApts[aptId];

                            // Match Doctor (by Name or ID)
                            const isMyPatient = (apt.doctor === docData.name) || (apt.doctorId === currentUser.uid);

                            if (isMyPatient) {
                                uniquePatients.add(userId);
                                myApts.push({
                                    id: aptId,
                                    patientId: userId,
                                    patientName: userData.name || apt.patientName || "Guest Patient",
                                    patientImage: userData.image,
                                    ...apt,
                                    status: apt.status || 'Upcoming'
                                });
                            }
                        }
                    }

                    // Sort appointments: Pending first (need action), then by date
                    myApts.sort((a, b) => {
                        // Priority: pending > confirmed/upcoming > completed > cancelled
                        const priority: Record<string, number> = {
                            'pending': 0,
                            'confirmed': 1,
                            'upcoming': 1,
                            'completed': 2,
                            'cancelled': 3
                        };
                        const priorityA = priority[a.status?.toLowerCase()] ?? 4;
                        const priorityB = priority[b.status?.toLowerCase()] ?? 4;

                        if (priorityA !== priorityB) return priorityA - priorityB;

                        // Same priority - sort by date (newest first)
                        const dateA = new Date(`${a.date || ''} ${a.time || ''}`).getTime();
                        const dateB = new Date(`${b.date || ''} ${b.time || ''}`).getTime();
                        return dateB - dateA;
                    });

                    setAppointments(myApts);
                    setStats(prev => {
                        // Only update if value actually changed to prevent unnecessary re-renders
                        if (prev.patients === uniquePatients.size) return prev;
                        return { ...prev, patients: uniquePatients.size };
                    });
                } else {
                    setAppointments([]);
                }
                setLoading(false);
                setRefreshing(false); // Stop refreshing
            }, (error) => {
                console.error("Real-time appointments error:", error);
                setLoading(false);
                setRefreshing(false); // Stop refreshing
            });

            // 3. Get Reviews for actual rating calculation
            const reviewsRef = ref(db, `reviews/${auth.currentUser.uid}`);
            const unsubscribeReviews = onValue(reviewsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const reviewsData = snapshot.val();
                    const reviewsList = Object.values(reviewsData) as any[];
                    if (reviewsList.length > 0) {
                        let sum = 0;
                        reviewsList.forEach((r: any) => sum += (r.rating || 0));
                        const avgRating = sum / reviewsList.length;
                        setStats(prev => ({ ...prev, rating: parseFloat(avgRating.toFixed(1)) }));
                    } else {
                        setStats(prev => ({ ...prev, rating: 0 }));
                    }
                } else {
                    setStats(prev => ({ ...prev, rating: 0 }));
                }
            });

            // Return cleanup function to unsubscribe when component unmounts
            return () => {
                unsubscribe();
                unsubscribeReviews();
            };
        } catch (error) {
            console.error("Dashboard Error:", error);
            setLoading(false);
            setRefreshing(false); // Stop refreshing
        }
    }, [cache]); // Dependencies for useCallback

    useEffect(() => {
        const unsubscribePromise = fetchData();

        // Cleanup function
        return () => {
            unsubscribePromise.then(unsub => {
                if (unsub) unsub();
            });
        };
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
        generateInsights(); // Also refresh insights
    }, [fetchData]);

    // Generate AI Feedback Insights
    const generateInsights = useCallback(async () => {
        if (!auth.currentUser) return;

        setLoadingInsights(true);
        try {
            // Check cache first
            const cacheKey = `doctor_feedback_insights_${auth.currentUser.uid}`;
            const cachedInsights = cache.getCachedData<any>(cacheKey);

            if (cachedInsights) {
                setFeedbackInsights(cachedInsights);
                setLoadingInsights(false);
                return;
            }

            // Cache miss - fetch reviews and generate insights
            const reviewsRef = ref(db, `reviews/${auth.currentUser.uid}`);
            const snapshot = await get(reviewsRef);

            if (!snapshot.exists()) {
                setLoadingInsights(false);
                return;
            }

            const reviewsData = snapshot.val();
            const reviewTexts = Object.values(reviewsData).map((r: any) =>
                r.review || r.feedback || r.comment || ""
            ).filter(Boolean);

            if (reviewTexts.length === 0) {
                setLoadingInsights(false);
                return;
            }

            const prompt = `Analyze these doctor reviews and provide actionable insights:\n\n${reviewTexts.join('\n\n')}\n\nReturn ONLY valid JSON:\n{\n  "strengths": ["Friendly", "Quick"],\n  "improvements": ["Wait time"],\n  "trend": "Positive"\n}`;

            const textResponse = await callGeminiAPI(prompt);
            const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const insights = JSON.parse(cleanJson);

            setFeedbackInsights(insights);
            // Store in cache
            cache.setCachedData(cacheKey, insights);
        } catch (error) {
            console.error("Insights Error:", error);
            setFeedbackInsights(null);
        } finally {
            setLoadingInsights(false);
        }
    }, [cache]);

    useEffect(() => {
        generateInsights();
    }, [generateInsights]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // Using Pastel Colors to match Patient Side Theme
    const renderStatCard = (icon: any, label: string, value: string | number, bgColor: string, iconColor: string, onPress?: () => void) => (
        <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} style={[styles.statCard, { backgroundColor: bgColor }]}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
                <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <View>
                <Text style={[styles.statValue, { color: iconColor }]}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </View>
        </TouchableOpacity>
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
            <ScrollView
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header with Notification Bell */}
                <DoctorHeader
                    doctorName={doctorProfile?.name || "Doctor"}
                    doctorImage={doctorProfile?.image}
                />

                {/* Stats Row */}
                <View style={styles.statsContainer}>
                    {renderStatCard("people", "Patients", stats.patients, "#E3F2FD", "#1976D2")}
                    {renderStatCard("star", "Rating", stats.rating, "#FFF8E1", "#FBC02D", () => router.push("/doctor/feedback"))}
                    {renderStatCard("briefcase", "Experience", stats.experience, "#E8F5E9", "#388E3C")}
                </View>

                {/* AI Feedback Insights */}
                {feedbackInsights && (
                    <View style={styles.insightsCard}>
                        <View style={styles.insightsHeader}>
                            <Ionicons name="bulb" size={22} color="#6C63FF" />
                            <Text style={styles.insightsTitle}>Patient Feedback Insights 💡</Text>
                        </View>

                        {feedbackInsights.strengths?.length > 0 && (
                            <View style={styles.insightSection}>
                                <View style={styles.insightLabel}>
                                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                    <Text style={styles.insightLabelText}>Strengths</Text>
                                </View>
                                <Text style={styles.insightText}>{feedbackInsights.strengths.join(', ')}</Text>
                            </View>
                        )}

                        {feedbackInsights.improvements?.length > 0 && (
                            <View style={styles.insightSection}>
                                <View style={styles.insightLabel}>
                                    <Ionicons name="alert-circle" size={16} color="#FF9800" />
                                    <Text style={styles.insightLabelText}>Areas to Improve</Text>
                                </View>
                                <Text style={styles.insightText}>{feedbackInsights.improvements.join(', ')}</Text>
                            </View>
                        )}

                        {feedbackInsights.trend && (
                            <View style={styles.trendBadge}>
                                <Ionicons name="trending-up" size={14} color="#2196F3" />
                                <Text style={styles.trendText}>Overall: {feedbackInsights.trend}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Date / Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Appointments</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    {(['all', 'pending', 'confirmed', 'completed'] as const).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterTab,
                                activeFilter === filter && styles.activeFilterTab
                            ]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[
                                styles.filterTabText,
                                activeFilter === filter && styles.activeFilterTabText
                            ]}>
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                            {filter === 'pending' && appointments.filter(a => a.status?.toLowerCase() === 'pending').length > 0 && (
                                <View style={styles.filterBadge}>
                                    <Text style={styles.filterBadgeText}>
                                        {appointments.filter(a => a.status?.toLowerCase() === 'pending').length}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Appointments List */}
                {(() => {
                    const filteredAppointments = appointments.filter(apt => {
                        if (activeFilter === 'all') return true;
                        return apt.status?.toLowerCase() === activeFilter;
                    });

                    return filteredAppointments.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={60} color="#DDD" />
                            <Text style={styles.emptyText}>
                                {activeFilter === 'all'
                                    ? 'No appointments scheduled.'
                                    : `No ${activeFilter} appointments.`}
                            </Text>
                        </View>
                    ) : (
                        filteredAppointments.map((item) => (
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
                                                style={[styles.iconBtn, { backgroundColor: '#4CAF50' }]}
                                                onPress={() => handleStartCall(item.patientId, item.id, item.patientName)}
                                            >
                                                <Ionicons name="videocam" size={18} color="white" />
                                            </TouchableOpacity>
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
                    );
                })()}
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
        marginBottom: 12,
    },
    patientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    patientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    problemText: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12, // Rounded pill shape
        marginLeft: 5,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F2F5',
        marginVertical: 10,
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
    insightsCard: {
        backgroundColor: '#F8F9FF',
        marginHorizontal: 20,
        marginBottom: 25,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E0E0FF',
    },
    insightsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    insightsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 8,
    },
    insightSection: {
        marginBottom: 12,
    },
    insightLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    insightLabelText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginLeft: 6,
    },
    insightText: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    trendText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2196F3',
        marginLeft: 6,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    activeFilterTab: {
        backgroundColor: Colors.primary,
    },
    filterTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    activeFilterTabText: {
        color: '#FFF',
    },
    filterBadge: {
        backgroundColor: '#FF5722',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    filterBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    }
});

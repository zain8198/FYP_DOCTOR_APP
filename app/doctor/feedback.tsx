import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, StatusBar, Platform } from "react-native";
import { Text, Avatar, useTheme } from "react-native-paper";
import { ref, get, onValue } from "firebase/database";
import { auth, db } from "../../firebase";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";

export default function DoctorFeedbackScreen() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRating, setTotalRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        if (!auth.currentUser) return;

        setLoading(true);
        const reviewsRef = ref(db, `reviews/${auth.currentUser.uid}`);

        // Use onValue for real-time updates
        const unsubscribe = onValue(reviewsRef, (snapshot) => {
            try {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const parsedReviews = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    }));

                    // Sort by timestamp (newest first), handling potential missing timestamps
                    parsedReviews.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                    setReviews(parsedReviews);

                    // Calculate stats
                    let sum = 0;
                    parsedReviews.forEach(r => sum += (r.rating || 0));
                    setTotalRating(sum / parsedReviews.length);
                    setReviewCount(parsedReviews.length);
                } else {
                    setReviews([]);
                    setTotalRating(0);
                    setReviewCount(0);
                }
            } catch (error) {
                console.error("Error processing reviews:", error);
            } finally {
                setLoading(false);
            }
        }, (error) => {
            console.error("Real-time reviews error:", error);
            setLoading(false);
        });

        // Cleanup function
        return () => unsubscribe();
    }, []);

    const renderStars = (rating: number) => {
        return (
            <View style={{ flexDirection: 'row' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={star <= rating ? "star" : "star-outline"}
                        size={16}
                        color="#FBC02D"
                    />
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Patient Feedback</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <View>
                    <Text style={styles.summaryTitle}>Overall Rating</Text>
                    <View style={styles.ratingRow}>
                        <Text style={styles.bigRating}>{totalRating.toFixed(1)}</Text>
                        <View>
                            {renderStars(Math.round(totalRating))}
                            <Text style={styles.reviewCount}>{reviewCount} Reviews</Text>
                        </View>
                    </View>
                </View>
                <Ionicons name="trophy-outline" size={40} color={Colors.primary} style={{ opacity: 0.8 }} />
            </View>

            {reviews.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="chatbox-ellipses-outline" size={60} color="#DDD" />
                    <Text style={styles.emptyText}>No reviews yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item }) => (
                        <View style={styles.reviewCard}>
                            <View style={styles.cardHeader}>
                                <Avatar.Text
                                    size={40}
                                    label={item.userName ? item.userName.substring(0, 2).toUpperCase() : "AN"}
                                    style={{ backgroundColor: Colors.primary }}
                                    color="white"
                                />
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={styles.userName}>{item.userName || "Anonymous"}</Text>
                                        <Text style={styles.date}>{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}</Text>
                                    </View>
                                    {renderStars(item.rating)}
                                </View>
                            </View>
                            <Text style={styles.reviewText}>{item.review}</Text>
                        </View>
                    )}
                />
            )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    summaryCard: {
        backgroundColor: '#FFF',
        margin: 20,
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    bigRating: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Colors.text,
    },
    reviewCount: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
        marginTop: 10,
        fontSize: 14,
    },
    reviewCard: {
        backgroundColor: '#FFF',
        marginBottom: 15,
        borderRadius: 12,
        padding: 15,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    userName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    reviewText: {
        color: '#555',
        lineHeight: 20,
        fontSize: 14,
    }
});

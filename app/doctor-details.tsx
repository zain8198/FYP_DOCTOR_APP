import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Platform, ActivityIndicator, TouchableOpacity } from "react-native";
import { Text, Button, Card, Avatar, useTheme, Chip } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, parse, addHours, isBefore, isEqual, addDays } from "date-fns";
import { ref, push, get, set, update } from "firebase/database";
import { auth, db } from "../firebase";
import { Colors } from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from 'expo-constants';

// Get API key from environment variables
const GEMINI_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export default function DoctorDetailsScreen() {
    const { id } = useLocalSearchParams();
    const theme = useTheme();
    const router = useRouter();

    const [doctor, setDoctor] = useState<any>(null);
    const [date, setDate] = useState(new Date());
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [reviewSummary, setReviewSummary] = useState<string | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchDoctor = async () => {
            try {
                const docRef = ref(db, `doctors/${id}`);
                const snapshot = await get(docRef);

                if (snapshot.exists()) {
                    const docData = snapshot.val();
                    setDoctor({ id, ...docData });
                } else {
                    setDoctor(null);
                }
            } catch (error) {
                console.error("Error fetching doctor details:", error);
                Alert.alert("Error", "Could not fetch doctor details.");
            } finally {
                setFetching(false);
            }
        };
        fetchDoctor();
    }, [id]);

    // Calculate Next Available Dates
    useEffect(() => {
        if (!doctor) return;

        const generateNextDates = () => {
            const nextDates = [];
            let currentCheckDate = new Date();
            let count = 0;
            const maxDaysToCheck = 14; // check next 2 weeks
            const requiredDates = 4;

            while (nextDates.length < requiredDates && count < maxDaysToCheck) {
                const dayName = format(currentCheckDate, "EEEE");
                // If doctor has availability days defined, filter by them. Otherwise assume all days.
                if (!doctor.availability?.days || doctor.availability.days.includes(dayName)) {
                    nextDates.push(new Date(currentCheckDate));
                }
                currentCheckDate = addDays(currentCheckDate, 1);
                count++;
            }
            setAvailableDates(nextDates);

            // Auto-select first available date
            if (nextDates.length > 0) {
                setDate(nextDates[0]);
            }
        };

        generateNextDates();
    }, [doctor]);


    // Fetch Booked Slots when Date changes
    useEffect(() => {
        if (!id || !doctor) return;

        const fetchSchedule = async () => {
            const dateStr = format(date, "yyyy-MM-dd");
            const scheduleRef = ref(db, `doctor_schedules/${id}/${dateStr}`);
            const snapshot = await get(scheduleRef);

            if (snapshot.exists()) {
                const scheduleData = snapshot.val();
                setBookedSlots(Object.keys(scheduleData)); // Keys are time slots e.g. "10:00 AM"
            } else {
                setBookedSlots([]);
            }
        };
        fetchSchedule();
    }, [id, doctor, date]);

    // Generate Slots based on Availability
    useEffect(() => {
        if (!doctor || !doctor.availability) {
            // Default slots (fallback)
            setAvailableSlots(["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"]);
            return;
        }

        const { days, startTime, endTime } = doctor.availability;
        const currentDayName = format(date, "EEEE"); // Monday, Tuesday...

        if (days && !days.includes(currentDayName)) {
            setAvailableSlots([]); // Not working today (Double check vs UI)
            return;
        }

        // Generate hourly slots
        const slots = [];
        // Simple generator assuming generic format "09:00 AM"
        const TIMES = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"];

        let startIndex = TIMES.indexOf(startTime);
        let endIndex = TIMES.indexOf(endTime);

        if (startIndex === -1) startIndex = 0;
        if (endIndex === -1) endIndex = TIMES.length - 1;

        for (let i = startIndex; i <= endIndex; i++) {
            slots.push(TIMES[i]);
        }
        setAvailableSlots(slots);
        setSelectedTimeSlot(""); // Reset selection on date change

    }, [doctor, date]);

    // Fetch and Generate Review Summary
    useEffect(() => {
        if (!id) return;

        const fetchAndSummarizeReviews = async () => {
            setLoadingSummary(true);
            try {
                const reviewsRef = ref(db, `reviews/${id}`);
                const snapshot = await get(reviewsRef);

                console.log("Review Summary Debug:", {
                    doctorId: id,
                    reviewsExist: snapshot.exists(),
                    reviewCount: snapshot.exists() ? Object.keys(snapshot.val()).length : 0
                });

                if (!snapshot.exists()) {
                    console.log("No reviews found for doctor:", id);
                    setReviewSummary(null);
                    setLoadingSummary(false);
                    return;
                }

                const reviewsData = snapshot.val();
                console.log("Raw reviews data:", reviewsData);

                // Extract review texts - check multiple possible field names
                const reviewTexts = Object.values(reviewsData).map((r: any) => {
                    return r.review || r.feedback || r.comment || r.text || r.message || "";
                }).filter(Boolean);

                console.log("Review texts:", reviewTexts);

                if (reviewTexts.length === 0) {
                    console.log("No valid review texts found");
                    setReviewSummary(null);
                    setLoadingSummary(false);
                    return;
                }

                // Generate AI Summary
                const prompt = `Summarize these doctor reviews in 2-3 concise bullet points. Highlight key strengths and any concerns:\n\n${reviewTexts.join('\n\n')}`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                });

                const data = await response.json();
                if (data.error) throw new Error(data.error.message);

                const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
                console.log("AI Summary generated:", summary);
                setReviewSummary(summary || "Unable to generate summary.");

            } catch (error) {
                console.error("Review Summary Error:", error);
                setReviewSummary(null);
            } finally {
                setLoadingSummary(false);
            }
        };

        fetchAndSummarizeReviews();
    }, [id]);


    const handleBook = async () => {
        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to book.");
            return;
        }
        if (!selectedTimeSlot) {
            Alert.alert("Required", "Please select a time slot.");
            return;
        }

        setLoading(true);
        try {
            const dateStr = format(date, "yyyy-MM-dd");
            const scheduleRef = ref(db, `doctor_schedules/${doctor.id}/${dateStr}/${selectedTimeSlot}`);

            // Double check availability (concurrency)
            const slotSnap = await get(scheduleRef);
            if (slotSnap.exists()) {
                Alert.alert("Sorry", "This slot was just booked by someone else.");
                setBookedSlots([...bookedSlots, selectedTimeSlot]); // update local
                setLoading(false);
                return;
            }

            // 1. Reserve Slot
            await set(scheduleRef, auth.currentUser.uid);

            // 2. Create Appointment Record
            const appointmentRef = ref(db, `appointments/${auth.currentUser.uid}`);
            const patientName = auth.currentUser.email?.split('@')[0] || "Patient";

            await push(appointmentRef, {
                doctorId: doctor.id,
                doctor: doctor.name,
                patientId: auth.currentUser.uid,
                patientName: patientName,
                professional: doctor.specialty || doctor.profession,
                date: format(date, "EEEE, d MMMM"),
                dateIso: dateStr,
                time: selectedTimeSlot,
                details: "General checkup",
                status: 'pending'
            });

            Alert.alert("Success", "Appointment Booked Successfully!");
            router.replace("/(tabs)/appointments");
        } catch (error: any) {
            Alert.alert("Booking Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    if (fetching) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!doctor) return null;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header Background */}
                <View style={styles.headerBg}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color={Colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Appointment</Text>
                        <TouchableOpacity style={styles.backBtn}>
                            <Ionicons name="heart-outline" size={24} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Doctor Profile Card */}
                <View style={styles.profileCard}>
                    <Avatar.Image size={100} source={{ uri: doctor.image || 'https://i.pravatar.cc/150?u=' + doctor.id }} style={{ backgroundColor: '#f0f0f0' }} />
                    <Text style={styles.name}>{doctor.name}</Text>
                    <Text style={styles.specialty}>{doctor.specialty || ' Specialist'}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="people" size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.statValue}>1000+</Text>
                            <Text style={styles.statLabel}>Patients</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="ribbon" size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.statValue}>{doctor.experience || '5'} Yrs</Text>
                            <Text style={styles.statLabel}>Exp.</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="star" size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.statValue}>{doctor.rating || '4.9'}</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About Doctor</Text>
                    <Text style={styles.bioText} numberOfLines={4}>
                        {doctor.bio || "Experienced specialist dedicated to providing top-quality healthcare. Focuses on patient comfort and effectively diagnosing various conditions."}
                    </Text>
                </View>

                {/* AI Review Summary */}
                {loadingSummary ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Patient Reviews 💬</Text>
                        <View style={styles.summaryCard}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={{ marginLeft: 10, color: Colors.textSecondary }}>Generating AI summary...</Text>
                        </View>
                    </View>
                ) : reviewSummary ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Patient Reviews 💬</Text>
                        <View style={styles.summaryCard}>
                            <View style={styles.aiTag}>
                                <Ionicons name="sparkles" size={14} color="#6C63FF" />
                                <Text style={styles.aiTagText}>AI Summary</Text>
                            </View>
                            <Text style={styles.summaryText}>{reviewSummary}</Text>
                        </View>
                    </View>
                ) : null}

                {/* Date Selection */}
                <View style={[styles.section, { paddingRight: 0 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 }}>
                        <Text style={styles.sectionTitle}>Select Date</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Calendar</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, paddingTop: 10 }}>
                        {availableDates.map((item, index) => {
                            const isSelected = format(date, "yyyy-MM-dd") === format(item, "yyyy-MM-dd");
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                                    onPress={() => setDate(item)}
                                >
                                    <Text style={[styles.dateDay, isSelected && styles.selectedDateText]}>
                                        {format(item, "EEE")}
                                    </Text>
                                    <Text style={[styles.dateNum, isSelected && styles.selectedDateText]}>
                                        {format(item, "d")}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            minimumDate={new Date()}
                        />
                    )}
                </View>

                {/* Time Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Available Slots</Text>
                    {availableSlots.length === 0 ? (
                        <View style={styles.emptySlots}>
                            <Ionicons name="close-circle-outline" size={40} color="#ccc" />
                            <Text style={{ color: '#999', marginTop: 10 }}>Doctor is not available currently.</Text>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                            {availableSlots.map((time, index) => {
                                const isSelected = selectedTimeSlot === time;
                                const isBooked = bookedSlots.includes(time);

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.timeChip,
                                            isSelected && styles.selectedTimeChip,
                                            isBooked && styles.bookedTimeChip
                                        ]}
                                        onPress={() => !isBooked && setSelectedTimeSlot(time)}
                                        disabled={isBooked}
                                    >
                                        <Text style={[
                                            styles.timeText,
                                            isSelected && styles.selectedTimeText,
                                            isBooked && styles.bookedTimeText
                                        ]}>
                                            {time}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </ScrollView>
                    )}
                </View>

            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.footer}>
                <View>
                    <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Total Price</Text>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.text }}>${doctor.price || 300}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.bookButton, (!selectedTimeSlot) && { backgroundColor: '#ccc' }]}
                    onPress={handleBook}
                    disabled={loading || !selectedTimeSlot}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.bookButtonText}>Book Appointment</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerBg: {
        backgroundColor: Colors.primary,
        height: 140,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    backBtn: {
        padding: 5,
    },
    profileCard: {
        alignItems: 'center',
        marginTop: -60,
        marginBottom: 20,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 10,
    },
    specialty: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%',
        backgroundColor: Colors.white,
        marginTop: 20,
        padding: 20,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    statItem: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 40,
        height: 40,
        backgroundColor: Colors.lightGreen,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
    },
    bioText: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    // Updated Date Styling
    dateCard: {
        width: 60,
        height: 70,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#EEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: '#FFF'
    },
    selectedDateCard: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary
    },
    dateDay: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        marginBottom: 5
    },
    dateNum: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    selectedDateText: {
        color: '#FFF'
    },
    timeChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EEE',
        marginRight: 10,
        backgroundColor: Colors.white,
    },
    selectedTimeChip: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    bookedTimeChip: {
        backgroundColor: '#f0f0f0',
        borderColor: '#ccc',
        opacity: 0.6
    },
    timeText: {
        color: Colors.text,
        fontWeight: '600',
    },
    selectedTimeText: {
        color: Colors.white,
    },
    bookedTimeText: {
        color: '#999',
        textDecorationLine: 'line-through'
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    bookButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    bookButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptySlots: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 10,
        borderStyle: 'dashed'
    },
    summaryCard: {
        backgroundColor: '#F8F9FF',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#E0E0FF',
    },
    aiTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEE9FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    aiTagText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#6C63FF',
        marginLeft: 4,
    },
    summaryText: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 22,
        flex: 1,
    }
});

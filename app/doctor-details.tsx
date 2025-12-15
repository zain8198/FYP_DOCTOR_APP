import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Platform, ActivityIndicator, TouchableOpacity } from "react-native";
import { Text, Button, Card, Avatar, useTheme, Chip } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ref, push, get } from "firebase/database";
import { auth, db } from "../firebase";
import { Colors } from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

export default function DoctorDetailsScreen() {
    const { id } = useLocalSearchParams();
    const theme = useTheme();
    const router = useRouter();

    const [doctor, setDoctor] = useState<any>(null);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState("10:00 AM");
    const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"];

    useEffect(() => {
        if (!id) {
            console.log("No ID parameter found");
            return;
        }
        console.log("Fetching details for Doctor ID:", id);

        const fetchDoctor = async () => {
            try {
                const docRef = ref(db, `doctors/${id}`);
                const snapshot = await get(docRef);
                console.log("Snapshot exists:", snapshot.exists());

                if (snapshot.exists()) {
                    const docData = snapshot.val();
                    console.log("Doctor data:", docData);
                    setDoctor({ id, ...docData });
                } else {
                    console.log("Doctor path not found in DB");
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

    if (fetching) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 10 }}>Loading Doctor Profile...</Text>
            </View>
        );
    }

    if (!doctor) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: Colors.white }}>
                <Text variant="headlineSmall" style={{ marginBottom: 10 }}>Doctor not found</Text>
                <Text variant="bodyMedium" style={{ color: 'red', marginBottom: 20 }}>
                    Searched ID: {String(id)}
                </Text>
                <Text variant="bodySmall" style={{ textAlign: 'center', marginBottom: 20 }}>
                    Make sure the doctor exists in the database under "doctors/{String(id)}"
                </Text>
                <Button mode="contained" onPress={() => router.back()}>Go Back</Button>
            </View>
        );
    }



    const handleBook = async () => {
        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to book.");
            return;
        }
        setLoading(true);
        try {
            const appointmentRef = ref(db, `appointments/${auth.currentUser.uid}`);
            const patientName = auth.currentUser.email?.split('@')[0] || "Patient";

            await push(appointmentRef, {
                doctorId: doctor.id,
                doctor: doctor.name,
                patientId: auth.currentUser.uid,
                patientName: patientName,
                professional: doctor.specialty || doctor.profession,
                date: format(date, "EEEE, d MMMM"),
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

                {/* Doctor Profile Card - Overlapping */}
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

                {/* Date Selection */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.sectionTitle}>Select Date</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Change</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateDisplay}>
                        <View style={styles.dateIcon}>
                            <Ionicons name="calendar" size={24} color={Colors.white} />
                        </View>
                        <Text style={styles.dateText}>{format(date, "EEEE, d MMMM yyyy")}</Text>
                    </View>

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
                    <Text style={styles.sectionTitle}>Available Slot</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                        {timeSlots.map((time, index) => {
                            const isSelected = selectedTimeSlot === time;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.timeChip, isSelected && styles.selectedTimeChip]}
                                    onPress={() => setSelectedTimeSlot(time)}
                                >
                                    <Text style={[styles.timeText, isSelected && styles.selectedTimeText]}>{time}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>

            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.footer}>
                <View>
                    <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Total Price</Text>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.text }}>${doctor.price || 300}</Text>
                </View>
                <TouchableOpacity style={styles.bookButton} onPress={handleBook} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.bookButtonText}>Book Now</Text>}
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
    dateDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 15,
        marginTop: 10,
    },
    dateIcon: {
        marginRight: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 10,
    },
    dateText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
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
    timeText: {
        color: Colors.text,
        fontWeight: '600',
    },
    selectedTimeText: {
        color: Colors.white,
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
    }
});

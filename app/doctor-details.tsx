import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Platform, ActivityIndicator } from "react-native";
import { Text, Button, Card, Avatar, useTheme, Chip } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ref, push, get } from "firebase/database";
import { auth, db } from "../firebase";
import ThemedBackground from "../components_legacy/ui/ThemedBackground";

export default function DoctorDetailsScreen() {
    const { id } = useLocalSearchParams();
    const theme = useTheme();
    const router = useRouter();

    const [doctor, setDoctor] = useState<any>(null);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

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
            <ThemedBackground style={{ justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 10 }}>Loading Doctor Profile...</Text>
            </ThemedBackground>
        );
    }

    if (!doctor) {
        return (
            <ThemedBackground style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text variant="headlineSmall" style={{ marginBottom: 10 }}>Doctor not found</Text>
                <Text variant="bodyMedium" style={{ color: 'red', marginBottom: 20 }}>
                    Searched ID: {String(id)}
                </Text>
                <Text variant="bodySmall" style={{ textAlign: 'center', marginBottom: 20 }}>
                    Make sure the doctor exists in the database under "doctors/{String(id)}"
                </Text>
                <Button mode="contained" onPress={() => router.back()}>Go Back</Button>
            </ThemedBackground>
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
            // Use email as name for now since we don't have a user profile setup yet
            const patientName = auth.currentUser.email?.split('@')[0] || "Patient";

            await push(appointmentRef, {
                doctorId: doctor.id,
                doctor: doctor.name,
                patientId: auth.currentUser.uid,
                patientName: patientName,
                professional: doctor.specialty || doctor.profession,
                date: format(date, "EEEE, MMM dd hh:mm a"),
                details: "General checkup",
                status: 'pending'
            });
            Alert.alert("Success", "Appointment Booked!");
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

    return (
        <ThemedBackground>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.header}>
                    <Avatar.Image size={120} source={{ uri: doctor.image || 'https://i.pravatar.cc/150?u=' + doctor.id }} />
                    <Text variant="headlineMedium" style={{ marginTop: 16, fontWeight: 'bold' }}>{doctor.name}</Text>
                    <Chip icon="doctor" style={{ marginTop: 8 }}>{doctor.specialty || doctor.profession || 'Specialist'}</Chip>
                    {doctor.experience && (
                        <Text variant="bodyMedium" style={{ marginTop: 4, color: theme.colors.secondary }}>
                            {doctor.experience} Years Experience
                        </Text>
                    )}
                </View>

                <Card style={styles.card} mode="outlined">
                    <Card.Content>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>About</Text>
                        <Text variant="bodyMedium" style={{ marginTop: 8, lineHeight: 22 }}>
                            {doctor.bio || "No biography available for this doctor."}
                        </Text>
                    </Card.Content>
                </Card>

                <View style={styles.section}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 10 }}>Select Date & Time</Text>
                    <Button mode="outlined" onPress={() => setShowDatePicker(true)} icon="calendar">
                        {format(date, "PPP p")}
                    </Button>
                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="datetime"
                            is24Hour={false}
                            onChange={onDateChange}
                        />
                    )}
                </View>

                <Button
                    mode="contained"
                    style={styles.bookButton}
                    contentStyle={{ paddingVertical: 8 }}
                    onPress={handleBook}
                    loading={loading}
                >
                    Confirm Booking
                </Button>
            </ScrollView>
        </ThemedBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    card: {
        marginBottom: 20,
    },
    section: {
        marginBottom: 30,
    },
    bookButton: {
        borderRadius: 12,
    }
});

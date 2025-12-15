import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Text, Card, Avatar, useTheme, Chip } from "react-native-paper";
import { ref, onValue } from "firebase/database";
import { auth, db } from "../../firebase";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

export default function AppointmentsScreen() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                const appointmentRef = ref(db, `appointments/${user.uid}`);
                onValue(appointmentRef, (snapshot) => {
                    const data = snapshot.val();
                    setAppointments(data ? Object.values(data) : []);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching appointments:", error);
                    setLoading(false);
                });
            } else {
                // Not logged in or logged out
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    if (loading) {
        return (
            <ThemedBackground style={{ justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </ThemedBackground>
        );
    }

    return (
        <ThemedBackground>
            <Text variant="headlineMedium" style={styles.title}>My Appointments</Text>

            {appointments.length === 0 ? (
                <View style={styles.emptyState}>
                    <Avatar.Icon size={80} icon="calendar-remove" style={{ backgroundColor: theme.colors.surfaceVariant }} />
                    <Text variant="bodyLarge" style={{ marginTop: 20, color: theme.colors.secondary }}>No appointments found.</Text>
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => (
                        <Card style={styles.card} mode="elevated">
                            <Card.Title
                                title={`Dr. ${item.doctor}`}
                                subtitle={item.professional || "Specialist"} // Fallback if professional not saved
                                left={(props) => <Avatar.Icon {...props} icon="doctor" />}
                                right={(props) => <Chip icon="clock" style={{ marginRight: 10 }}>{item.meeting || "Consultation"}</Chip>}
                            />
                            <Card.Content>
                                <View style={styles.row}>
                                    <Avatar.Icon size={24} icon="calendar" style={{ backgroundColor: 'transparent' }} color={theme.colors.primary} />
                                    <Text variant="bodyMedium" style={{ marginLeft: 8 }}>{item.date}</Text>
                                </View>
                            </Card.Content>
                        </Card>
                    )}
                />
            )}
        </ThemedBackground>
    );
}

const styles = StyleSheet.create({
    title: {
        fontWeight: "bold",
        marginBottom: 20,
        marginTop: 10,
    },
    card: {
        marginBottom: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    }
});

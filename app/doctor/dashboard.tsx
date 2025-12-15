import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, Card, Avatar, useTheme, ActivityIndicator } from "react-native-paper";
import { ref, get } from "firebase/database";
import { auth, db } from "../../firebase";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

export default function DoctorDashboard() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctorName, setDoctorName] = useState("");
    const theme = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            if (!auth.currentUser) return;
            setLoading(true);
            try {
                // Get Doctor Details
                const doctorRef = ref(db, `doctors/${auth.currentUser.uid}`);
                const docSnap = await get(doctorRef);
                if (!docSnap.exists()) return;
                const docData = docSnap.val();
                setDoctorName(docData.name);

                // Get All Appointments and Filter
                const aptRef = ref(db, "appointments");
                const aptSnap = await get(aptRef);
                if (aptSnap.exists()) {
                    const allApts = aptSnap.val();
                    let myApts: any[] = [];

                    // Traverse users
                    for (let userId in allApts) {
                        const userApts = allApts[userId];
                        for (let aptId in userApts) {
                            const apt = userApts[aptId];
                            if (apt.doctor === docData.name) {
                                // Use saved name or default
                                const patientName = apt.patientName || "Unknown Patient";

                                myApts.push({
                                    id: aptId,
                                    patientName,
                                    ...apt
                                });
                            }
                        }
                    }
                    setAppointments(myApts);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
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
            <Text variant="headlineSmall" style={styles.title}>Welcome, Dr. {doctorName}</Text>
            <Text variant="titleMedium" style={{ marginBottom: 20 }}>Your Appointments</Text>

            {appointments.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 50, color: theme.colors.secondary }}>No appointments upcoming.</Text>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <Card style={styles.card} mode="elevated">
                            <Card.Title
                                title={item.patientName}
                                subtitle={item.date}
                                left={(props) => <Avatar.Icon {...props} icon="account" />}
                            />
                            <Card.Content>
                                <Text variant="bodyMedium">Type: {item.professional || "Consulation"}</Text>
                                {item.details && <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{item.details}</Text>}
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
        marginTop: 10,
        marginBottom: 5,
        color: "#22177A"
    },
    card: {
        marginBottom: 16,
    }
});

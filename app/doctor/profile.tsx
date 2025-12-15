import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, Avatar, Button, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { ref, get } from "firebase/database";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

export default function DoctorProfileScreen() {
    const [doctor, setDoctor] = useState<any>(null);
    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        const fetchDoc = async () => {
            if (!auth.currentUser) return;
            const refDoc = ref(db, `doctors/${auth.currentUser.uid}`);
            const snap = await get(refDoc);
            if (snap.exists()) {
                setDoctor(snap.val());
            }
        };
        fetchDoc();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.replace("/(auth)/doctor-login");
    };

    return (
        <ThemedBackground style={{ alignItems: 'center' }}>
            <Avatar.Icon size={100} icon="doctor" style={{ marginTop: 40, backgroundColor: theme.colors.primary }} />

            {doctor ? (
                <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>Dr. {doctor.name}</Text>
                    <Text variant="titleMedium" style={{ color: theme.colors.secondary }}>{doctor.profession}</Text>

                    <View style={styles.infoCard}>
                        <Text variant="bodyLarge">Greeting Message:</Text>
                        <Text variant="bodyMedium" style={{ fontStyle: 'italic', marginTop: 5 }}>"Hello! I am ready to help you."</Text>
                    </View>
                </View>
            ) : (
                <Text>Loading Profile...</Text>
            )}

            <Button
                mode="contained"
                onPress={handleLogout}
                style={styles.logoutButton}
                buttonColor={theme.colors.error}
            >
                Log Out
            </Button>
        </ThemedBackground>
    );
}

const styles = StyleSheet.create({
    infoCard: {
        marginTop: 30,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        width: '100%',
        elevation: 2
    },
    logoutButton: {
        marginTop: 50,
        width: '80%',
    }
});

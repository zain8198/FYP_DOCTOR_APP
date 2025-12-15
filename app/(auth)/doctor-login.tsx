import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { ref, get } from "firebase/database";
import { auth, db } from "../../firebase";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

export default function DoctorLoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const theme = useTheme();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password");
            return;
        }
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if doctor exists in DB
            // Verify doctor role in database with timeout
            const doctorRef = ref(db, `doctors/${user.uid}`);
            const snapshot: any = await Promise.race([
                get(doctorRef),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Database check timed out.")), 10000))
            ]);

            if (snapshot.exists()) {
                router.replace("/doctor/dashboard");
            } else {
                Alert.alert("Access Denied", "No doctor account found.");
                await auth.signOut();
            }
        } catch (error: any) {
            Alert.alert("Login Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedBackground style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    Doctor Portal
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>
                    Login to manage appointments
                </Text>
            </View>

            <View style={styles.form}>
                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                />
                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                />

                <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.button}
                >
                    Login
                </Button>

                <TouchableOpacity onPress={() => router.push("/(auth)/doctor-register")} style={styles.link}>
                    <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                        New Doctor? Verify & Register
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.link}>
                    <Text style={{ color: theme.colors.secondary }}>
                        Not a doctor? User Login
                    </Text>
                </TouchableOpacity>
            </View>
        </ThemedBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
    },
    header: {
        marginBottom: 40,
        alignItems: "center",
    },
    form: {
        width: "100%",
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 10,
        borderRadius: 8,
    },
    link: {
        marginTop: 20,
        alignItems: 'center',
    }
});

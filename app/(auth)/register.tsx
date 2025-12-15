import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../../firebase";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

export default function RegisterScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const theme = useTheme();

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password");
            return;
        }
        setLoading(true);
        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Registered new user:", userCredentials.user.email);
            Alert.alert("Success", "Account created! Please login.");
            router.back(); // Go back to login
        } catch (error: any) {
            Alert.alert("Registration Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedBackground style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    Create Account
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>
                    Sign up to get started
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
                    onPress={handleSignUp}
                    // loading={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                >
                    Sign Up
                </Button>

                <View style={styles.footer}>
                    <Text variant="bodyMedium">Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                            Log In
                        </Text>
                    </TouchableOpacity>
                </View>
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
    buttonContent: {
        paddingVertical: 6,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 20,
    }
});

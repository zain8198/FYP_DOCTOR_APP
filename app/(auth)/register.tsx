import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../../firebase";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

export default function RegisterScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const theme = useTheme();

    const handleSignUp = async () => {
        if (!email) {
            Alert.alert("Required Field", "Please enter your email address.");
            return;
        }
        if (!password) {
            Alert.alert("Required Field", "Please enter a password.");
            return;
        }

        setLoading(true);
        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Registered new user:", userCredentials.user.email);
            Alert.alert("Success", "Account created successfully! Please login.");
            router.back(); // Go back to login
        } catch (error: any) {
            let message = "Registration failed. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                message = "This email address is already registered.";
            } else if (error.code === 'auth/invalid-email') {
                message = "The email address format is invalid.";
            } else if (error.code === 'auth/weak-password') {
                message = "Password is too weak. It must be at least 6 characters.";
            }
            Alert.alert("Registration Failed", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedBackground style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 8 }}>
                            Create Account
                        </Text>
                        <Text variant="titleMedium" style={{ color: theme.colors.secondary, opacity: 0.8 }}>
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
                            left={<TextInput.Icon icon="email-outline" />}
                            style={styles.input}
                        />
                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry={!showPassword}
                            left={<TextInput.Icon icon="lock-outline" />}
                            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                            style={styles.input}
                        />

                        <Button
                            mode="contained"
                            onPress={handleSignUp}
                            loading={loading}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.buttonLabel}
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
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 48,
        alignItems: "center",
    },
    form: {
        width: "100%",
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.7)'
    },
    button: {
        marginTop: 8,
        borderRadius: 12,
        elevation: 2,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    buttonLabel: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 32,
    }
});

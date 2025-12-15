import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, Image } from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../../firebase";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const theme = useTheme();

    const handleLogin = async () => {
        if (!email) {
            Alert.alert("Required Field", "Please enter your email address.");
            return;
        }
        if (!password) {
            Alert.alert("Required Field", "Please enter your password.");
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.replace("/(tabs)/home");
        } catch (error: any) {
            let message = "Login failed. Please try again.";
            if (error.code === 'auth/invalid-email') {
                message = "The email address format is invalid.";
            } else if (error.code === 'auth/user-not-found') {
                message = "No account found with this email.";
            } else if (error.code === 'auth/wrong-password') {
                message = "Incorrect password. Please try again.";
            } else if (error.code === 'auth/invalid-credential') {
                message = "Invalid credentials. Please check your email and password.";
            }
            Alert.alert("Login Failed", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedBackground style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 8 }}>
                        Welcome Back!
                    </Text>
                    <Text variant="titleMedium" style={{ color: theme.colors.secondary, opacity: 0.8 }}>
                        Sign in to continue
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
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.buttonLabel}
                    >
                        Login
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={() => router.push("/(auth)/register")}
                        style={[styles.button, styles.registerButton]}
                        contentStyle={styles.buttonContent}
                    >
                        Create Account
                    </Button>

                    < TouchableOpacity onPress={() => router.push("/(auth)/doctor-login" as any)} style={styles.link}>
                        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                            Are you a Doctor? Login here
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    registerButton: {
        marginTop: 16,
        borderColor: 'transparent',
    },
    buttonContent: {
        paddingVertical: 8,
    },
    buttonLabel: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    link: {
        marginTop: 32,
        alignItems: 'center',
    }
});

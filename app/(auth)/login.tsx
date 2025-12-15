import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../../firebase";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

export default function LoginScreen() {
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
            await signInWithEmailAndPassword(auth, email, password);
            // Auth listener or manual redirect could handle this, but for now manual:
            router.replace("/(tabs)/home");
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
                    Welcome Back!
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>
                    Book your appointment effortlessly
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
                    contentStyle={styles.buttonContent}
                >
                    Login
                </Button>

                <Button
                    mode="outlined"
                    onPress={() => router.push("/(auth)/register")}
                    style={styles.button}
                >
                    Register
                </Button>

                <TouchableOpacity onPress={() => router.push("/(auth)/doctor-login" as any)} style={styles.link}>
                    <Text style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>
                        Are you a Doctor? Login here
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
    buttonContent: {
        paddingVertical: 6,
    },
    link: {
        marginTop: 20,
        alignItems: 'center',
    }
});

import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Avatar, Button, TextInput, Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { ref, get, set } from "firebase/database";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

export default function ProfileScreen() {
    const [name, setName] = useState(auth.currentUser?.displayName || "");
    const [email] = useState(auth.currentUser?.email || "");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        if (!auth.currentUser) return;
        const userRef = ref(db, `users/${auth.currentUser.uid}`);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setBio(data.bio || "");
                if (data.displayName) setName(data.displayName);
            }
        });
    }, []);

    const handleSave = async () => {
        if (!auth.currentUser) return;
        setLoading(true);
        try {
            await set(ref(db, `users/${auth.currentUser.uid}`), {
                displayName: name,
                email,
                bio,
                profileImage: auth.currentUser.photoURL
            });
            Alert.alert("Success", "Profile updated!");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace("/(auth)/login");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    return (
        <ThemedBackground>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Avatar.Text size={100} label={name ? name[0].toUpperCase() : "U"} style={{ backgroundColor: theme.colors.primary }} />
                    <Text variant="headlineSmall" style={{ marginTop: 10, fontWeight: 'bold' }}>{name || "User"}</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>{email}</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        label="Full Name"
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Bio"
                        value={bio}
                        onChangeText={setBio}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                    />
                    <TextInput
                        label="Email"
                        value={email}
                        disabled
                        mode="outlined"
                        style={styles.input}
                    />

                    <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button}>
                        Save Profile
                    </Button>

                    <Button mode="outlined" onPress={handleLogout} textColor={theme.colors.error} style={[styles.button, { marginTop: 20, borderColor: theme.colors.error }]}>
                        Log Out
                    </Button>
                </View>
            </ScrollView>
        </ThemedBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        alignItems: "center",
        marginBottom: 30,
        marginTop: 20,
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
    }
});

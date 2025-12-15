import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { TextInput, Button, Text, useTheme, Menu, Divider } from "react-native-paper";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { ref, set } from "firebase/database";
import { auth, db } from "../../firebase";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

const SPECIALTIES = [
    "General Physician",
    "Cardiologist",
    "Dentist",
    "Dermatologist",
    "Gynecologist",
    "Neurologist",
    "Orthopedic",
    "Pediatrician",
    "Psychiatrist",
    "ENT Specialist",
    "Eye Specialist"
];

export default function DoctorRegisterScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [phone, setPhone] = useState("");
    const [experience, setExperience] = useState("");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);

    // Dropdown State
    const [visible, setVisible] = useState(false);

    const router = useRouter();
    const theme = useTheme();

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    const handleSignUp = async () => {
        if (!name || !email || !password || !specialty || !phone || !experience) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }
        setLoading(true);
        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredentials.user;

            // Save doctor details to Realtime Database with timeout
            const doctorRef = ref(db, `doctors/${user.uid}`);
            await Promise.race([
                set(doctorRef, {
                    name: name,
                    email: email,
                    phone: phone,
                    specialty: specialty,
                    profession: specialty,
                    experience: experience,
                    bio: bio || "Experienced medical professional dedicated to patient care.",
                    role: 'doctor',
                    rating: 5.0 // Default rating
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Database connection timeout. Check internet.")), 10000))
            ]);

            Alert.alert("Success", "Doctor account created! Please login.");
            router.replace("/(auth)/doctor-login");
        } catch (error: any) {
            Alert.alert("Registration Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedBackground>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text variant="headlineLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                        Doctor Sign Up
                    </Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>
                        Join our medical network
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        label="Full Name *"
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        style={styles.input}
                    />

                    {/* Specialty Dropdown */}
                    <Menu
                        visible={visible}
                        onDismiss={closeMenu}
                        anchor={
                            <TouchableOpacity onPress={openMenu}>
                                <TextInput
                                    label="Specialty *"
                                    value={specialty}
                                    mode="outlined"
                                    editable={false}
                                    right={<TextInput.Icon icon="chevron-down" />}
                                    style={styles.input}
                                />
                            </TouchableOpacity>
                        }>
                        {SPECIALTIES.map((item) => (
                            <Menu.Item
                                key={item}
                                onPress={() => { setSpecialty(item); closeMenu(); }}
                                title={item}
                            />
                        ))}
                    </Menu>

                    <TextInput
                        label="Experience (Years) *"
                        value={experience}
                        onChangeText={setExperience}
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.input}
                    />

                    <TextInput
                        label="Phone Number *"
                        value={phone}
                        onChangeText={setPhone}
                        mode="outlined"
                        keyboardType="phone-pad"
                        style={styles.input}
                    />

                    <TextInput
                        label="Short Bio / About You"
                        value={bio}
                        onChangeText={setBio}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                    />

                    <TextInput
                        label="Email *"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.input}
                    />
                    <TextInput
                        label="Password *"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSignUp}
                        loading={loading}
                        style={styles.button}
                    >
                        Register as Doctor
                    </Button>

                    <View style={styles.footer}>
                        <Text variant="bodyMedium">Already registered? </Text>
                        <TouchableOpacity onPress={() => router.replace("/(auth)/doctor-login")}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                Log In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </ThemedBackground>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingVertical: 20
    },
    header: {
        marginBottom: 20,
        alignItems: "center",
    },
    form: {
        width: "100%",
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'white'
    },
    button: {
        marginTop: 10,
        borderRadius: 8,
        paddingVertical: 5
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 30
    }
});

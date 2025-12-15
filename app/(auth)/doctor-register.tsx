import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, FlatList, Image } from "react-native";
import { TextInput, Button, Text, useTheme, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';


import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { ref, set } from "firebase/database";
// Storage imports removed as we are using Cloudinary
import { auth, db } from "../../firebase";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";
import * as ImagePicker from 'expo-image-picker';

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
    const [clinic, setClinic] = useState("");
    const [fee, setFee] = useState("");
    const [license, setLicense] = useState("");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);
    const [documentUri, setDocumentUri] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Modal State for Dropdown
    const [modalVisible, setModalVisible] = useState(false);

    const router = useRouter();
    const theme = useTheme();

    const pickDocument = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setDocumentUri(result.assets[0].uri);
        }
    };

    const uploadImageToCloudinary = async (uri: string) => {
        try {
            const formData = new FormData();
            // @ts-ignore
            formData.append('file', {
                uri: uri,
                type: 'image/jpeg',
                name: 'upload.jpg',
            });
            formData.append('upload_preset', 'doctor--app');
            formData.append('cloud_name', 'dclh5rrgv');

            const response = await fetch('https://api.cloudinary.com/v1_1/dclh5rrgv/image/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.secure_url;
        } catch (error: any) {
            console.error("Cloudinary upload error:", error);
            throw error;
        }
    };

    const handleSignUp = async () => {
        // Validation with specific messages
        if (!name) return Alert.alert("Required Field", "Please enter your full name.");
        if (!email) return Alert.alert("Required Field", "Please enter your email address.");
        if (!password) return Alert.alert("Required Field", "Please enter a password.");
        if (!specialty) return Alert.alert("Required Field", "Please select your medical specialty.");
        if (!phone) return Alert.alert("Required Field", "Please enter your phone number.");
        if (!experience) return Alert.alert("Required Field", "Please enter your years of experience.");
        if (!clinic) return Alert.alert("Required Field", "Please enter your clinic or hospital name.");
        if (!fee) return Alert.alert("Required Field", "Please enter your consultation fee.");
        if (!license) return Alert.alert("Required Field", "Please enter your medical license number.");

        if (!documentUri) {
            Alert.alert("Document Required", "Please upload your medical license for verification.");
            return;
        }

        setLoading(true);
        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredentials.user;

            // Upload Document to Cloudinary
            const downloadURL = await uploadImageToCloudinary(documentUri);

            // Save doctor details to Realtime Database
            const doctorRef = ref(db, `doctors/${user.uid}`);
            await set(doctorRef, {
                name,
                email,
                phone,
                specialty,
                profession: specialty, // Legacy support
                experience,
                clinic,
                consultationFee: fee,
                licenseNumber: license,
                licenseDocumentUrl: downloadURL,
                bio: bio || "Experienced medical professional dedicated to patient care.",
                role: 'doctor',
                rating: 5.0, // Default rating
                isVerified: false // Requires admin verification
            });

            Alert.alert("Success", "Doctor account created! Verification pending. Please login.");
            router.replace("/(auth)/doctor-login");
        } catch (error: any) {
            let message = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                message = "This email address is already registered. Please log in instead or use a different email.";
            } else if (error.code === 'auth/invalid-email') {
                message = "The email address format is invalid.";
            } else if (error.code === 'auth/weak-password') {
                message = "Password is too weak. Please use a stronger password (at least 6 characters).";
            } else if (error.message) {
                message = error.message;
            }
            Alert.alert("Registration Failed", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedBackground style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    Doctor Registration
                </Text>
                <Text variant="titleSmall" style={{ color: theme.colors.secondary }}>
                    Join our trusted medical network
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>Personal Information</Text>
                    <TextInput
                        label="Full Name *"
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        left={<TextInput.Icon icon="account" />}
                        style={styles.input}
                    />
                    <TextInput
                        label="Email *"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        left={<TextInput.Icon icon="email" />}
                        style={styles.input}
                    />
                    <TextInput
                        label="Password *"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        left={<TextInput.Icon icon="lock" />}
                        right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                        style={styles.input}
                    />
                    <TextInput
                        label="Phone Number *"
                        value={phone}
                        onChangeText={setPhone}
                        mode="outlined"
                        keyboardType="phone-pad"
                        left={<TextInput.Icon icon="phone" />}
                        style={styles.input}
                    />
                </View>

                <View style={styles.section}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>Professional Details</Text>

                    <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.8}>
                        <TextInput
                            label="Specialty *"
                            value={specialty}
                            mode="outlined"
                            editable={false}
                            left={<TextInput.Icon icon="doctor" />}
                            right={<TextInput.Icon icon="chevron-down" />}
                            style={styles.input}
                            pointerEvents="none"
                        />
                    </TouchableOpacity>

                    <TextInput
                        label="Experience (Years) *"
                        value={experience}
                        onChangeText={setExperience}
                        mode="outlined"
                        keyboardType="numeric"
                        left={<TextInput.Icon icon="briefcase" />}
                        style={styles.input}
                    />
                    <TextInput
                        label="Medical License Number *"
                        value={license}
                        onChangeText={setLicense}
                        mode="outlined"
                        left={<TextInput.Icon icon="badge-account" />}
                        style={styles.input}
                    />
                </View>

                <View style={styles.section}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>Clinic & Fees</Text>
                    <TextInput
                        label="Clinic / Hospital Name *"
                        value={clinic}
                        onChangeText={setClinic}
                        mode="outlined"
                        left={<TextInput.Icon icon="hospital-building" />}
                        style={styles.input}
                    />
                    <TextInput
                        label="Consultation Fee (PKR) *"
                        value={fee}
                        onChangeText={setFee}
                        mode="outlined"
                        keyboardType="numeric"
                        left={<TextInput.Icon icon="cash" />}
                        style={styles.input}
                    />
                    <TextInput
                        label="Short Bio"
                        value={bio}
                        onChangeText={setBio}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        left={<TextInput.Icon icon="text-short" />}
                        style={styles.input}
                    />
                </View>

                <View style={styles.section}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>Verification</Text>
                    <Text variant="bodySmall" style={{ marginBottom: 10, color: theme.colors.secondary }}>
                        Please upload a clear image of your Medical License / PMDC Certificate.
                    </Text>

                    <TouchableOpacity onPress={pickDocument} style={[styles.uploadButton, { borderColor: theme.colors.primary }]}>
                        {documentUri ? (
                            <Image source={{ uri: documentUri }} style={styles.uploadedImage} />
                        ) : (
                            <View style={{ alignItems: 'center' }}>
                                <MaterialCommunityIcons name="cloud-upload" size={40} color={theme.colors.primary} />
                                <Text style={{ color: theme.colors.primary, marginTop: 5 }}>Tap to Upload Document</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {documentUri && (
                        <Button mode="text" onPress={() => setDocumentUri(null)} textColor="red">
                            Remove Document
                        </Button>
                    )}
                </View>

                <Button
                    mode="contained"
                    onPress={handleSignUp}
                    loading={loading}
                    style={styles.submitButton}
                    contentStyle={{ height: 50 }}
                    labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
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
            </ScrollView>

            {/* Specialty Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Select Specialty</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={SPECIALTIES}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSpecialty(item);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text variant="bodyLarge">{item}</Text>
                                    {specialty === item && <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>✓</Text>}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </ThemedBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        alignItems: "center",
        backgroundColor: 'rgba(255,255,255,0.9)',
        zIndex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        marginBottom: 12,
        fontWeight: 'bold',
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    uploadButton: {
        height: 150,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
        overflow: 'hidden',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    submitButton: {
        marginTop: 10,
        borderRadius: 12,
        elevation: 4,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 24,
        marginBottom: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});

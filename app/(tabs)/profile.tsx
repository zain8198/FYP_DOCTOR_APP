import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, Image, Platform, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { ref as dbRef, get, update } from "firebase/database";
import { signOut, updateProfile } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../firebase";
import { Colors } from "../../constants/Colors";

export default function ProfileScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!auth.currentUser) return;
        setEmail(auth.currentUser.email || "");
        setName(auth.currentUser.displayName || "");
        setImage(auth.currentUser.photoURL || null);

        const userRef = dbRef(db, `users/${auth.currentUser.uid}`);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.bio) setBio(data.bio);
                if (data.phone) setPhone(data.phone);
                // Also sync local state if DB has newer/better data
                if (data.photoURL) setImage(data.photoURL);
            }
        });
    }, []);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert("Error", "Could not pick image.");
        }
    };

    const uploadImageToCloudinary = async (uri: string) => {
        try {
            const formData = new FormData();

            // Append the file
            // @ts-ignore
            formData.append('file', {
                uri: uri,
                type: 'image/jpeg', // Defaulting to jpeg for simplicity
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

            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.secure_url;
        } catch (error: any) {
            console.error("Cloudinary upload error:", error);
            throw error;
        }
    };

    const handleSave = async () => {
        if (!auth.currentUser) return;
        if (!name.trim()) {
            Alert.alert("Validation", "Name cannot be empty.");
            return;
        }

        setLoading(true);
        try {
            let photoURL = image;

            // If image is local (starts with file:// or content://), upload it
            if (image && (image.startsWith("file://") || image.startsWith("content://"))) {
                photoURL = await uploadImageToCloudinary(image);
            }

            // Update Auth Profile
            if (photoURL) {
                await updateProfile(auth.currentUser, { displayName: name, photoURL });
            } else {
                await updateProfile(auth.currentUser, { displayName: name });
            }

            // Update Database
            await update(dbRef(db, `users/${auth.currentUser.uid}`), {
                displayName: name,
                email,
                phone,
                bio,
                photoURL, // Save the consistent URL
                updatedAt: new Date().toISOString()
            });

            Alert.alert("Success", "Profile updated successfully!");
        } catch (error: any) {
            Alert.alert("Error", "Failed to update profile: " + error.message);
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
        <View style={styles.container}>
            <View style={styles.headerBackground} />

            {/* Fixed Header Section */}
            <View style={styles.staticHeaderContainer}>
                <View style={styles.profileHeader}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Text style={styles.initials}>{name ? name[0].toUpperCase() : "U"}</Text>
                            </View>
                        )}
                        <View style={styles.editIconContainer}>
                            <Ionicons name="camera" size={20} color="white" />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.headerName}>{name || "User"}</Text>
                    <Text style={styles.headerEmail}>{email}</Text>
                </View>
            </View>

            {/* Scrollable Form Inputs */}
            <ScrollView contentContainerStyle={styles.formScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your full name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+1 234 567 890"
                            placeholderTextColor="#999"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell us about yourself..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={email}
                            editable={false}
                        />
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
                    </TouchableOpacity>

                </View>
            </ScrollView>

            {/* Absolute Logout Button */}
            <TouchableOpacity style={styles.logoutAbsolute} onPress={handleLogout}>
                <Ionicons name="power" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 150,
        backgroundColor: Colors.primary,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    logoutAbsolute: {
        position: 'absolute',
        top: 50, // Adjust based on Statusbar
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 20,
        zIndex: 10
    },
    staticHeaderContainer: {
        paddingTop: 60,
        paddingHorizontal: 20,
        marginBottom: 10,
        zIndex: 1
    },
    formScrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Extra space for scrolling past bottom
        paddingTop: 10
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
        elevation: 10,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'white',
        backgroundColor: '#f0f0f0',
    },
    placeholderAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0E0E0',
    },
    initials: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#757575',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: Colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    headerName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 10,
    },
    headerEmail: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    formContainer: {
        paddingTop: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.text,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textArea: {
        minHeight: 100,
    },
    disabledInput: {
        backgroundColor: '#f9f9f9',
        color: '#999',
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

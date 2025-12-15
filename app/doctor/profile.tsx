import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Image, Platform, SafeAreaView } from "react-native";
import { Text, Avatar, Button, TextInput, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { ref, get, update } from "firebase/database";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

export default function DoctorProfileScreen() {
    const [profile, setProfile] = useState({
        name: '',
        specialty: '',
        experience: '',
        price: '',
        bio: '',
        image: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchDoc = async () => {
            if (!auth.currentUser) return;
            const refDoc = ref(db, `doctors/${auth.currentUser.uid}`);
            const snap = await get(refDoc);
            if (snap.exists()) {
                const data = snap.val();
                setProfile({
                    name: data.name || '',
                    specialty: data.specialty || data.profession || '',
                    experience: data.experience || '',
                    price: data.price ? String(data.price) : '',
                    bio: data.bio || '',
                    image: data.image || ''
                });
            }
            setLoading(false);
        };
        fetchDoc();
    }, []);

    const pickImage = async () => {
        // @ts-ignore
        const { status } = await import('expo-image-picker').then(mod => mod.requestMediaLibraryPermissionsAsync());
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
            return;
        }

        const result = await import('expo-image-picker').then(mod => mod.launchImageLibraryAsync({
            mediaTypes: mod.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        }));

        if (!result.canceled) {
            setProfile({ ...profile, image: result.assets[0].uri });
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

    const handleSave = async () => {
        if (!auth.currentUser) return;
        setSaving(true);
        try {
            let imageUrl = profile.image;

            // Check if it's a local URI (needs upload)
            if (profile.image && (profile.image.startsWith('file://') || profile.image.startsWith('content://'))) {
                imageUrl = await uploadImageToCloudinary(profile.image);
            }

            const refDoc = ref(db, `doctors/${auth.currentUser.uid}`);
            await update(refDoc, {
                name: profile.name,
                specialty: profile.specialty,
                profession: profile.specialty,
                experience: profile.experience,
                price: profile.price,
                bio: profile.bio,
                image: imageUrl
            });

            // Update Auth Profile too if possible
            // await updateProfile(auth.currentUser, { photoURL: imageUrl });

            Alert.alert("Success", "Profile updated successfully!");
        } catch (error) {
            console.error("Profile save error:", error);
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.replace("/(auth)/doctor-login");
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Profile Section */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Avatar.Image
                            size={100}
                            source={{ uri: profile.image || 'https://i.pravatar.cc/150?img=11' }}
                        />
                        <TouchableOpacity style={styles.camIcon} onPress={pickImage}>
                            <Ionicons name="camera" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text variant="headlineSmall" style={styles.name}>Dr. {profile.name}</Text>
                    <Text style={styles.specialty}>{profile.specialty || "Specialist"}</Text>
                </View>

                {/* Form Section */}
                <View style={styles.form}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>

                    <TextInput
                        label="Full Name"
                        value={profile.name}
                        onChangeText={t => setProfile({ ...profile, name: t })}
                        mode="outlined"
                        style={styles.input}
                        outlineColor="#DDD"
                        activeOutlineColor={Colors.primary}
                    />

                    <View style={styles.row}>
                        <TextInput
                            label="Specialty"
                            value={profile.specialty}
                            onChangeText={t => setProfile({ ...profile, specialty: t })}
                            mode="outlined"
                            style={[styles.input, { flex: 1, marginRight: 10 }]}
                            outlineColor="#DDD"
                            activeOutlineColor={Colors.primary}
                        />
                        <TextInput
                            label="Experience (Yrs)"
                            value={profile.experience}
                            onChangeText={t => setProfile({ ...profile, experience: t })}
                            mode="outlined"
                            style={[styles.input, { flex: 0.6 }]}
                            outlineColor="#DDD"
                            activeOutlineColor={Colors.primary}
                        />
                    </View>

                    <TextInput
                        label="Consultation Fee ($)"
                        value={profile.price}
                        onChangeText={t => setProfile({ ...profile, price: t })}
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.input}
                        outlineColor="#DDD"
                        activeOutlineColor={Colors.primary}
                    />

                    <TextInput
                        label="Bio / Description"
                        value={profile.bio}
                        onChangeText={t => setProfile({ ...profile, bio: t })}
                        mode="outlined"
                        multiline
                        numberOfLines={4}
                        style={styles.input}
                        outlineColor="#DDD"
                        activeOutlineColor={Colors.primary}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={saving}
                        style={styles.saveBtn}
                    >
                        Save Changes
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={handleLogout}
                        style={styles.logoutBtn}
                        textColor={Colors.error}
                    >
                        Log Out
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF",
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#F5F7FA', // Light grey header
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    camIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    name: {
        fontWeight: 'bold',
        color: '#333',
    },
    specialty: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    form: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    input: {
        marginBottom: 15,
        backgroundColor: '#FFF',
    },
    row: {
        flexDirection: 'row',
    },
    saveBtn: {
        marginTop: 10,
        backgroundColor: Colors.primary,
        paddingVertical: 5,
        borderRadius: 8,
    },
    logoutBtn: {
        marginTop: 15,
        borderColor: Colors.error,
        borderRadius: 8,
    }
});

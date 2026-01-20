import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { auth, db } from '../firebase';
import { ref, push } from 'firebase/database';
import Constants from 'expo-constants';
import { callGeminiAPI } from '../utils/geminiAPI';

interface Medicine {
    name: string;
    dosage: string;
    frequency: string;
}

interface PrescriptionAnalysis {
    medicines: Medicine[];
    advice: string;
}

export default function PrescriptionAnalyzer() {
    const router = useRouter();
    const [image, setImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<PrescriptionAnalysis | null>(null);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera roll permissions needed.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64 && result.assets[0].uri) {
            setImage(result.assets[0].uri);
            analyzePrescription(result.assets[0].base64);
        }
    };

    const takePicture = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permissions needed.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64 && result.assets[0].uri) {
            setImage(result.assets[0].uri);
            analyzePrescription(result.assets[0].base64);
        }
    };

    const analyzePrescription = async (base64Image: string) => {
        setAnalyzing(true);
        setResults(null);

        try {
            const prompt = 'Extract medicines from this prescription. Return JSON: { medicines: [{ name, dosage, frequency }], advice: \"...\" }';

            // Note: Prescription analyzer uses vision model with image data
            // For now, keeping direct API call since our wrapper doesn't support vision yet
            // TODO: Extend geminiAPI.ts to support vision model with inline_data
            const GEMINI_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY_1 ||
                Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY ||
                process.env.EXPO_PUBLIC_GEMINI_API_KEY_1 ||
                process.env.EXPO_PUBLIC_GEMINI_API_KEY;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const analysis = JSON.parse(cleanJson);

            setResults(analysis);
        } catch (error) {
            Alert.alert('Analysis Failed', 'Could not analyze prescription.');
            setImage(null);
        } finally {
            setAnalyzing(false);
        }
    };

    const savePrescription = async () => {
        if (!auth.currentUser || !results) return;
        try {
            const prescriptionRef = ref(db, `prescriptions/${auth.currentUser.uid}`);
            await push(prescriptionRef, {
                imageUrl: image,
                medicines: results.medicines,
                advice: results.advice,
                date: new Date().toISOString(),
                timestamp: Date.now()
            });
            Alert.alert('Saved!', 'Prescription saved to history.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save.');
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name='arrow-back' size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Prescription Analyzer</Text>
                    <View style={{ width: 40 }} />
                </View>

                {!image && (
                    <View style={styles.uploadSection}>
                        <TouchableOpacity style={styles.uploadBtn} onPress={takePicture}>
                            <Ionicons name='camera' size={32} color={Colors.primary} />
                            <Text style={styles.uploadBtnText}>Take Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                            <Ionicons name='images' size={32} color={Colors.primary} />
                            <Text style={styles.uploadBtnText}>Gallery</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {image && (
                    <View style={styles.imageSection}>
                        <Image source={{ uri: image }} style={styles.prescriptionImage} />
                    </View>
                )}

                {analyzing && (
                    <View style={styles.analyzingCard}>
                        <ActivityIndicator size='large' color={Colors.primary} />
                        <Text style={styles.analyzingText}>Analyzing...</Text>
                    </View>
                )}

                {results && (
                    <View style={styles.resultsSection}>
                        <Text style={styles.resultsTitle}>Medicines Detected:</Text>
                        {results.medicines?.map((med, index) => (
                            <View key={index} style={styles.medicineCard}>
                                <Text style={styles.medicineName}>{med.name}</Text>
                                <Text style={styles.medicineDosage}>{med.dosage} • {med.frequency}</Text>
                            </View>
                        ))}
                        {results.advice && (
                            <View style={styles.adviceCard}>
                                <Text style={styles.adviceText}>{results.advice}</Text>
                            </View>
                        )}
                        <Button mode='contained' onPress={savePrescription} buttonColor={Colors.primary}>
                            Save to History
                        </Button>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
    uploadSection: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginTop: 20 },
    uploadBtn: { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 30, alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed' },
    uploadBtnText: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 10 },
    imageSection: { marginHorizontal: 20, marginTop: 20 },
    prescriptionImage: { width: '100%', height: 300, borderRadius: 16 },
    analyzingCard: { backgroundColor: Colors.white, marginHorizontal: 20, marginTop: 20, padding: 30, borderRadius: 16, alignItems: 'center' },
    analyzingText: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginTop: 15 },
    resultsSection: { marginHorizontal: 20, marginTop: 20 },
    resultsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    medicineCard: { backgroundColor: '#F8F9FF', padding: 15, borderRadius: 12, marginBottom: 10 },
    medicineName: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
    medicineDosage: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
    adviceCard: { backgroundColor: '#FFF8E1', padding: 15, borderRadius: 12, marginBottom: 20 },
    adviceText: { fontSize: 14, color: Colors.text }
});

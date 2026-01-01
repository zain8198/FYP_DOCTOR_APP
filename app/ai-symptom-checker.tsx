import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { callGeminiAPI } from '../utils/geminiAPI';

const DOCTOR_CATEGORIES = [
    "General Physician", "Cardiologist", "Dentist", "Dermatologist",
    "Gynecologist", "Neurologist", "Orthopedic", "Pediatrician",
    "Psychiatrist", "ENT Specialist", "Eye Specialist"
];

export default function AiSymptomChecker() {
    const router = useRouter();
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ condition: string; specialist: string; advice: string } | null>(null);

    const analyzeSymptoms = async () => {
        if (!symptoms.trim()) {
            Alert.alert("Input Required", "Please describe your symptoms first.");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const prompt = `
                Act as a medical triage assistant. 
                User Symptoms: "${symptoms}"
                
                Task:
                1. Identify the likely condition (keep it brief).
                2. Recommend ONE specialist from this list: ${DOCTOR_CATEGORIES.join(", ")}.
                3. Provide 1 sentence of immediate home advice.
                
                Return ONLY valid JSON format like this:
                {
                    "condition": "Possible Conditon Name",
                    "specialist": "Exact Category Name from list",
                    "advice": "Simple home advice."
                }
            `;

            const textResponse = await callGeminiAPI(prompt);

            // Clean markdown if present (Gemini sometimes adds ```json ... ```)
            const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedResult = JSON.parse(cleanJson);

            setResult(parsedResult);

        } catch (error: any) {
            console.error("AI Error:", error);

            // Provide meaningful error messages based on error type
            let errorMessage = "Failed to analyze symptoms. Please try again.";

            if (error.message?.includes("overloaded")) {
                errorMessage = "AI service is currently busy. Please wait a moment and try again.";
            } else if (error.message?.includes("API key")) {
                errorMessage = "Configuration error. Please contact support.";
            } else if (error.message?.includes("not found") || error.message?.includes("not supported")) {
                errorMessage = "Service temporarily unavailable. Please try again later.";
            } else if (error instanceof SyntaxError || error.message?.includes("JSON")) {
                errorMessage = "Unable to process AI response. Please try with different symptoms.";
            } else if (!error.message || error.message === "Network request failed") {
                errorMessage = "Network error. Please check your internet connection and try again.";
            }

            Alert.alert("Analysis Failed", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleFindDoctor = () => {
        if (result?.specialist) {
            // Navigate back to Home and pass the category to select
            // We'll use a globally available way or query param, 
            // but for now let's just go home and user can select.
            // Better: Push to Home with params if Expo Router supports handled state there,
            // OR just go to doctor search.

            // Navigate to home with param
            router.navigate({ pathname: "/(tabs)/home", params: { category: result.specialist } });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Health Assistant 🤖</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    <View style={styles.introCard}>
                        <Text style={styles.introTitle}>Describe your symptoms</Text>
                        <Text style={styles.introSubtitle}>
                            Our AI will analyze your condition and suggest the right specialist.
                        </Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., I have a throbbing headache on one side and potential nausea..."
                            placeholderTextColor="#999"
                            multiline
                            textAlignVertical="top"
                            value={symptoms}
                            onChangeText={setSymptoms}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.analyzeButton, loading && styles.disabledButton]}
                        onPress={analyzeSymptoms}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.buttonText}>Analyze Symptoms</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {result && (
                        <View style={styles.resultContainer}>
                            <View style={styles.resultHeader}>
                                <Ionicons name="medical" size={24} color={Colors.primary} />
                                <Text style={styles.resultTitle}>Analysis Result</Text>
                            </View>

                            <View style={styles.resultItem}>
                                <Text style={styles.label}>Possible Condition:</Text>
                                <Text style={styles.value}>{result.condition}</Text>
                            </View>

                            <View style={styles.resultItem}>
                                <Text style={styles.label}>Immediate Advice:</Text>
                                <Text style={styles.value}>{result.advice}</Text>
                            </View>

                            <View style={styles.recommendationCard}>
                                <Text style={styles.recommendationLabel}>Recommended Specialist</Text>
                                <Text style={styles.specialistName}>{result.specialist}</Text>

                                <TouchableOpacity style={styles.bookButton} onPress={handleFindDoctor}>
                                    <Text style={styles.bookButtonText}>Find {result.specialist}</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    content: {
        padding: 20,
    },
    introCard: {
        marginBottom: 20,
    },
    introTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 5,
    },
    introSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        height: 150,
        fontSize: 16,
        color: Colors.text,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    analyzeButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultContainer: {
        marginTop: 30,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 10,
    },
    resultItem: {
        marginBottom: 15,
    },
    label: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 16,
        color: Colors.text,
        lineHeight: 22,
    },
    recommendationCard: {
        backgroundColor: '#E3F2FD', // Light Blue
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
        alignItems: 'center',
    },
    recommendationLabel: {
        fontSize: 12,
        color: '#1565C0',
        fontWeight: '600',
        marginBottom: 5,
    },
    specialistName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1565C0',
        marginBottom: 15,
    },
    bookButton: {
        backgroundColor: '#1565C0',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 5,
    },
});

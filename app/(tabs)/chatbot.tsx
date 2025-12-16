import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, ActivityIndicator, Alert } from "react-native";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { auth } from "../../firebase";
import { useRouter } from "expo-router";

// Reuse Gemini API Key (same as symptom checker)
const GEMINI_API_KEY = "AIzaSyCGZbKMgPGzJMF3eZ87A2ACpjieLj_5r6M";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    createdAt: number;
    action?: string; // e.g., 'book_dentist'
    actionLabel?: string; // e.g., 'Find a Dentist 🦷'
}

const SUGGESTIONS = [
    "I have a fever 🤒",
    "Headache relief 🤯",
    "Severe tooth pain 🦷", // Updated for demo
    "Skin rash 🔴",
    "Book an appointment 📅",
];

export default function ChatBotScreen() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Hello! I am your personal Health Assistant. How can I help you regarding your health today?", sender: 'bot', createdAt: Date.now() }
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const userImage = auth.currentUser?.photoURL || 'https://i.pravatar.cc/150?img=12';
    const botImage = 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png';

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
            createdAt: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText("");
        setIsTyping(true);

        // AI Response (async)
        const response = await generateAIResponse(userMsg.text);
        const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: response.text,
            sender: 'bot',
            createdAt: Date.now(),
            action: response.action,
            actionLabel: response.actionLabel
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    };

    const handleSuggestionPress = async (text: string) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            text: text,
            sender: 'user',
            createdAt: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        const response = await generateAIResponse(text);
        const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: response.text,
            sender: 'bot',
            createdAt: Date.now(),
            action: response.action,
            actionLabel: response.actionLabel
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    };

    const handleActionPress = (action: string) => {
        // Business Logic: Redirect to booking to drive revenue
        if (action === 'book_dentist') {
            router.push({ pathname: "/(tabs)/home", params: { category: "Dentist" } } as any);
        } else if (action === 'book_derma' || action === 'book_dermatologist') {
            router.push({ pathname: "/(tabs)/home", params: { category: "Dermatologist" } } as any);
        } else if (action === 'book_cardio' || action === 'book_cardiologist') {
            router.push({ pathname: "/(tabs)/home", params: { category: "Cardiologist" } } as any);
        } else if (action === 'book_general' || action === 'book_general_physician') {
            router.push({ pathname: "/(tabs)/home", params: { category: "General Physician" } } as any);
        } else if (action.startsWith('book_')) {
            // Generic handler for AI-generated specialists
            const specialist = action.replace('book_', '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            router.push({ pathname: "/(tabs)/home", params: { category: specialist } } as any);
        }
    };

    const generateAIResponse = async (input: string): Promise<{ text: string, action?: string, actionLabel?: string }> => {
        try {
            const prompt = `You are a medical triage assistant for a doctor booking app.

User Query: "${input}"

Task:
1. Provide brief, helpful health advice (2-3 sentences max)
2. If symptoms are mentioned, recommend ONE specialist from: General Physician, Cardiologist, Dentist, Dermatologist, Gynecologist, Neurologist, Orthopedic, Pediatrician, Psychiatrist, ENT Specialist, Eye Specialist
3. Return ONLY valid JSON:

{
  "message": "Your helpful response here",
  "specialist": "Specialist Name" (optional, only if medical issue detected)
}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || "API Error");
            }

            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiResult = JSON.parse(cleanJson);

            // Build response with action button if specialist recommended
            if (aiResult.specialist) {
                return {
                    text: aiResult.message,
                    action: `book_${aiResult.specialist.toLowerCase().replace(/\s+/g, '_')}`,
                    actionLabel: `Find ${aiResult.specialist} 🩺`
                };
            }

            return { text: aiResult.message };

        } catch (error: any) {
            console.error("AI Error:", error);
            // Fallback to rule-based response
            return generateFallbackResponse(input);
        }
    };

    const generateFallbackResponse = (input: string): { text: string, action?: string, actionLabel?: string } => {
        const lower = input.toLowerCase();

        // Smart Business Logic: Detect symptoms and suggest specialists
        if (lower.includes("tooth") || lower.includes("teeth") || lower.includes("gum")) {
            return {
                text: "Tooth pain can be serious. It might be a cavity or infection. I highly recommend seeing a Dentist immediately.",
                action: "book_dentist",
                actionLabel: "Find a Dentist 🦷"
            };
        }
        if (lower.includes("skin") || lower.includes("rash") || lower.includes("acne")) {
            return {
                text: "For skin issues, keeping the area clean is key. However, for persistent rashes, you should consult a Dermatologist.",
                action: "book_derma",
                actionLabel: "Find Dermatologist 🧴"
            };
        }
        if (lower.includes("heart") || lower.includes("chest pain")) {
            return {
                text: "⚠️ Chest pain is critical. Please seek emergency help if severe. For checkups, consult a Cardiologist.",
                action: "book_cardio",
                actionLabel: "Find Cardiologist ❤️"
            };
        }
        if (lower.includes("fever") || lower.includes("temperature")) {
            return {
                text: "For fever, stay hydrated. If it's high, a General Physician can prescribe the right medication.",
                action: "book_general",
                actionLabel: "Book Physician 🩺"
            };
        }

        // General Responses
        if (lower.includes("headache")) {
            return { text: "Headaches are often caused by dehydration. Drink water and rest!" };
        }
        if (lower.includes("stomach")) {
            return { text: "Avoid heavy meals. If pain persists, please consult a specialist." };
        }
        if (lower.includes("diet")) {
            return { text: "Eat green vegetables, fruits, and avoid sugar for a healthy life! 🍎" };
        }
        if (lower.includes("hi") || lower.includes("hello")) {
            return { text: "Hello! How can I assist you with your health?" };
        }

        return { text: "I'm here to help! You can search for specialized doctors in the Home tab or describe your symptoms." };
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
                {!isUser && <Image source={{ uri: botImage }} style={styles.avatar} />}

                <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>{item.text}</Text>

                    {/* Business Action Button */}
                    {!isUser && item.action && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleActionPress(item.action!)}
                        >
                            <Text style={styles.actionButtonText}>{item.actionLabel || "Book Now"}</Text>
                            <Ionicons name="arrow-forward-circle" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                {isUser && <Image source={{ uri: userImage }} style={styles.avatar} />}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>AI Health Assistant 🤖</Text>
                <Text style={styles.headerSubtitle}>Smart Symptom Checker</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    ListFooterComponent={isTyping ? (
                        <View style={styles.typingContainer}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.typingText}>AI is analyzing...</Text>
                        </View>
                    ) : null}
                />

                <View style={styles.bottomContainer}>
                    {/* Suggestions */}
                    <View style={styles.suggestionsContainer}>
                        <FlatList
                            horizontal
                            data={SUGGESTIONS}
                            keyExtractor={item => item}
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleSuggestionPress(item)} style={styles.chip}>
                                    <Text style={styles.chipText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ paddingHorizontal: 10 }}
                        />
                    </View>

                    {/* Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Describe your symptoms..."
                            placeholderTextColor="#999"
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                            <Ionicons name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
        paddingTop: Platform.OS === 'android' ? 40 : 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    listContent: {
        padding: 15,
        paddingBottom: 20,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'flex-start', // Align to top for longer messages
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    botRow: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginHorizontal: 8,
        backgroundColor: '#DDD',
    },
    bubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 20,
        elevation: 1,
    },
    userBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 2,
    },
    botBubble: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: 'white',
    },
    botText: {
        color: '#333',
    },
    actionButton: {
        marginTop: 10,
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 15,
        elevation: 2,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 5,
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 55,
        marginBottom: 10,
    },
    typingText: {
        marginLeft: 8,
        color: '#888',
        fontSize: 12,
    },
    bottomContainer: {
        paddingBottom: 90, // Crucial Fix: Push input up above Tab Bar
        backgroundColor: '#F5F7FA',
    },
    suggestionsContainer: {
        height: 50,
        marginBottom: 5,
    },
    chip: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: Colors.primary,
        elevation: 2,
        justifyContent: 'center',
    },
    chipText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: 13,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingHorizontal: 15,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    input: {
        flex: 1,
        backgroundColor: '#F0F2F5',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
        marginRight: 10,
        height: 45,
    },
    sendButton: {
        width: 45,
        height: 45,
        backgroundColor: Colors.primary,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
});

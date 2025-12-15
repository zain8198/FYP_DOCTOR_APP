import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { auth, db } from '../../firebase'; // Added auth import
import { ref, push, onValue, serverTimestamp, query, orderByChild } from 'firebase/database';
import { Alert } from 'react-native'; // Added Alert

interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: number;
}

export default function ChatScreen() {
    const { id, name } = useLocalSearchParams(); // Doctor's ID and Name
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    // Get current user ID from Firebase Auth
    const currentUserId = auth.currentUser?.uid;

    // Fallback or redirection if not logged in
    useEffect(() => {
        if (!currentUserId) {
            Alert.alert("Error", "You must be logged in to send messages.");
            // router.back(); // Optional: Navigate back
        }
    }, [currentUserId]);

    // Construct a unique Chat ID. 
    // For simplicity: userId_doctorId. In a real app, ensure consistent ordering or use a separate conversations lookup.
    const chatId = currentUserId ? `${currentUserId}_${id}` : `temp_${id}`;

    useEffect(() => {
        if (!currentUserId) return;

        const messagesRef = ref(db, `chats/${chatId}/messages`);
        const q = query(messagesRef, orderByChild('createdAt'));

        const unsubscribe = onValue(q, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedMessages = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setMessages(loadedMessages);
            } else {
                setMessages([]); // No messages yet
            }
        }, (error) => {
            console.error("Chat Error:", error);
            Alert.alert("Error", "Failed to load messages: " + error.message);
        });

        return () => unsubscribe();
    }, [chatId, currentUserId]);

    const sendMessage = async () => {
        if (inputText.trim().length === 0) return;
        if (!currentUserId) {
            Alert.alert("Error", "You are not logged in.");
            return;
        }

        try {
            const messagesRef = ref(db, `chats/${chatId}/messages`);

            await push(messagesRef, {
                text: inputText,
                senderId: currentUserId,
                createdAt: serverTimestamp() // Let server handle timestamp, or use Date.now() for optimistic
            });

            setInputText('');
        } catch (error: any) {
            console.error("Send Error:", error);
            Alert.alert("Error", "Failed to send message: " + error.message);
        }
    };

    useEffect(() => {
        // Scroll to bottom when messages change
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const renderItem = ({ item }: { item: Message }) => {
        const isMyMessage = item.senderId === currentUserId;
        const userImage = auth.currentUser?.photoURL || 'https://i.pravatar.cc/150?img=5';
        // Placeholder for doctor image since we don't fetch it explicitly here yet, 
        // but could pass it via params. For now using a consistent doctor placeholder or params if available.
        const doctorImage = 'https://i.pravatar.cc/150?img=32';

        return (
            <View style={[
                styles.messageRow,
                isMyMessage ? styles.myMessageRow : styles.theirMessageRow
            ]}>
                {!isMyMessage && (
                    <Image source={{ uri: doctorImage }} style={styles.chatAvatar} />
                )}

                <View style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessage : styles.theirMessage
                ]}>
                    <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                        {item.text}
                    </Text>
                    <Text style={styles.timestamp}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                    </Text>
                </View>

                {isMyMessage && (
                    <Image source={{ uri: userImage }} style={styles.chatAvatar} />
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerTitle}>{name || 'Doctor'}</Text>
                            <Text style={styles.headerSubtitle}>Online</Text>
                        </View>

                    </View>

                    {/* Messages List */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.attachButton}>
                            <Ionicons name="add" size={28} color={Colors.textSecondary} />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                            <Ionicons name="send" size={20} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingTop: Platform.OS === 'android' ? 40 : 15, // Handle status bar manually if safe area fails
    },
    backButton: {
        padding: 5,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: Colors.primary,
    },
    listContent: {
        padding: 15,
        paddingBottom: 80,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 10,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 2,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    messageText: {
        fontSize: 16,
    },
    myMessageText: {
        color: Colors.white,
    },
    theirMessageText: {
        color: Colors.text,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 5,
        alignSelf: 'flex-end',
        color: 'rgba(0,0,0,0.5)'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingHorizontal: 15,
        backgroundColor: Colors.white,
        margin: 10,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        marginBottom: 10, // Adjusted to be just above
    },
    attachButton: {
        marginRight: 10,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.textSecondary,
        borderRadius: 15,
    },
    input: {
        flex: 1,
        fontSize: 16,
        marginRight: 10,
        maxHeight: 100,
        paddingVertical: 5,
    },
    sendButton: {
        width: 45,
        height: 45,
        backgroundColor: Colors.primary,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    theirMessageRow: {
        justifyContent: 'flex-start',
    },
    chatAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginHorizontal: 8,
        marginBottom: 5,
    },
});

import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Image, SafeAreaView, Platform, TextInput, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Avatar, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { auth, db } from '../../firebase';
import { ref, onValue, get } from 'firebase/database';

interface ChatListItem {
    chatId: string;
    patientId: string;
    patientName: string;
    patientImage: string | null;
    lastMessage: string;
    lastMessageTime: number;
    unreadCount?: number;
}

export default function DoctorMessagesScreen() {
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [filteredChats, setFilteredChats] = useState<ChatListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const currentUserId = auth.currentUser?.uid;

    const fetchChats = async () => {
        if (!currentUserId) return;

        try {
            const chatsRef = ref(db, 'chats');

            onValue(chatsRef, async (snapshot) => {
                if (!snapshot.exists()) {
                    setChats([]);
                    setFilteredChats([]);
                    setLoading(false);
                    return;
                }

                const allChats = snapshot.val();
                const chatList: ChatListItem[] = [];

                for (const chatId in allChats) {
                    if (chatId.includes(currentUserId)) {
                        const chat = allChats[chatId];
                        const participantIds = chatId.split('_');
                        const patientId = participantIds.find(id => id !== currentUserId);

                        if (!patientId) continue;

                        let patientName = 'Unknown Patient';
                        let patientImage = null;

                        try {
                            const userRef = ref(db, `users/${patientId}`);
                            const userSnap = await get(userRef);
                            if (userSnap.exists()) {
                                const userData = userSnap.val();
                                patientName = userData.name || userData.displayName || 'Patient';
                                patientImage = userData.image || userData.photoURL || null;
                            }
                        } catch (err) {
                            console.log('Error fetching patient:', err);
                        }

                        let lastMessage = 'No messages yet';
                        let lastMessageTime = 0;

                        if (chat.lastMessage) {
                            lastMessage = chat.lastMessage.text || 'No messages yet';
                            lastMessageTime = chat.lastMessage.timestamp || 0;
                        } else if (chat.messages) {
                            const messages = Object.values(chat.messages) as any[];
                            if (messages.length > 0) {
                                const sorted = messages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                                lastMessage = sorted[0].text || 'No messages yet';
                                lastMessageTime = sorted[0].createdAt || 0;
                            }
                        }

                        chatList.push({
                            chatId,
                            patientId,
                            patientName,
                            patientImage,
                            lastMessage,
                            lastMessageTime,
                        });
                    }
                }

                chatList.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
                setChats(chatList);
                setFilteredChats(chatList);
                setLoading(false);
                setRefreshing(false);
            });
        } catch (error) {
            console.error('Error fetching chats:', error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredChats(chats);
        } else {
            const filtered = chats.filter(chat =>
                chat.patientName.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredChats(filtered);
        }
    }, [searchQuery, chats]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchChats();
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return '';
        const now = new Date();
        const messageDate = new Date(timestamp);
        const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else if (diffInHours < 168) {
            return messageDate.toLocaleDateString([], { weekday: 'short' });
        } else {
            return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const renderChatItem = ({ item }: { item: ChatListItem }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => router.push({
                pathname: '/chat/[id]',
                params: {
                    id: item.patientId,
                    name: item.patientName,
                    image: item.patientImage || ''
                }
            } as any)}
        >
            <View style={styles.avatarContainer}>
                {item.patientImage ? (
                    <Image source={{ uri: item.patientImage }} style={styles.avatar} />
                ) : (
                    <Avatar.Text
                        size={55}
                        label={item.patientName.substring(0, 2).toUpperCase()}
                        style={{ backgroundColor: Colors.primary }}
                        color="white"
                    />
                )}
            </View>

            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={styles.patientName}>{item.patientName}</Text>
                    <Text style={styles.timestamp}>{formatTime(item.lastMessageTime)}</Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search patients..."
                    placeholderTextColor={Colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {filteredChats.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={80} color="#DDD" />
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'No chats found' : 'No conversations yet'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {searchQuery ? 'Try a different search term' : 'Start chatting with your patients from appointments'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredChats}
                    keyExtractor={(item) => item.chatId}
                    renderItem={renderChatItem}
                    contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 20) }]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        marginHorizontal: 20,
        marginVertical: 15,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
    },
    listContent: {
        paddingBottom: 20,
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    avatarContainer: {
        marginRight: 15,
    },
    avatar: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
    },
    chatContent: {
        flex: 1,
        justifyContent: 'center',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    patientName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    timestamp: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    lastMessage: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#999',
        marginTop: 20,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#BBB',
        marginTop: 8,
        textAlign: 'center',
    },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue, remove, update } from 'firebase/database';
import { db, auth } from '../../firebase';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DoctorNotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const notifRef = ref(db, `doctors/${userId}/notifications`);
        const unsubscribe = onValue(notifRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                list.sort((a, b) => b.createdAt - a.createdAt);
                setNotifications(list);
            } else {
                setNotifications([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handlePress = async (item: any) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        try {
            const itemRef = ref(db, `doctors/${userId}/notifications/${item.id}`);
            await update(itemRef, { read: true });

            if (item.data?.chatId) {
                router.push({
                    pathname: "/chat/[id]",
                    params: {
                        id: item.data.chatId,
                        name: item.data.senderName || 'Patient'
                    }
                } as any);
            }
        } catch (error) {
            console.error("Error handling notification press:", error);
        }
    };

    const handleDelete = async (id: string) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        try {
            const itemRef = ref(db, `doctors/${userId}/notifications/${id}`);
            await remove(itemRef);
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    }

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, !item.read && styles.unreadCard]}
            onPress={() => handlePress(item)}
        >
            <View style={[styles.iconBox, { backgroundColor: item.type === 'message' ? '#E3F2FD' : '#FFF3E0' }]}>
                <Ionicons
                    name={item.type === 'message' ? "chatbubble-ellipses" : "calendar"}
                    size={24}
                    color={item.type === 'message' ? "#1976D2" : "#F57C00"}
                />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
                <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.time}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => { }} style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
            ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={60} color="#ddd" />
                    <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}
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
        paddingTop: 15, // Will be overridden by inline style
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    listContent: {
        padding: 15,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    unreadCard: {
        backgroundColor: '#F0F9FF',
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary
    },
    iconBox: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    unreadText: {
        fontWeight: 'bold',
        color: '#000'
    },
    body: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    time: {
        fontSize: 12,
        color: '#999',
    },
    deleteBtn: {
        padding: 5,
        marginLeft: 5
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: Colors.textSecondary,
    }
});

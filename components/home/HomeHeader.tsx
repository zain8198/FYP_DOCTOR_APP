import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ref, onValue } from 'firebase/database';
import { db, auth } from '../../firebase';
import { Colors } from '../../constants/Colors';

interface HomeHeaderProps {
    userName: string;
    userImage?: string | null;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ userName, userImage }) => {
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!auth.currentUser) return;

        const notifRef = ref(db, `users/${auth.currentUser.uid}/notifications`);
        const unsubscribe = onValue(notifRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Count items where read is false or missing
                const count = Object.values(data).reduce((acc: number, n: any) => {
                    if (!n.read) {
                        return acc + (n.messageCount || 1);
                    }
                    return acc;
                }, 0);
                setUnreadCount(count);
            } else {
                setUnreadCount(0);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.profileContainer}>
                <Image
                    source={{ uri: userImage || 'https://i.pravatar.cc/150?img=5' }}
                    style={styles.profileImage}
                />
                <View>
                    <Text style={styles.greeting}>Hey! {userName} 👋</Text>
                    <Text style={styles.subGreeting}>How are you Today?</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push('/notifications')}
            >
                <Ionicons name="notifications-outline" size={24} color="#000" />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    greeting: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    subGreeting: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    notificationButton: {
        width: 45,
        height: 45,
        backgroundColor: Colors.white,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'red',
        borderWidth: 1.5,
        borderColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    }
});

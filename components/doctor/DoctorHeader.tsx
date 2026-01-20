import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ref, onValue } from 'firebase/database';
import { db, auth } from '../../firebase';
import { Colors } from '../../constants/Colors';
import { Avatar } from 'react-native-paper';

interface DoctorHeaderProps {
    doctorName: string;
    doctorImage?: string | null;
}

export const DoctorHeader: React.FC<DoctorHeaderProps> = ({ doctorName, doctorImage }) => {
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!auth.currentUser) return;

        const notifRef = ref(db, `doctors/${auth.currentUser.uid}/notifications`);
        const unsubscribe = onValue(notifRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const count = Object.values(data).filter((n: any) => !n.read).length;
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
                <Avatar.Image
                    source={{ uri: doctorImage || 'https://i.pravatar.cc/150?img=12' }}
                    size={50}
                />
                <View style={styles.textContainer}>
                    <Text style={styles.greeting}>Dr. {doctorName} 👨‍⚕️</Text>
                    <Text style={styles.subGreeting}>Dashboard</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push('/doctor/notifications')}
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
        paddingHorizontal: 20,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 12,
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

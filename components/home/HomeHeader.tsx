import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface HomeHeaderProps {
    userName: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ userName }) => {
    return (
        <View style={styles.container}>
            <View style={styles.profileContainer}>
                <Image
                    source={{ uri: 'https://i.pravatar.cc/150?img=5' }} // Mock image
                    style={styles.profileImage}
                />
                <View>
                    <Text style={styles.greeting}>Hey! {userName} 👋</Text>
                    <Text style={styles.subGreeting}>How are you Today?</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={24} color="#000" />
                <View style={styles.badge} />
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
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
        borderWidth: 1,
        borderColor: Colors.white,
    },
});

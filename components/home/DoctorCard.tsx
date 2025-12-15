import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface DoctorCardProps {
    name: string;
    specialty: string;
    rating: number;
    price: number;
    image: string;
    onMessagePress: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ name, specialty, rating, price, image, onMessagePress }) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Image source={{ uri: image }} style={styles.image} />
                <View style={styles.info}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.specialty}>{specialty}</Text>
                </View>
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color={Colors.rating} />
                    <Text style={styles.ratingText}>{rating}</Text>
                </View>
            </View>

            <View style={styles.detailsRow}>
                <View>
                    <Text style={styles.price}>${price}</Text>
                    <Text style={styles.perSession}>Per session</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="heart-outline" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconButton, styles.detailButton]}>
                        <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.actionButton} onPress={onMessagePress}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.primary} style={styles.btnIcon} />
                    <Text style={styles.buttonText}>Message</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 30, // Updated to be circular as per new designs usually, though image showed square-ish with rounded corners? Image shows square with rounded corners.
        // Let's stick to standard round for now or slight rounded square.
        // The image shows a rect with rounded corners.
        borderRadius: 12,
        marginRight: 15,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    specialty: {
        fontSize: 14,
        color: Colors.primary,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9C4', // light yellow bg for rating
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
        color: Colors.text,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    perSession: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    iconButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailButton: {
        backgroundColor: Colors.lightGreen,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        paddingVertical: 12,
        borderRadius: 15,
    },
    btnIcon: {
        marginRight: 8,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
});

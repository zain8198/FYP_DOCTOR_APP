import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const categories = [
    { id: 1, name: 'Gynecologist', icon: 'medkit-outline' },
    { id: 2, name: 'Cardiologist', icon: 'heart-outline' },
    { id: 3, name: 'Dentist', icon: 'happy-outline' },
    { id: 4, name: 'Neurologist', icon: 'headset-outline' },
];

export const CategoryList = () => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Doctor Category</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                {categories.map((category) => (
                    <TouchableOpacity key={category.id} style={styles.card}>
                        <View style={styles.iconContainer}>
                            <Ionicons name={category.icon as any} size={24} color={Colors.primary} />
                        </View>
                        <Text style={styles.categoryName}>{category.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    seeAll: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    scrollContainer: {
        paddingRight: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    iconContainer: {
        marginRight: 10,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
});

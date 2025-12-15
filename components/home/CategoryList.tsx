import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface Category {
    id: string | number;
    name: string;
    icon: string;
}

interface CategoryListProps {
    categories: Category[];
    selectedCategory: string;
    onCategorySelect: (category: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({ categories, selectedCategory, onCategorySelect }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Doctor Category</Text>
                <TouchableOpacity onPress={() => onCategorySelect('All')}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                {categories.map((category) => {
                    const isSelected = selectedCategory === category.name;
                    return (
                        <TouchableOpacity
                            key={category.id}
                            style={[styles.card, isSelected && styles.selectedCard]}
                            onPress={() => onCategorySelect(category.name)}
                        >
                            <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
                                <Ionicons
                                    name={category.icon as any}
                                    size={24}
                                    color={isSelected ? Colors.white : Colors.primary}
                                />
                            </View>
                            <Text style={[styles.categoryName, isSelected && styles.selectedCategoryName]}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
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
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedCard: {
        backgroundColor: Colors.primary,
    },
    iconContainer: {
        marginRight: 10,
    },
    selectedIconContainer: {
        // Optional: change or keep same
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    selectedCategoryName: {
        color: Colors.white,
    },
});

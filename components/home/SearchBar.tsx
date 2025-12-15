import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface SearchBarProps {
    value?: string;
    onChangeText?: (text: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText }) => {
    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
                <TextInput
                    placeholder="Search doctor, specialty..."
                    placeholderTextColor={Colors.textSecondary}
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                />
            </View>
            <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="options-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12, // slightly rounded
        paddingHorizontal: 15,
        height: 50,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
    },
    filterButton: {
        width: 50,
        height: 50,
        backgroundColor: Colors.primary,
        borderRadius: 12, // matching rounded look
        justifyContent: 'center',
        alignItems: 'center',
    },
});

import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, review: string) => Promise<void>;
    doctorName: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ visible, onClose, onSubmit, doctorName }) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setLoading(true);
        await onSubmit(rating, review);
        setLoading(false);
        setRating(0);
        setReview('');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.container}>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>

                            <Text style={styles.title}>Rate your experience</Text>
                            <Text style={styles.subtitle}>How was your consultation with Dr. {doctorName}?</Text>

                            <View style={styles.starsContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                        <Ionicons
                                            name={star <= rating ? "star" : "star-outline"}
                                            size={32}
                                            color={Colors.rating}
                                            style={styles.star}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Write a review (optional)..."
                                multiline
                                numberOfLines={4}
                                value={review}
                                onChangeText={setReview}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, rating === 0 && styles.disabledButton]}
                                onPress={handleSubmit}
                                disabled={rating === 0 || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={Colors.white} />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Review</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 10,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 20,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    star: {
        marginHorizontal: 5,
    },
    input: {
        width: '100%',
        backgroundColor: Colors.background,
        borderRadius: 10,
        padding: 15,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    submitButton: {
        width: '100%',
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: Colors.textSecondary,
        opacity: 0.5,
    },
    submitButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import {
    formatCardNumber,
    validateCardNumber,
    validateExpiryDate,
    validateCVV,
    getCardType,
    processPayment,
    formatAmount
} from '../../utils/paymentConfig';
import { ref, push, set } from 'firebase/database';
import { auth, db } from '../../firebase';

export default function CardPaymentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const [cardNumber, setCardNumber] = useState('');
    const [cardholderName, setCardholderName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [processing, setProcessing] = useState(false);

    const total = parseInt((params.total as string || "").replace(/\D/g, '')) || 0;
    const cardType = getCardType(cardNumber);

    const handleCardNumberChange = (text: string) => {
        const cleaned = text.replace(/\s/g, '');
        if (cleaned.length <= 16) {
            setCardNumber(formatCardNumber(cleaned));
        }
    };

    const handleExpiryChange = (text: string) => {
        let cleaned = text.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            cleaned = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
        }
        if (cleaned.length <= 5) {
            setExpiryDate(cleaned);
        }
    };

    const handleCvvChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 4) {
            setCvv(cleaned);
        }
    };

    const handlePayment = async () => {
        // Validate inputs
        if (!cardholderName.trim()) {
            Alert.alert('Error', 'Please enter cardholder name');
            return;
        }

        if (!validateCardNumber(cardNumber)) {
            Alert.alert('Error', 'Invalid card number');
            return;
        }

        if (!validateExpiryDate(expiryDate)) {
            Alert.alert('Error', 'Invalid or expired card');
            return;
        }

        if (!validateCVV(cvv)) {
            Alert.alert('Error', 'Invalid CVV');
            return;
        }

        setProcessing(true);

        try {
            // Process payment (mock)
            const result = await processPayment('card', total, {
                cardNumber,
                cardholderName,
                expiryDate,
                cvv
            });

            if (result.success) {
                // Save transaction to Firebase
                const userId = auth.currentUser?.uid;
                if (userId) {
                    const transactionRef = ref(db, `transactions/${userId}`);
                    const newTransactionRef = push(transactionRef);

                    await set(newTransactionRef, {
                        appointmentId: params.appointmentId || '',
                        doctorId: params.doctorId || '',
                        doctorName: params.doctorName || '',
                        amount: total,
                        currency: 'PKR',
                        paymentMethod: 'card',
                        cardType: cardType,
                        lastFourDigits: cardNumber.replace(/\s/g, '').slice(-4),
                        status: 'success',
                        transactionId: result.transactionId,
                        timestamp: Date.now(),
                        appointmentDate: params.appointmentDate || '',
                        appointmentTime: params.appointmentTime || ''
                    });
                }

                // Navigate to success screen
                router.replace({
                    pathname: '/payment/success' as any,
                    params: {
                        transactionId: result.transactionId,
                        amount: total.toString(),
                        ...params
                    }
                });
            } else {
                setProcessing(false);
                Alert.alert('Payment Failed', result.error || 'Something went wrong. Please try again.');
            }
        } catch (error: any) {
            setProcessing(false);
            Alert.alert('Error', 'Payment processing failed. Please try again.');
            console.error('Payment error:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={processing}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Card Payment</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Amount Display */}
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>{formatAmount(total)}</Text>
                </View>

                {/* Card Form */}
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Card Details</Text>

                    {/* Card Number */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Card Number</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChangeText={handleCardNumberChange}
                                keyboardType="numeric"
                                maxLength={19}
                                editable={!processing}
                            />
                            {cardType !== 'Unknown' && cardNumber.length > 0 && (
                                <Text style={styles.cardType}>{cardType}</Text>
                            )}
                        </View>
                    </View>

                    {/* Cardholder Name */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Cardholder Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="JOHN DOE"
                            value={cardholderName}
                            onChangeText={setCardholderName}
                            autoCapitalize="characters"
                            editable={!processing}
                        />
                    </View>

                    {/* Expiry and CVV */}
                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.inputLabel}>Expiry Date</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="MM/YY"
                                value={expiryDate}
                                onChangeText={handleExpiryChange}
                                keyboardType="numeric"
                                maxLength={5}
                                editable={!processing}
                            />
                        </View>

                        <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                            <Text style={styles.inputLabel}>CVV</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="123"
                                value={cvv}
                                onChangeText={handleCvvChange}
                                keyboardType="numeric"
                                maxLength={4}
                                secureTextEntry
                                editable={!processing}
                            />
                        </View>
                    </View>
                </View>

                {/* Security Notice */}
                <View style={styles.securityNotice}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
                    <Text style={styles.securityText}>
                        Your payment is secure and encrypted
                    </Text>
                </View>

                {/* Test Card Notice */}
                <View style={styles.testNotice}>
                    <Ionicons name="information-circle-outline" size={18} color="#FF9800" />
                    <Text style={styles.testText}>
                        Test Mode: Use 4242 4242 4242 4242 for successful payment
                    </Text>
                </View>
            </ScrollView>

            {/* Pay Button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={[styles.payButton, processing && styles.payButtonDisabled]}
                    onPress={handlePayment}
                    disabled={processing}
                >
                    {processing ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="lock-closed" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.payButtonText}>Pay {formatAmount(total)}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    content: {
        padding: 20,
    },
    amountCard: {
        backgroundColor: Colors.primary,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    amountLabel: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.9,
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    formCard: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 16,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: Colors.text,
    },
    cardType: {
        position: 'absolute',
        right: 12,
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },
    row: {
        flexDirection: 'row',
    },
    securityNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightPrimary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    securityText: {
        fontSize: 12,
        color: Colors.primary,
        marginLeft: 8,
        flex: 1,
    },
    testNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
    },
    testText: {
        fontSize: 11,
        color: '#FF9800',
        marginLeft: 8,
        flex: 1,
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    payButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    payButtonDisabled: {
        opacity: 0.6,
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
});

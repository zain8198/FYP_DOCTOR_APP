import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { processPayment, formatAmount } from '../../utils/paymentConfig';
import { ref, push, set } from 'firebase/database';
import { auth, db } from '../../firebase';

export default function EasypaisaPaymentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [mobileNumber, setMobileNumber] = useState('');
    const [mpin, setMpin] = useState('');
    const [processing, setProcessing] = useState(false);

    const total = parseInt(params.total as string) || 0;

    const handlePayment = async () => {
        if (mobileNumber.length < 11) {
            Alert.alert('Error', 'Please enter a valid Easypaisa mobile number');
            return;
        }

        if (mpin.length < 5) {
            Alert.alert('Error', 'Please enter your 5-digit MPIN');
            return;
        }

        setProcessing(true);

        try {
            const result = await processPayment('easypaisa', total, { mobileNumber });

            if (result.success) {
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
                        paymentMethod: 'easypaisa',
                        mobileNumber: mobileNumber,
                        status: 'success',
                        transactionId: result.transactionId,
                        timestamp: Date.now(),
                        appointmentDate: params.appointmentDate || '',
                        appointmentTime: params.appointmentTime || ''
                    });
                }

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
                Alert.alert('Payment Failed', result.error || 'Easypaisa transaction failed.');
            }
        } catch (error) {
            setProcessing(false);
            Alert.alert('Error', 'Payment processing failed.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#00A859" />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={processing}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Easypaisa Payment</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.logoContainer}>
                        <View style={styles.mockLogo}>
                            <Text style={styles.logoText}>easypaisa</Text>
                        </View>
                    </View>

                    <View style={styles.amountCard}>
                        <Text style={styles.amountLabel}>Payable Amount</Text>
                        <Text style={styles.amountValue}>{formatAmount(total)}</Text>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formInstruction}>Enter your Easypaisa account details</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mobile Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="03xx xxxxxxx"
                                keyboardType="phone-pad"
                                maxLength={11}
                                value={mobileNumber}
                                onChangeText={setMobileNumber}
                                editable={!processing}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>5-Digit MPIN</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="xxxxx"
                                keyboardType="numeric"
                                maxLength={5}
                                secureTextEntry
                                value={mpin}
                                onChangeText={setMpin}
                                editable={!processing}
                            />
                        </View>

                        <Text style={styles.hint}>
                            Ensure your Easypaisa app has enough balance. (Simulated)
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.payButton, processing && styles.disabledButton]}
                        onPress={handlePayment}
                        disabled={processing}
                    >
                        {processing ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.payButtonText}>Pay with Easypaisa</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#00A859',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    mockLogo: {
        backgroundColor: '#00A859',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
    },
    logoText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
    },
    amountCard: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
    },
    amountLabel: {
        color: '#666',
        fontSize: 14,
        marginBottom: 5,
    },
    amountValue: {
        color: '#333',
        fontSize: 28,
        fontWeight: 'bold',
    },
    formCard: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        elevation: 2,
    },
    formInstruction: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    hint: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginTop: 10,
    },
    payButton: {
        backgroundColor: '#00A859',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
    },
    disabledButton: {
        opacity: 0.6,
    },
    payButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

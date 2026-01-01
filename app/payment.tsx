import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { PaymentConfig, formatAmount, calculateTotal } from '../utils/paymentConfig';

export default function PaymentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Get appointment details from params
    const doctorName = params.doctorName as string || 'Doctor';
    const doctorSpecialty = params.doctorSpecialty as string || 'Specialist';
    const appointmentDate = params.appointmentDate as string || '';
    const appointmentTime = params.appointmentTime as string || '';
    const consultationFee = parseInt((params.consultationFee as string || "").replace(/\D/g, '')) || 1000;

    // Calculate totals
    const { platformFee, total } = calculateTotal(consultationFee);

    const handlePaymentMethod = (method: 'card' | 'jazzcash' | 'easypaisa') => {
        // Navigate to specific payment screen with all details
        router.push({
            pathname: `/payment/${method}` as any,
            params: {
                ...params,
                total: total.toString()
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Appointment Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.sectionTitle}>Appointment Summary</Text>

                    <View style={styles.summaryRow}>
                        <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.summaryText}>{doctorName}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Ionicons name="medical-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.summaryText}>{doctorSpecialty}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.summaryText}>{appointmentDate}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.summaryText}>{appointmentTime}</Text>
                    </View>
                </View>

                {/* Amount Breakdown */}
                <View style={styles.amountCard}>
                    <Text style={styles.sectionTitle}>Payment Details</Text>

                    <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Consultation Fee</Text>
                        <Text style={styles.amountValue}>{formatAmount(consultationFee)}</Text>
                    </View>

                    {platformFee > 0 && (
                        <View style={styles.amountRow}>
                            <Text style={styles.amountLabel}>Platform Fee</Text>
                            <Text style={styles.amountValue}>{formatAmount(platformFee)}</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.amountRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>{formatAmount(total)}</Text>
                    </View>
                </View>

                {/* Payment Methods */}
                <View style={styles.methodsContainer}>
                    <Text style={styles.sectionTitle}>Select Payment Method</Text>

                    {/* Card Payment */}
                    {PaymentConfig.paymentMethods.card.enabled && (
                        <TouchableOpacity
                            style={styles.methodCard}
                            onPress={() => handlePaymentMethod('card')}
                        >
                            <View style={styles.methodIcon}>
                                <Ionicons name="card-outline" size={28} color={Colors.primary} />
                            </View>
                            <View style={styles.methodInfo}>
                                <Text style={styles.methodName}>{PaymentConfig.paymentMethods.card.name}</Text>
                                <Text style={styles.methodDescription}>{PaymentConfig.paymentMethods.card.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}

                    {/* JazzCash */}
                    {PaymentConfig.paymentMethods.jazzcash.enabled && (
                        <TouchableOpacity
                            style={styles.methodCard}
                            onPress={() => handlePaymentMethod('jazzcash')}
                        >
                            <View style={[styles.methodIcon, { backgroundColor: '#FF6B35' }]}>
                                <Ionicons name="phone-portrait-outline" size={28} color="#FFF" />
                            </View>
                            <View style={styles.methodInfo}>
                                <Text style={styles.methodName}>{PaymentConfig.paymentMethods.jazzcash.name}</Text>
                                <Text style={styles.methodDescription}>{PaymentConfig.paymentMethods.jazzcash.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}

                    {/* Easypaisa */}
                    {PaymentConfig.paymentMethods.easypaisa.enabled && (
                        <TouchableOpacity
                            style={styles.methodCard}
                            onPress={() => handlePaymentMethod('easypaisa')}
                        >
                            <View style={[styles.methodIcon, { backgroundColor: '#00A859' }]}>
                                <Ionicons name="wallet-outline" size={28} color="#FFF" />
                            </View>
                            <View style={styles.methodInfo}>
                                <Text style={styles.methodName}>{PaymentConfig.paymentMethods.easypaisa.name}</Text>
                                <Text style={styles.methodDescription}>{PaymentConfig.paymentMethods.easypaisa.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Test Mode Notice */}
                <View style={styles.testNotice}>
                    <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                    <Text style={styles.testNoticeText}>
                        Test Mode: Use card 4242 4242 4242 4242 for demo
                    </Text>
                </View>
            </ScrollView>
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
    summaryCard: {
        backgroundColor: '#FFF',
        margin: 20,
        marginBottom: 10,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 14,
        color: Colors.text,
        marginLeft: 12,
    },
    amountCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginBottom: 10,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    amountLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    amountValue: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    methodsContainer: {
        marginHorizontal: 20,
        marginTop: 10,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    methodIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.lightPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    methodDescription: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    testNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightPrimary,
        marginHorizontal: 20,
        marginVertical: 20,
        padding: 12,
        borderRadius: 8,
    },
    testNoticeText: {
        fontSize: 12,
        color: Colors.primary,
        marginLeft: 8,
        flex: 1,
    },
});

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { formatAmount } from '../../utils/paymentConfig';
import { ref, push, set } from 'firebase/database';
import { auth, db } from '../../firebase';

export default function PaymentSuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const [downloading, setDownloading] = useState(false);

    const transactionId = params.transactionId as string || '';
    const amount = parseInt(params.amount as string) || 0;
    const doctorName = params.doctorName as string || 'Doctor';
    const appointmentDate = params.appointmentDate as string || '';
    const appointmentTime = params.appointmentTime as string || '';

    useEffect(() => {
        // Create appointment in Firebase after successful payment
        createAppointment();
    }, []);

    const createAppointment = async () => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) return;

            const appointmentRef = ref(db, `appointments/${userId}`);
            const newAppointmentRef = push(appointmentRef);

            await set(newAppointmentRef, {
                doctorId: params.doctorId || '',
                doctor: doctorName,
                doctorSpecialty: params.doctorSpecialty || '',
                date: appointmentDate,
                time: appointmentTime,
                patientName: params.patientName || '',
                patientAge: params.patientAge || '',
                patientGender: params.patientGender || '',
                symptoms: params.symptoms || '',
                status: 'pending',
                paymentStatus: 'Paid',
                transactionId: transactionId,
                amount: amount,
                createdAt: Date.now()
            });
        } catch (error) {
            console.error('Error creating appointment:', error);
        }
    };

    const handleDone = () => {
        // Navigate to appointments tab
        router.replace('/(tabs)/appointments');
    };

    const handleDownload = () => {
        setDownloading(true);
        // Simulate a delay for downloading
        setTimeout(() => {
            setDownloading(false);
            Alert.alert(
                "Receipt Saved ✨",
                "Your payment receipt has been successfully downloaded to your device.",
                [{ text: "Great!" }]
            );
        }, 2000);
    };

    const handleShare = () => {
        Alert.alert("Share", "Sharing receipt feature is coming soon!");
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Success Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark" size={60} color="#FFF" />
                    </View>
                </View>

                {/* Success Message */}
                <Text style={styles.title}>Payment Successful!</Text>
                <Text style={styles.subtitle}>
                    Your appointment is pending doctor confirmation
                </Text>

                {/* Transaction Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Transaction ID</Text>
                        <Text style={styles.detailValue}>{transactionId}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount Paid</Text>
                        <Text style={styles.detailValue}>{formatAmount(amount)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Doctor</Text>
                        <Text style={styles.detailValue}>{doctorName}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date & Time</Text>
                        <Text style={styles.detailValue}>{appointmentDate} at {appointmentTime}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Confirmed</Text>
                        </View>
                    </View>
                </View>

                {/* Receipt Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, downloading && styles.disabledButton]}
                        onPress={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <>
                                <Ionicons name="download-outline" size={20} color={Colors.primary} />
                                <Text style={styles.actionText}>Download Receipt</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                        <Ionicons name="share-outline" size={20} color={Colors.primary} />
                        <Text style={styles.actionText}>Share Receipt</Text>
                    </TouchableOpacity>
                </View>

                {/* Info Message */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                    <Text style={styles.infoText}>
                        A confirmation email has been sent to your registered email address
                    </Text>
                </View>
            </ScrollView>

            {/* Done Button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                    <Text style={styles.doneButtonText}>View My Appointments</Text>
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
    content: {
        padding: 20,
        alignItems: 'center',
    },
    iconContainer: {
        marginTop: 40,
        marginBottom: 30,
    },
    successCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 30,
        textAlign: 'center',
    },
    detailsCard: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        flex: 1,
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
    },
    statusBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
    },
    actionsContainer: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 5,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    actionText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '500',
        marginLeft: 8,
    },
    disabledButton: {
        opacity: 0.5,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: Colors.lightPrimary,
        padding: 12,
        borderRadius: 8,
        width: '100%',
    },
    infoText: {
        fontSize: 12,
        color: Colors.primary,
        marginLeft: 8,
        flex: 1,
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    doneButton: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
});

import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function PaymentFailedScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const error = params.error as string || 'Your payment could not be processed at this time.';

    const handleRetry = () => {
        router.back();
    };

    const handleCancel = () => {
        router.navigate('/(tabs)/home');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={styles.failedCircle}>
                        <Ionicons name="close" size={60} color="#FFF" />
                    </View>
                </View>

                <Text style={styles.title}>Payment Failed</Text>
                <Text style={styles.subtitle}>{error}</Text>

                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>Common reasons for failure:</Text>
                    <View style={styles.tipRow}>
                        <Ionicons name="radio-button-on" size={12} color={Colors.primary} />
                        <Text style={styles.tipText}>Insufficient balance in your account</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Ionicons name="radio-button-on" size={12} color={Colors.primary} />
                        <Text style={styles.tipText}>Incorrect card details or MPIN</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Ionicons name="radio-button-on" size={12} color={Colors.primary} />
                        <Text style={styles.tipText}>Unstable internet connection</Text>
                    </View>
                </View>

                <View style={styles.buttonGroup}>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.cancelButtonText}>Cancel & Go Home</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: 30,
    },
    failedCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F44336',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    tipsCard: {
        backgroundColor: '#F9F9F9',
        padding: 20,
        borderRadius: 12,
        width: '100%',
        marginBottom: 40,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    tipText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 10,
    },
    buttonGroup: {
        width: '100%',
    },
    retryButton: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
});

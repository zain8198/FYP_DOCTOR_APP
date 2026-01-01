import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, Platform, StatusBar, ActivityIndicator, Image, ScrollView } from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { auth, db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { formatAmount } from '../../utils/paymentConfig';

interface Transaction {
    id: string;
    doctorName: string;
    amount: number;
    paymentMethod: string;
    status: string;
    transactionId: string;
    timestamp: number;
    appointmentDate: string;
    appointmentTime: string;
}

export default function TransactionsScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const transRef = ref(db, `transactions/${userId}`);
        const unsubscribe = onValue(transRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list: Transaction[] = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Sort by timestamp newest first
                list.sort((a, b) => b.timestamp - a.timestamp);
                setTransactions(list);
                setFilteredTransactions(list);
            } else {
                setTransactions([]);
                setFilteredTransactions([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let list = transactions;

        // Apply Search
        if (searchQuery) {
            list = list.filter(t =>
                t.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply Status Filter
        if (activeFilter !== 'All') {
            list = list.filter(t => t.status.toLowerCase() === activeFilter.toLowerCase());
        }

        setFilteredTransactions(list);
    }, [searchQuery, activeFilter, transactions]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString([], {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const renderTransactionItem = ({ item }: { item: Transaction }) => (
        <View style={styles.transactionCard}>
            <View style={styles.cardHeader}>
                <View style={[styles.methodIcon, getMethodStyle(item.paymentMethod)]}>
                    <Ionicons
                        name={getMethodIcon(item.paymentMethod)}
                        size={24}
                        color="#FFF"
                    />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.doctorName}>{item.doctorName}</Text>
                    <Text style={styles.transId}>ID: {item.transactionId}</Text>
                </View>
                <Text style={styles.amountText}>{formatAmount(item.amount)}</Text>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={14} color="#888" />
                        <Text style={styles.footerText}>{item.appointmentDate} | {item.appointmentTime}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={14} color="#888" />
                        <Text style={styles.footerText}>{formatDate(item.timestamp)}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'success' ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'success' ? '#4CAF50' : '#F44336' }]}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                </View>
            </View>
        </View>
    );

    const getMethodIcon = (method: string) => {
        if (method === 'card') return 'card-outline';
        if (method === 'jazzcash') return 'phone-portrait-outline';
        return 'wallet-outline';
    };

    const getMethodStyle = (method: string) => {
        if (method === 'card') return { backgroundColor: Colors.primary };
        if (method === 'jazzcash') return { backgroundColor: '#FF6B35' };
        return { backgroundColor: '#00A859' };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Transactions</Text>
            </View>

            <View style={styles.searchSection}>
                <Searchbar
                    placeholder="Search transactions..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor={Colors.primary}
                />
            </View>

            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['All', 'Success', 'Failed'].map(filter => (
                        <Chip
                            key={filter}
                            selected={activeFilter === filter}
                            onPress={() => setActiveFilter(filter)}
                            style={[styles.filterChip, activeFilter === filter && styles.selectedChip]}
                            textStyle={[styles.filterChipText, activeFilter === filter && styles.selectedChipText]}
                        >
                            {filter}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {filteredTransactions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={80} color="#DDD" />
                    <Text style={styles.emptyText}>No transactions found</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTransactions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTransactionItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    searchSection: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    searchBar: {
        backgroundColor: '#F5F5F5',
        elevation: 0,
        borderRadius: 12,
        height: 50,
    },
    searchInput: {
        fontSize: 14,
    },
    filterSection: {
        backgroundColor: '#FFF',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    filterScroll: {
        paddingHorizontal: 20,
    },
    filterChip: {
        marginRight: 10,
        backgroundColor: '#F5F5F5',
    },
    selectedChip: {
        backgroundColor: Colors.primary,
    },
    filterChipText: {
        fontSize: 13,
        color: '#666',
    },
    selectedChipText: {
        color: '#FFF',
    },
    listContent: {
        padding: 20,
    },
    transactionCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 15,
    },
    doctorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    transId: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    amountText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    footerInfo: {
        flex: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    footerText: {
        fontSize: 12,
        color: '#888',
        marginLeft: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -100,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 15,
    },
});

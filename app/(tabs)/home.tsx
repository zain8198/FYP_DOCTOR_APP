import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';
import { Colors } from '../../constants/Colors';
import { HomeHeader } from '../../components/home/HomeHeader';
import { SearchBar } from '../../components/home/SearchBar';
import { CategoryList } from '../../components/home/CategoryList';
import { DoctorCard } from '../../components/home/DoctorCard';

export default function HomeScreen() {
    const router = useRouter();
    const [doctors, setDoctors] = useState<any[]>([]);

    useEffect(() => {
        const doctorsRef = ref(db, 'doctors');
        const unsubscribe = onValue(doctorsRef, (snapshot) => {
            const data = snapshot.val();
            const doctorList = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key],
                rating: 4.9, // Mock rating to match design
                image: data[key].image || 'https://i.pravatar.cc/150?img=32', // Fallback
                specialty: data[key].specialty || 'Cardiologist',
                price: 300 // Mock price
            })) : [];
            setDoctors(doctorList);
        });

        return () => unsubscribe();
    }, []);

    // Mock data if no doctors fetched to show UI
    const displayDoctors = doctors.length > 0 ? doctors : [
        { id: '1', name: 'Dr. Tasim Jara', specialty: 'Cardiologist', rating: 4.9, price: 300, image: 'https://i.pravatar.cc/150?img=5' },
        { id: '2', name: 'Dr. Nure Jannat', specialty: 'Neurologist', rating: 4.8, price: 250, image: 'https://i.pravatar.cc/150?img=9' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.paddingContainer}>
                    <HomeHeader userName="Rose" />
                    <SearchBar />
                    <CategoryList />

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Available Doctors</Text>
                        <Text style={styles.seeAll}>See All</Text>
                    </View>

                    {displayDoctors.map((doc) => (
                        <DoctorCard
                            key={doc.id}
                            name={doc.name}
                            specialty={doc.specialty}
                            rating={doc.rating}
                            price={doc.price}
                            image={doc.image}
                            onMessagePress={() => router.push({ pathname: "/chat/[id]", params: { id: doc.id, name: doc.name } } as any)}
                        />
                    ))}

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Top 10 Doctor</Text>
                        <Text style={styles.seeAll}>See All</Text>
                    </View>
                    {/* Reusing DoctorCard or a smaller variant just to fill space matching the image snippet at bottom */}
                    {/* For now, just showing another card to simulate the list */}
                    {displayDoctors.length > 1 && (
                        <DoctorCard
                            key={`top-${displayDoctors[1].id}`}
                            name={displayDoctors[1].name}
                            specialty={displayDoctors[1].specialty}
                            rating={displayDoctors[1].rating}
                            price={displayDoctors[1].price}
                            image={displayDoctors[1].image}
                            onMessagePress={() => router.push({ pathname: "/chat/[id]", params: { id: displayDoctors[1].id, name: displayDoctors[1].name } } as any)}
                        />
                    )}

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

import { Text } from 'react-native'; // Import Text for the section headers locally

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    scrollContent: {
        paddingBottom: 100, // Space for bottom tab bar if custom, or just scrolling
    },
    paddingContainer: {
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    seeAll: {
        fontSize: 14,
        color: Colors.textSecondary,
    }
});

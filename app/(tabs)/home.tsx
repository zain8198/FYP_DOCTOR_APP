import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ref, onValue, set, remove, get } from 'firebase/database';
import { db, auth } from '../../firebase';
import { Colors } from '../../constants/Colors';
import { HomeHeader } from '../../components/home/HomeHeader';
import { SearchBar } from '../../components/home/SearchBar';
import { CategoryList } from '../../components/home/CategoryList';
import { DoctorCard } from '../../components/home/DoctorCard';

const CATEGORIES = [
    { id: 1, name: 'General Physician', icon: 'medkit-outline' },
    { id: 2, name: 'Cardiologist', icon: 'heart-outline' },
    { id: 3, name: 'Dentist', icon: 'happy-outline' },
    { id: 4, name: 'Dermatologist', icon: 'water-outline' },
    { id: 5, name: 'Gynecologist', icon: 'woman-outline' },
    { id: 6, name: 'Neurologist', icon: 'bulb-outline' },
    { id: 7, name: 'Orthopedic', icon: 'body-outline' },
    { id: 8, name: 'Pediatrician', icon: 'happy-outline' },
    { id: 9, name: 'Psychiatrist', icon: 'chatbubbles-outline' },
    { id: 10, name: 'ENT Specialist', icon: 'ear-outline' },
    { id: 11, name: 'Eye Specialist', icon: 'eye-outline' },
];

export default function HomeScreen() {
    const router = useRouter();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        const doctorsRef = ref(db, 'doctors');
        const unsubscribe = onValue(doctorsRef, (snapshot) => {
            const data = snapshot.val();
            const doctorList = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key],
                rating: data[key].rating ? parseFloat(data[key].rating) : 4.9,
                image: data[key].image || 'https://i.pravatar.cc/150?img=32',
                specialty: data[key].specialty || 'General',
                price: 300
            })) : [];
            setDoctors(doctorList);
        });

        // Fetch Favorites
        if (auth.currentUser) {
            const favRef = ref(db, `users/${auth.currentUser.uid}/favorites`);
            onValue(favRef, (snapshot) => {
                const data = snapshot.val();
                setFavorites(data ? Object.keys(data) : []);
            });
        }

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (selectedCategory === "All") {
            setFilteredDoctors(doctors);
        } else {
            setFilteredDoctors(doctors.filter(doc => doc.specialty === selectedCategory));
        }
    }, [selectedCategory, doctors]);

    const toggleFavorite = async (doctorId: string) => {
        if (!auth.currentUser) {
            Alert.alert("Login Required", "Please login to add favorites.");
            return;
        }
        const isFav = favorites.includes(doctorId);
        const favRef = ref(db, `users/${auth.currentUser.uid}/favorites/${doctorId}`);

        try {
            if (isFav) {
                await remove(favRef);
            } else {
                await set(favRef, true);
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.paddingContainer}>
                    <HomeHeader userName={auth.currentUser?.displayName?.split(' ')[0] || "User"} />
                    <SearchBar />

                    <CategoryList
                        categories={CATEGORIES}
                        selectedCategory={selectedCategory}
                        onCategorySelect={setSelectedCategory}
                    />

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Available Doctors</Text>
                        <TouchableOpacity onPress={() => setSelectedCategory("All")}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {filteredDoctors.map((doc) => (
                        <DoctorCard
                            key={doc.id}
                            name={doc.name}
                            specialty={doc.specialty}
                            rating={doc.rating}
                            price={doc.price}
                            image={doc.image}
                            isFavorite={favorites.includes(doc.id)}
                            onFavoritePress={() => toggleFavorite(doc.id)}
                            onMessagePress={() => router.push({ pathname: "/chat/[id]", params: { id: doc.id, name: doc.name } } as any)}
                            onPress={() => router.push({ pathname: "/doctor-details", params: { id: doc.id } } as any)}
                        />
                    ))}

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Top 10 Doctor</Text>
                        <Text style={styles.seeAll}>See All</Text>
                    </View>

                    {filteredDoctors.length > 0 && (
                        <DoctorCard
                            key={`top-${filteredDoctors[0].id}`}
                            name={filteredDoctors[0].name}
                            specialty={filteredDoctors[0].specialty}
                            rating={filteredDoctors[0].rating}
                            price={filteredDoctors[0].price}
                            image={filteredDoctors[0].image}
                            isFavorite={favorites.includes(filteredDoctors[0].id)}
                            onFavoritePress={() => toggleFavorite(filteredDoctors[0].id)}
                            onMessagePress={() => router.push({ pathname: "/chat/[id]", params: { id: filteredDoctors[0].id, name: filteredDoctors[0].name } } as any)}
                            onPress={() => router.push({ pathname: "/doctor-details", params: { id: filteredDoctors[0].id } } as any)}
                        />
                    )}

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}



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

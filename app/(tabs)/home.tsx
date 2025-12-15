import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Text, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
                    <HomeHeader
                        userName={auth.currentUser?.displayName?.split(' ')[0] || "User"}
                        userImage={auth.currentUser?.photoURL}
                    />
                    <SearchBar />

                    {/* Quick Actions - Business Model */}
                    <View style={styles.quickActionsContainer}>
                        <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert("Coming Soon", "Ambulance functionality integrated with Google Maps API.")}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                                <Ionicons name="medical" size={24} color="#D32F2F" />
                            </View>
                            <Text style={styles.actionText}>Ambulance</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert("Coming Soon", "Pharmacy integration for medicine delivery.")}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                                <Ionicons name="bandage" size={24} color="#1976D2" />
                            </View>
                            <Text style={styles.actionText}>Pharmacy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert("Coming Soon", "Search nearby hospitals.")}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="business" size={24} color="#388E3C" />
                            </View>
                            <Text style={styles.actionText}>Hospital</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert("Coming Soon", "Book Lab Tests at home.")}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                                <Ionicons name="flask" size={24} color="#F57C00" />
                            </View>
                            <Text style={styles.actionText}>Lab Test</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Health Tips Carousel */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Daily Health Tips 💡</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                        <View style={[styles.healthCard, { backgroundColor: '#E0F7FA' }]}>
                            <View style={styles.healthTextContainer}>
                                <Text style={styles.healthTitle}>Stay Hydrated</Text>
                                <Text style={styles.healthDesc}>Drink at least 8 glasses of water daily.</Text>
                            </View>
                            <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/3105/3105807.png" }} style={styles.healthIcon} />
                        </View>

                        <View style={[styles.healthCard, { backgroundColor: '#FFF8E1' }]}>
                            <View style={styles.healthTextContainer}>
                                <Text style={styles.healthTitle}>Healthy Diet</Text>
                                <Text style={styles.healthDesc}>Eat more greens and less sugar.</Text>
                            </View>
                            <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/2916/2916315.png" }} style={styles.healthIcon} />
                        </View>

                        <View style={[styles.healthCard, { backgroundColor: '#F3E5F5' }]}>
                            <View style={styles.healthTextContainer}>
                                <Text style={styles.healthTitle}>Sleep Well</Text>
                                <Text style={styles.healthDesc}>7-8 hours of sleep is essential.</Text>
                            </View>
                            <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/2933/2933116.png" }} style={styles.healthIcon} />
                        </View>
                    </ScrollView>

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
                        <Text style={styles.sectionTitle}>Top Rated Doctors</Text>
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
    },
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        marginTop: 10,
    },
    quickAction: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.text,
    },
    healthCard: {
        width: 280,
        height: 100,
        borderRadius: 15,
        padding: 15,
        marginRight: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    healthTextContainer: {
        flex: 1,
    },
    healthTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    healthDesc: {
        fontSize: 12,
        color: '#666',
        maxWidth: '90%',
    },
    healthIcon: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    }
});

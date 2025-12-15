import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native";
import { Text, Card, Avatar, Button, useTheme, Searchbar } from "react-native-paper";
import { useRouter } from "expo-router";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

// Removed mock DOCTORS
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { useEffect } from "react";

const CATEGORIES = [
    { id: '0', name: 'All', icon: 'apps' },
    { id: '1', name: 'General Physician', icon: 'doctor' },
    { id: '2', name: 'Cardiologist', icon: 'heart-pulse' },
    { id: '3', name: 'Dentist', icon: 'tooth' },
    { id: '4', name: 'Dermatologist', icon: 'face-woman' },
    { id: '5', name: 'Gynecologist', icon: 'mother-heart' },
    { id: '6', name: 'Neurologist', icon: 'brain' },
    { id: '7', name: 'Orthopedic', icon: 'bone' },
    { id: '8', name: 'Pediatrician', icon: 'baby-face' },
    { id: '9', name: 'Psychiatrist', icon: 'head-cog' },
    { id: '10', name: 'ENT Specialist', icon: 'ear-hearing' },
    { id: '11', name: 'Eye Specialist', icon: 'eye' },
];

const QUICK_ACCESS = [
    { id: '1', name: 'Book Appointment', route: '/(tabs)/appointments' },
    { id: '2', name: 'Lab Tests', route: '/lab-tests' }, // Placeholder route
];

export default function HomeScreen() {
    const theme = useTheme();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const doctorsRef = ref(db, 'doctors');
        console.log("Attempting to fetch doctors from:", doctorsRef.toString());

        const unsubscribe = onValue(doctorsRef, (snapshot) => {
            const data = snapshot.val();
            console.log("Doctors data fetched:", data);

            const doctorList = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key],
                rating: 5.0,
                image: null,
                specialty: data[key].specialty || 'General'
            })) : [];

            console.log("Parsed doctor list:", doctorList.length);
            setDoctors(doctorList);
        }, (error) => {
            console.error("Firebase Read Error:", error);
            alert("Error fetching doctors: " + error.message);
        });

        return () => unsubscribe();
    }, []);

    const filteredDoctors = doctors.filter(doc => {
        const matchesSearch = doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || doc.specialty === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <ThemedBackground style={{ padding: 0 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

                {/* Header Section */}
                <View style={[styles.header, { backgroundColor: theme.colors.primaryContainer }]}>
                    <View>
                        <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>Hello,</Text>
                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer }}>
                            Find Your Doctor
                        </Text>
                    </View>
                    <Avatar.Image size={48} source={{ uri: 'https://i.pravatar.cc/150?img=12' }} />
                </View>

                {/* Search */}
                <Searchbar
                    placeholder="Search doctor, medicines..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />

                {/* Hero Card */}
                <Card style={styles.heroCard} mode="elevated">
                    <Card.Cover source={{ uri: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" }} style={{ height: 150 }} />
                    <Card.Content style={styles.heroContent}>
                        <Text variant="titleLarge" style={{ color: '#fff', fontWeight: 'bold' }}>Stay Healthy!</Text>
                        <Text variant="bodyMedium" style={{ color: '#fff' }}>Check your health status regularly.</Text>
                    </Card.Content>
                </Card>

                {/* Categories */}
                <View style={styles.section}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 20 }}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryCard,
                                    { backgroundColor: selectedCategory === cat.name ? theme.colors.primary : theme.colors.surfaceVariant }
                                ]}
                                onPress={() => setSelectedCategory(cat.name)}
                            >
                                <Avatar.Icon
                                    size={40}
                                    icon={cat.icon}
                                    style={{ backgroundColor: selectedCategory === cat.name ? theme.colors.onPrimary : theme.colors.primary }}
                                    color={selectedCategory === cat.name ? theme.colors.primary : theme.colors.onPrimary}
                                />
                                <Text style={{
                                    marginTop: 8,
                                    color: selectedCategory === cat.name ? theme.colors.onPrimary : theme.colors.onSurface,
                                    textAlign: 'center',
                                    fontSize: 12
                                }}>
                                    {cat.name.replace(' Specialist', '')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Top Doctors */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text variant="titleLarge" style={styles.sectionTitle}>Top Doctors</Text>
                        <Button mode="text" onPress={() => setSelectedCategory("All")}>See All</Button>
                    </View>

                    {filteredDoctors.length === 0 ? (
                        <Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.secondary }}>No doctors found.</Text>
                    ) : (
                        filteredDoctors.map((doc) => (
                            <Card key={doc.id} style={styles.doctorCard} onPress={() => router.push({ pathname: "/doctor-details", params: { id: doc.id } } as any)}>
                                <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
                                    <Avatar.Image size={60} source={{ uri: doc.image || 'https://i.pravatar.cc/150?u=' + doc.id }} />
                                    <View style={{ marginLeft: 15, flex: 1 }}>
                                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{doc.name}</Text>
                                        <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>{doc.specialty}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Avatar.Icon size={16} icon="star" style={{ backgroundColor: 'transparent' }} color="#FFD700" />
                                            <Text style={{ marginLeft: 4 }}>{doc.rating}</Text>
                                        </View>
                                    </View>
                                </View>
                            </Card>
                        ))
                    )}
                </View>

            </ScrollView>
        </ThemedBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 20,
        paddingTop: 60,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    searchBar: {
        margin: 20,
        marginTop: -25,
        elevation: 4,
    },
    heroCard: {
        marginHorizontal: 20,
        marginBottom: 20,
        overflow: 'hidden',
    },
    heroContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 20,
    },
    sectionTitle: {
        marginLeft: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    categoryCard: {
        width: 100,
        height: 110,
        marginRight: 10,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5
    },
    doctorCard: {
        marginHorizontal: 20,
        marginBottom: 10,
    }
});

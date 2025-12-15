import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Gradient support
import Headline from "../subcomponents/Headline";
import CategoryList from "../subcomponents/CategoryList";
import Card from "../subcomponents/Card";
import QuickRoute from "../subcomponents/QuickRoute";
import doctors from "../consts/Doctor";
import pageImages from "../consts/PageImages";

export default function HomeScreen({ navigation }) {
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const { width } = Dimensions.get("screen");
  const cardWidth = width / 1.9;

  const handleNotificationPress = () => {
    console.log("Notification Icon Pressed");
  };

  return (
    <View style={styles.container}>
      {/* Headline */}
      <Headline onNotificationPress={handleNotificationPress} />

      {/* Main Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Introductory Card */}
        <LinearGradient
          colors={["#22177A", "#80C4E9", "#D4EBF8"]} // Updated theme colors
          style={styles.introCard}
        >
          <View style={styles.introContent}>
            {/* Text Content */}
            <View style={styles.introTextContainer}>
              <Text style={styles.introTitle}>Find Your Doctor Here</Text>
              <Text style={styles.introDescription}>
                Discover expert healthcare professionals, book appointments
                easily, and manage your health efficiently with our app.
              </Text>
            </View>
            {/* Image */}
            <Image
              source={require("../../assets/images/card.png")} // Replace with your image path
              style={styles.introImage}
              
            />
          </View>
        </LinearGradient>

        {/* Category List */}
        <CategoryList />

        {/* Doctors List */}
        <View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={doctors}
            contentContainerStyle={{ paddingVertical: 30, paddingLeft: 20 }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                disabled={activeCardIndex !== index}
                activeOpacity={0.9}
                onPress={() => navigation.navigate("Booking", item)}
              >
                <Card doctor={item} index={index} />
              </TouchableOpacity>
            )}
            onMomentumScrollEnd={(e) =>
              setActiveCardIndex(
                Math.round(e.nativeEvent.contentOffset.x / cardWidth)
              )
            }
          />
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccessHeader}>
          <Text style={styles.quickAccessText}>Quick Access</Text>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={pageImages}
          contentContainerStyle={{ paddingLeft: 20, paddingVertical: 30 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate(item)}
            >
              <QuickRoute page={item} />
            </TouchableOpacity>
          )}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  introCard: {
    margin: 20,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  introContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  introTextContainer: {
    flex: 2,
  },
  introTitle: {
    fontSize: 22,
    fontFamily: 'OpenSans_700Bold',
    color: "#FFFFFF",
    marginBottom: 10,
  },
  introDescription: {
    fontSize: 14,
    fontFamily: 'OpenSans_400Regular',
    color: "#22177A",
    lineHeight: 20,
  },
  introImage: {
    flex: 1,
    width: "120%",
    height: 100,
    marginLeft: 10,
  },
  quickAccessHeader: {
    marginTop: 20,
    marginLeft: 20,
  },
  quickAccessText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
});

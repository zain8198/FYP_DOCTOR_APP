import React from "react";
import { StyleSheet, View, Text, ScrollView, Image } from "react-native";

function DietPlanScreen({ route }) {
  const meal = route?.params?.meal;

  if (!meal) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No meal data provided.</Text>
      </View>
    );
  }

  const renderBulletPoints = (text) => {
    return text.split("\n").map((line, index) => {
      if (line.startsWith("**")) {
        return <Text key={index} style={styles.sectionTitle}>{line.replace("**", "")}</Text>;
      } else if (line.startsWith("-")) {
        return <Text key={index} style={styles.bulletPoint}>• {line.substring(1).trim()}</Text>;
      } else {
        return <Text key={index} style={styles.description}>{line}</Text>;
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={meal.mealImage} style={styles.image} />
      <Text style={styles.title}>{meal.title}</Text>
      {renderBulletPoints(meal.dietPlanDetails)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FC",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontFamily: 'OpenSans_700Bold',
    color: "#22177A",
    marginBottom: 15,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'OpenSans_400Regular',
    color: "#333",
    marginTop: 15,
  },
  bulletPoint: {
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
    color: "#555",
    marginBottom: 8,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    fontFamily: 'OpenSans_400Regular',
    color: "#555",
    lineHeight: 24,
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F7FC",
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'OpenSans_400Regular',
    fontWeight: "700",
    color: "#ff0000",
  },
});

export default DietPlanScreen;

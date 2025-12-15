import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  StyleSheet,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { doctors } from "../consts/Doctor";

const CheckoutScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // 🏥 Extract appointment details
  const { appointment } = route.params || {};
  if (!appointment || !appointment.doctor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: Appointment details not found.</Text>
      </View>
    );
  }

  const doctorName = appointment.doctor; // Doctor's name from database
  console.log("Doctor Name from Database:", doctorName);

  // 🔍 Find the doctor in doctors.js
  const selectedDoctor = doctors.find(
    (doc) => `${doc.firstname} ${doc.lastname}` === doctorName
  );

  if (!selectedDoctor) {
    console.error("Error: Doctor not found in the list!");
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Doctor details not found.</Text>
      </View>
    );
  }

  console.log("Fetched Doctor Data:", selectedDoctor);

  const doctorPrice = selectedDoctor.price || "N/A";
  const basePaymentLink = selectedDoctor.paymentLink || null;

  // 🔄 Append deep link for successful payment redirection
  const paymentLink = basePaymentLink ? `${basePaymentLink}` : null;

  // Helper function to format the date
  const formatDate = (date) => {
    if (date instanceof Date) {
      return date.toLocaleString(); // Convert Date object to string
    }
    return date; // If it's already a string, just return it
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Your Appointment</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Doctor:</Text>
        <Text style={styles.value}>{doctorName}</Text>

        <Text style={styles.label}>Specialization:</Text>
        <Text style={styles.value}>{appointment.professional}</Text>

        <Text style={styles.label}>Time:</Text>
        <Text style={styles.value}>{formatDate(appointment.date)}</Text>

        <Text style={styles.label}>Meeting Type:</Text>
        <Text style={styles.value}>{appointment.meeting}</Text>

        <Text style={styles.label}>Consultation Fee:</Text>
        <Text style={styles.value}>Rs. {doctorPrice}</Text>
      </View>

      {/* Payment Options */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (paymentLink) {
            Linking.openURL(paymentLink).then(() => {
              Alert.alert("Payment Successful", "Your appointment has been confirmed.");
              setTimeout(() => {
                navigation.navigate("HomeScreen");
              }, 2000); // Delay navigation for 2 seconds
            });
          } else {
            Alert.alert("Error", "Payment link not available.");
          }
        }}
      >
        <LinearGradient
          colors={["#00C6FF", "#0072FF"]}
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>Pay Online</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.cashButton]}
        onPress={() => {
          Alert.alert("Success", "Your appointment is booked.");
          setTimeout(() => {
            navigation.navigate("HomeScreen");
          }, 2000); // Delay navigation for 2 seconds
        }}
      >
        <Text style={styles.buttonText}>Pay In-Person</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8",
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    width: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: "#222",
    marginBottom: 5,
  },
  button: {
    width: "90%",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 20,
  },
  gradientButton: {
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cashButton: {
    backgroundColor: "#28A745",
    padding: 15,
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default CheckoutScreen;

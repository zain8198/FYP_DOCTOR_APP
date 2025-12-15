import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { db, auth } from "../../firebase";
import { ref, get } from "firebase/database";
import { doctors } from "../../components/consts/Doctor"; // Importing doctors data

const DoctorProfile = () => {
  const [doctorName, setDoctorName] = useState("");
  const [doctorGreeting, setDoctorGreeting] = useState("");
  const [doctorProfessional, setDoctorProfessional] = useState("");
  
  useEffect(() => {
    const fetchDoctorDetails = async () => {
      const user = auth.currentUser;
      if (user) {
        // Fetching the doctor's name and professional details from Firebase
        const doctorRef = ref(db, `doctors/${user.uid}`);
        const doctorSnapshot = await get(doctorRef);
        if (doctorSnapshot.exists()) {
          const doctorData = doctorSnapshot.val();
          setDoctorName(doctorData.name);
          setDoctorProfessional(doctorData.profession); // Get professional data from Firebase
          
          // Fetching the greeting from the doctor.js file using the doctor's name
          const greeting = doctors[doctorData.name]?.greeting || "No greeting available.";
          setDoctorGreeting(greeting);
        }
      }
    };

    fetchDoctorDetails();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome, Dr. {doctorName}</Text>
      <Text style={styles.subheading}>Specialization: {doctorProfessional}</Text>
      <Text style={styles.headerText}>Doctor's Greeting</Text>
      <Text style={styles.greetingText}>{doctorGreeting}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 20,
    alignItems: "center",
  },
  heading: {
    fontSize: 25,
    fontFamily: "OpenSans_700Bold",
    color: "#22177A",
    marginBottom: 20,
  },
  subheading: {
    fontSize: 18,
    color: "#555",
    marginBottom: 10,
  },
  headerText: {
    fontSize: 22,
    fontFamily: "OpenSans_700Bold",
    color: "#22177A",
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default DoctorProfile;
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Dimensions, FlatList, Image } from "react-native";
import { auth, db } from "../../firebase";
import { ref, onValue } from 'firebase/database';
import doctors from '../consts/Doctor';

function AppointmentScreen({ navigation, route }) {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = () => {
    if (auth.currentUser) {
      const appointmentRef = ref(db, `appointments/${auth.currentUser?.uid}`);
      onValue(appointmentRef, (snapshot) => {
        const data = snapshot.val();
        console.log("Fetched data:", data);
        setAppointments(data ? Object.values(data) : []);
      });
    } else {
      console.log("User is not authenticated");
    }
  };

  const getDoctorImage = (doctorName) => {
    const doctor = doctors.find(
      (doc) => `${doc.firstname} ${doc.lastname}` === doctorName
    );
    return doctor ? doctor.image : require("../../assets/images/default_doctor.jpg");
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <View style={styles.cardContent}>
              <Image source={getDoctorImage(item.doctor)} style={styles.doctorImage} />
              <View style={styles.textContainer}>
                <Text style={styles.header}>Dr. {item.doctor}</Text>
                <Text style={styles.subText}>Meeting type: {item.meeting}</Text>
                <Text style={styles.subText}>Meeting time: {item.date}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

export default AppointmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F0F0",
    paddingTop: 20,
  },
  cardContainer: {
    marginVertical: 15,
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 10,
    width: Dimensions.get("window").width * 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  header: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  subText: {
    fontSize: 12,
    color: "#555",
    marginTop: 5,
  },
});

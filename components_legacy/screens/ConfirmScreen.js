import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Dimensions, Alert, ImageBackground } from "react-native";
import { Button } from "react-native-elements";
import { auth, db } from "../../firebase";
import { ref, remove } from "firebase/database";

function ConfirmScreen({ navigation, route }) {
  const [appointment, setAppointment] = useState(null);

  // Get the appointment data passed from the previous screen
  const { appointment: passedAppointment } = route.params;

  useEffect(() => {
    if (passedAppointment) {
      setAppointment({
        ...passedAppointment,
      });
    } else {
      Alert.alert("Error", "Appointment data not found.");
    }
  }, [passedAppointment]);

  const cancelAppointment = async () => {
    if (!appointment) {
      Alert.alert("No appointment found");
      return;
    }

    const userId = auth.currentUser?.uid;

    if (userId) {
      const appointmentRef = ref(db, `appointments/${userId}/${appointment.id || passedAppointment.id}`);

      try {
        await remove(appointmentRef); // Remove the appointment from the database
        Alert.alert("Success", "Your appointment has been canceled.");
        navigation.navigate("HomeScreen"); // Navigate to HomeScreen after cancellation
      } catch (error) {
        console.error("Error canceling appointment:", error);
        Alert.alert("Error", "An error occurred while canceling your appointment.");
      }
    }
  };

  const goBackHome = () => {
    navigation.navigate("HomeScreen"); // Ensure that 'HomeScreen' exists in your navigator
  };

  // Helper function to format the date
  const formatDate = (date) => {
    if (date instanceof Date) {
      return date.toLocaleString(); // Convert Date object to string
    }
    return date; // If it's already a string, just return it
  };
  const goToCheckout = () => {
    navigation.navigate("CheckoutScreen", { appointment }); // Pass the appointment to checkout screen
  };


  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/confirm.jpg")} // Path to your background image
        style={styles.background}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Congratulations! Your appointment was submitted.</Text>
            </View>

            <View style={styles.subHeader}>
              <Text style={styles.subHeaderText}>Here is your appointment information:</Text>
              {appointment ? (
                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>Doctor: {appointment.doctor}</Text>
                  <Text style={styles.infoText}>Date: {formatDate(appointment.date)}</Text>
                  <Text style={styles.infoText}>Professional: {appointment.professional}</Text>
                  <Text style={styles.infoText}>Meeting: {appointment.meeting}</Text>
                  
                </View>
              ) : (
                <Text style={styles.infoText}>Loading...</Text>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <View style={styles.button}>
                <Button
                  title="Cancel Appointment"
                  onPress={cancelAppointment}
                  buttonStyle={styles.cancelButton}
                  titleStyle={styles.buttonTitle}
                />
              </View>
              <View style={styles.button}>
                <Button
                  title="Go Back Home"
                  onPress={goBackHome}
                  buttonStyle={styles.homeButton}
                  titleStyle={styles.buttonTitle}
                />
              </View>
            </View>
            <View style={styles.button}>
              <Button
                title="Proceed to Payment"
                onPress={goToCheckout}
                buttonStyle={styles.paymentButton}
                titleStyle={styles.buttonTitle}
              />
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

export default ConfirmScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  background: {
    flex: 1,
    resizeMode: 'cover', // Ensure the background image covers the screen
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for better contrast
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    width: '90%',
    padding: 10,
    backgroundColor: 'rgba(240, 235, 235, 0.8)', // Slight transparency for text readability
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginTop: 60,
    marginBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontFamily: 'OpenSans_700Bold',
    color: '#22177A',
    textAlign: 'center',
  },
  subHeader: {
    marginBottom: 20,
  },
  subHeaderText: {
    fontSize: 16,
    fontFamily: 'OpenSans_600SemiBold',
    color: '#333',
    textAlign: 'center',
  },
  infoContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    color: "#333",
    fontFamily: 'OpenSans_400Regular',
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  button: {
    marginHorizontal: 10,
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#FF6347',
    borderRadius: 10,
    paddingVertical: 12,
  },
  homeButton: {
    backgroundColor: '#22177A',
    borderRadius: 10,
    paddingVertical: 12,
  },
  paymentButton: {
    backgroundColor: '#3D8D7A',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 20,
  },
  buttonTitle: {
    fontSize: 16,
    fontFamily: 'OpenSans_600SemiBold',
  },
});

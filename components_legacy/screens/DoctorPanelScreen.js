import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { db, auth } from "../../firebase";
import { ref, get } from "firebase/database";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DoctorProfile from "./DoctorProfile";
import { Calendar } from "react-native-calendars";

// DoctorDashboard Component
function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    const fetchDoctorDetailsAndAppointments = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("No doctor is logged in.");
          setLoading(false);
          return;
        }
  
        const userId = user.uid;
  
        // Fetch doctor details
        const doctorRef = ref(db, `doctors/${userId}`);
        const doctorSnapshot = await get(doctorRef);
  
        if (!doctorSnapshot.exists()) {
          setError("Doctor's details not found in the database.");
          setLoading(false);
          return;
        }
  
        const doctorDetails = doctorSnapshot.val();
        setDoctorName(doctorDetails.name);
  
        // Fetch appointments for all users
        const appointmentsRef = ref(db, "appointments");
        const appointmentsSnapshot = await get(appointmentsRef);
  
        if (appointmentsSnapshot.exists()) {
          const allAppointments = appointmentsSnapshot.val();
          const doctorAppointments = [];
  
          // Iterate through each user to check their appointments
          for (let userId in allAppointments) {
            const userAppointments = allAppointments[userId];
  
            // Filter appointments that match the logged-in doctor's name
            for (let appointmentId in userAppointments) {
              const appointment = userAppointments[appointmentId];
              if (appointment.doctor === doctorDetails.name) {
                // Fetch patient details
                const patientRef = ref(db, `users/${userId}`);
                const patientSnapshot = await get(patientRef);
                let patientName = "Unknown Patient";
  
                if (patientSnapshot.exists()) {
                  const patientDetails = patientSnapshot.val();
                  patientName = patientDetails.displayName || "Unknown Patient";
                }
  
                doctorAppointments.push({
                  id: appointmentId,
                  patientName: patientName,
                  ...appointment,
                });
              }
            }
          }
  
          setAppointments(doctorAppointments);
        } else {
          setAppointments([]);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setError("Failed to fetch appointments. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchDoctorDetailsAndAppointments();
  }, []);
  
  const toggleCalendar = () => {
    setCalendarVisible(!calendarVisible);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Appointments, Dr. {doctorName}</Text>

      {loading ? (
        <Text style={styles.loadingText}>Loading appointments...</Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : appointments.length === 0 ? (
        <Text style={styles.noAppointments}>No appointments found.</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedDate(item.date);
                toggleCalendar();
              }}
              style={styles.appointmentCard}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="calendar" size={20} color="#22177A" />
                <Text style={styles.patientName}>Patient: {item.patientName}</Text>
              </View>
              <Text style={styles.appointmentText}>Date: {item.date}</Text>
              <Text style={styles.appointmentText}>Meeting Type: {item.meeting}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {calendarVisible && (
        <Calendar
          markedDates={{
            [selectedDate]: { selected: true, marked: true, selectedColor: "#22177A" },
          }}
          onDayPress={(day) => {
            setSelectedDate(day.dateString); // Update selected date
            toggleCalendar(); // Close the calendar after date selection
          }}
          style={styles.calendar}
        />
      )}
    </View>
  );
}


// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate("DoctorLogin"); // Navigate to the login screen after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === "Dashboard") {
              iconName = "calendar";
            } else if (route.name === "Profile") {
              iconName = "person-circle";
            } else if (route.name === "Logout") {
              iconName = "log-out";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#22177A",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Dashboard" component={DoctorDashboard} />
        <Tab.Screen name="Profile" component={DoctorProfile} />
        <Tab.Screen
          name="Logout"
          component={() => null} // Empty component
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); // Prevent tab from switching
              handleLogout(); // Log out on tab press
            },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    color: "#22177A",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: 'OpenSans_700Bold',
  },
  appointmentCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  patientName: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
    fontFamily: 'OpenSans_700Bold',
  },
  appointmentText: {
    fontSize: 14,
    color: "#555",
    fontFamily: 'OpenSans_400Regular',
  },
  logoutButton: {
    width: "80%",
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "#22177A",
    alignSelf: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: 'OpenSans_400Regular',
  },
  calendar: {
    marginTop: 20,
  },
});

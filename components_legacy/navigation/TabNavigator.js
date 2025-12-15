import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Ionicons from "react-native-vector-icons/Ionicons";
import AppointmentScreen from "../screens/AppointmentScreen";
import BookingScreen from "../screens/BookingScreen";
import ChatBot from "../screens/ChatBotScreen"
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeStack"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{
          title: "Book Appointment",
          headerTitleAlign: "center",
          headerTitleStyle: { fontSize: 18, fontWeight: "bold" },
        }}
      />
    </Stack.Navigator>
  );
};

const HomeTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home-outline"; // Corrected icon name
          } else if (route.name === "Appointment") {
            iconName = "calendar-outline"; // Corrected icon name
          } else if (route.name === "ChatBot") {
            iconName = "chatbubbles-outline";
          } else if (route.name === "Profile") {
            iconName = "person-outline"; // Corrected icon name
          }


          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#216afc",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Appointment"
        component={AppointmentScreen}
        options={{
          headerShown: true,
          headerTitle: "Customer's Appointment",
          headerTitleAlign: "center",
        }}
      />
      <Tab.Screen
        name="ChatBot"
        component={ChatBot}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerTitle: "Personal Information",
          headerTitleAlign: "center",
        }}
      />
    </Tab.Navigator>
  );
};

export default HomeTabNavigator;

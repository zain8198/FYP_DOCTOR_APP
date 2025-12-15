import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import HomeTabNavigator from "./TabNavigator";
import ProfileScreen from "../screens/ProfileScreen";
import SignUpScreen from "../screens/SignUpScreen";
import { enableScreens } from 'react-native-screens';
import DoctorLogin from "../screens/DoctorLogin";
import DoctorPanelScreen from "../screens/DoctorPanelScreen";
import DoctorRegistrationScreen from "../screens/DoctorRegistrationScreen";
import ConfirmScreen from "../screens/ConfirmScreen";
import SplashScreen from "../screens/SplashScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import AppointmentScreen from "../screens/AppointmentScreen";



enableScreens();
const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SplashScreen"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DoctorLogin"
        component={DoctorLogin}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignUpScreen"
        component={SignUpScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HomeScreen"
        component={HomeTabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DoctorDashboard"
        component={DoctorPanelScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DoctorRegister"
        component={DoctorRegistrationScreen}
        options={{
          headerShown: false,
        }}
        
      />
      <Stack.Screen
        name="ConfirmScreen"
        component={ConfirmScreen}
        options={{headerShown: false,
        }}
        
      />
      <Stack.Screen
        name="CheckoutScreen"
        component={CheckoutScreen}
        options={{headerShown: false,
        }}
        
      />
      <Stack.Screen
        name="Appointment"
        component={AppointmentScreen}
        options={{headerShown: false,
        }}
        
      />

    </Stack.Navigator>
  );
};

export default StackNavigator;

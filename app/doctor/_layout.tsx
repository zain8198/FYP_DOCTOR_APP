import { Tabs } from "expo-router";
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

export default function DoctorLayout() {
    const insets = useSafeAreaInsets();
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: '#999',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#e0e0e0',
                    height: Platform.OS === 'ios' ? 85 : 65 + insets.bottom,
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    tabBarLabel: "Dashboard",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="feedback"
                options={{
                    tabBarLabel: "Reviews",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="star-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    tabBarLabel: "Messages",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubbles-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarLabel: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

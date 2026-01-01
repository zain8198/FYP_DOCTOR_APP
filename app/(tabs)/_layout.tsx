import { View, StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false, // Image shows icons primarily, cleaner look
                tabBarActiveTintColor: Colors.white,
                tabBarInactiveTintColor: Colors.primary,
                tabBarStyle: {
                    backgroundColor: Colors.white,
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    height: 70 + (Platform.OS === 'ios' ? insets.bottom : 0),
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
                    paddingTop: 10,
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={[
                            styles.iconContainer,
                            focused && styles.activeIconContainer
                        ]}>
                            <Ionicons
                                name={focused ? "home" : "home-outline"}
                                size={24}
                                color={focused ? Colors.white : Colors.primary}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="appointments"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={[
                            styles.iconContainer,
                            focused && styles.activeIconContainer
                        ]}>
                            <Ionicons
                                name={focused ? "calendar" : "calendar-outline"}
                                size={24}
                                color={focused ? Colors.white : Colors.textSecondary} // Using textSecondary for inactive non-primary
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="chatbot"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={[
                            styles.iconContainer,
                            focused && styles.activeIconContainer
                        ]}>
                            <Ionicons
                                name={focused ? "chatbubbles" : "chatbubbles-outline"}
                                size={24}
                                color={focused ? Colors.white : Colors.textSecondary}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={[
                            styles.iconContainer,
                            focused && styles.activeIconContainer
                        ]}>
                            <Ionicons
                                name={focused ? "receipt" : "receipt-outline"}
                                size={24}
                                color={focused ? Colors.white : Colors.textSecondary}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={[
                            styles.iconContainer,
                            focused && styles.activeIconContainer
                        ]}>
                            <Ionicons
                                name={focused ? "person" : "person-outline"}
                                size={24}
                                color={focused ? Colors.white : Colors.textSecondary}
                            />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
    },
    activeIconContainer: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    }
});

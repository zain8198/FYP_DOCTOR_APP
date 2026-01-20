import { Stack } from "expo-router";
import { MD3LightTheme as DefaultTheme, PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, OpenSans_400Regular, OpenSans_700Bold } from "@expo-google-fonts/open-sans";
import { useEffect, useState } from "react";
import AnimatedSplashScreen from "../components/AnimatedSplashScreen";
import { usePushNotifications } from "../hooks/usePushNotifications";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#2F8062", // Exact match from Colors.ts
    onPrimary: "#FFFFFF",
    primaryContainer: "#E8F5E9", // Colors.lightGreen
    onPrimaryContainer: "#001e00", // Dark text on light container
    secondary: "#2F8062", // Reusing primary as secondary for brand consistency, or could use darkGreen
    secondaryContainer: "#EAF4F0", // Colors.iconBg
    tertiary: "#1B5E20", // Colors.darkGreen
    background: "#F4F9F6", // Colors.background
    surface: "#FFFFFF", // Colors.card
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    OpenSans_400Regular,
    OpenSans_700Bold,
  });

  const { expoPushToken, notification } = usePushNotifications(); // Initialize push notifications
  const [appReady, setAppReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

  // Save push token to user profile when logged in
  useEffect(() => {
    if (!expoPushToken) return;

    // Use onAuthStateChanged to ensure we get the user even if login happens later
    const { onAuthStateChanged } = require("firebase/auth");
    const { auth, db } = require("../firebase"); // Require locally to assume initialized
    const { ref, update } = require("firebase/database");

    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (user) {
        try {
          // Update user's profile with the token
          const userRef = ref(db, `users/${user.uid}`);
          await update(userRef, {
            expoPushToken: expoPushToken
          });
          console.log("Push Token saved to Firebase for user:", user.uid);

          // Optional: Also try doctors path if we don't know the role, or handle it better if we do know.
          // For now, let's just do 'users' as that seems to be the primary identity store or just safe enough.
          // If doctors are separate, we might need to check.
          // Let's safe update doctors table too if we can distinguish, or just both if unsure.
          // Or check if user exists in doctors path.
          const { get } = require("firebase/database");
          const docRef = ref(db, `doctors/${user.uid}`);
          const docSnap = await get(docRef);
          if (docSnap.exists()) {
            await update(docRef, { expoPushToken: expoPushToken });
            console.log("Push Token saved to Firebase for doctor:", user.uid);
          }

        } catch (error) {
          console.error("Error saving push token to Firebase:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [expoPushToken]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Create a small delay or ensure native splash hides only when we are ready to show our custom one
      setAppReady(true);
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!appReady || !splashAnimationFinished) {
    if (appReady && !splashAnimationFinished) {
      return (
        <AnimatedSplashScreen onAnimationFinish={() => setSplashAnimationFinished(true)} />
      );
    }
    return null; // Keep showing native splash until fonts/appReady is true
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="auto" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

import { Stack } from "expo-router";
import { MD3LightTheme as DefaultTheme, PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, OpenSans_400Regular, OpenSans_700Bold } from "@expo-google-fonts/open-sans";
import { useEffect, useState } from "react";
import AnimatedSplashScreen from "../components/AnimatedSplashScreen";

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

  const [appReady, setAppReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

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

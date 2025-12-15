import React, { useEffect } from "react";
import { StyleSheet, View, Text, ImageBackground, TouchableOpacity } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

const SplashScreen = ({ navigation }) => {
  // Animation values
  const backgroundOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate background opacity
    backgroundOpacity.value = withTiming(1, { duration: 1500 });

    // Animate text opacity after the background animation
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 1500 });
    }, 1000);
  }, []);

  // Animated styles for background and text
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Background Image with opacity animation */}
      <Animated.View style={[StyleSheet.absoluteFill, backgroundAnimatedStyle]}>
        <ImageBackground
          source={require("../../assets/images/bgsp.jpg")} // Replace with your background image
          style={styles.background}
        />
      </Animated.View>

      {/* Overlay Text */}
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
      <Text style={styles.title}>Welcome to HealthSnap</Text>
        <Text style={styles.title}>Your Health, Our Priority</Text>
        <Text style={styles.subtitle}>Schedule appointments with top doctors easily and securely.</Text>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace("LoginScreen")} // Navigate on button press
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
   
  },
  background: {
    flex: 1,
    opacity: 0.3,
  },
  textContainer: {

    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop:400,
  },
  title: {
    fontSize: 20,
    fontFamily: 'OpenSans_700Bold',
    color: "black",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "black",
    textAlign: "center",
    marginBottom: 30,
    fontFamily: 'OpenSans_400Regular',
  },
  button: {
    backgroundColor: "#22177A",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
  },
});

export default SplashScreen;

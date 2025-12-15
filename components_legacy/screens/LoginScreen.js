import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { Button } from "react-native-elements";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useFonts, OpenSans_400Regular, OpenSans_700Bold } from '../../assets/fonts/fonts';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigateSignUp = () => {
    navigation.navigate("SignUpScreen");
  };

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        navigation.navigate("HomeScreen");
        console.log("Logged in with", user.email);
      })
      .catch((error) => alert(error.message));
  };

  const navigateDoctorLogin = () => {
    navigation.navigate("DoctorLogin"); // Navigate to the Doctor Login screen
  };
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_700Bold,
    // Add other styles as needed
});

if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#0000ff" />;
}

  return (
    <ImageBackground
      source={require("../../assets/images/Bg (3).jpg")} // Path to your background image
      style={styles.container}
      imageStyle={styles.backgroundImage} // Optional to style the image
    >
      
        <View style={styles.innerContainer}>
          <View>
            <Text style={styles.greeting}>Welcome!</Text>
            <Text style={styles.title1}>Book Your Apponitment</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Email"
              style={styles.input}
              value={email}
              onChangeText={(text) => setEmail(text)}
            />
            <TextInput
              placeholder="Password"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={(text) => setPassword(text)}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              containerStyle={styles.button}
              buttonStyle={styles.button1}
              onPress={handleLogin}
              title="Login"
              titleStyle={styles.buttonText}
            />
            <Button
              containerStyle={styles.button}
              buttonStyle={[styles.button, styles.buttonOutline]}
              onPress={navigateSignUp}
              title="Register"
              titleStyle={styles.buttonOutlineText}
            />
          </View>

          {/* Doctor Login Link */}
          <TouchableOpacity onPress={navigateDoctorLogin} style={styles.doctorLoginContainer}>
            <Text style={styles.doctorLoginText}>Doctor Login</Text>
          </TouchableOpacity>
        </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    opacity: 0.3, // Optional: to adjust how visible the background image is
  },
  blurContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    alignItems: "center",
    width: "80%",
  },
  greeting: {
    fontSize: 28,
    color: "#22177A",
    fontFamily: 'OpenSans_700Bold',
  },
  title1: {
    fontSize: 20,
    color: '#22177A',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'OpenSans_700Bold',
},
  inputContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    borderColor: "#22177A",
    borderWidth: 1,
    fontFamily: 'OpenSans_400Regular',

  },
  buttonContainer: {
    width: "60%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    
    
  },
  button: {
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    
  },
  button1: {
    width: "110%",
    borderRadius: 10,
    alignItems: "center",
    backgroundColor:"#22177A"
    
    
  },
  buttonOutline: {
    backgroundColor: "white",
    marginTop: 10,
    borderColor: "white",
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
  },
  buttonOutlineText: {
    color: "#22177A",
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
  },
  doctorLoginContainer: {
    marginTop: 20,
  },
  doctorLoginText: {
    fontSize: 16,
    color: "#22177A",
    fontFamily: 'OpenSans_400Regular',
    textDecorationLine: "underline",
  },
});

export default LoginScreen;

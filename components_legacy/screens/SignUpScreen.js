import { StyleSheet, Text, View, TextInput, ImageBackground } from "react-native";
import React, { useState } from "react";
import { Button } from "react-native-elements";
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log("Register new user: ", user.email);
        navigateLogin();
      })
      .catch((error) => alert(error.message));
  };

  const navigateLogin = () => {
    navigation.navigate("LoginScreen");
  };

  return (
    <ImageBackground
      source={require("../../assets/images/Bg (3).jpg")} // Path to your background image
      style={styles.container}
      imageStyle={styles.backgroundImage} // Optional to style the image
    >
      <View style={styles.container}>
        <View>
          <Text style={styles.greeting}>Register your account!</Text>
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
              onPress={handleSignUp}
              title="Register"
              titleStyle={styles.buttonText}
            />

          <View style={styles.textContainer}>
            <Text style={styles.text}>Already have an account?</Text>
            <Button
              type="clear"
              title="Log In"
              titleStyle={styles.loginText}
              onPress={navigateLogin}
            />
          </View>
        </View>
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
    fontSize: 24,
    fontFamily: "OpenSans_700Bold",
  },
  inputContainer: {
    width: "80%",
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    borderColor: "green",
    borderWidth: 1,
    fontFamily: "OpenSans_400Regular",
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
  buttonText: {
    fontFamily: "OpenSans_400Regular",
    fontSize: 16,
    marginRight:40,
  },
  buttonOutlineText: {
    color: "#00008B", // Changed to match the dark blue theme
    fontSize: 16,
    fontFamily: "OpenSans_700Bold",
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    marginLeft:40,
  },
  text: {
    fontSize: 12,
    fontFamily: "OpenSans_400Regular", // Ensured Open Sans is applied
    color: "#000", // Black text for visibility
  },
  loginText: {
    fontSize: 15,
    fontFamily: "OpenSans_700Bold", // Styled for distinction
    color: "#00008B", // Matches the dark blue theme
  },
});

export default SignUpScreen;

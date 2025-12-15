import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Updated import
import { auth, db } from '../../firebase';
import { ref, set } from 'firebase/database';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useFonts, OpenSans_400Regular, OpenSans_700Bold } from '../../assets/fonts/fonts';

function DoctorRegistrationScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profession, setProfession] = useState('General Practitioner');
  const [error, setError] = useState('');
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_700Bold,
  });

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
  
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Save doctor details in the "doctors" collection
      const doctorRef = ref(db, `doctors/${user.uid}`);
      await set(doctorRef, {
        name,
        email,
        profession,
        role: "doctor",
      });
  
      console.log("Doctor registered successfully in the doctors collection.");
  
      // Navigate to the DoctorLogin screen after registration is successful
      navigation.navigate("DoctorLogin");
    } catch (error) {
      console.error("Error registering doctor:", error.message);
      setError(error.message); // Show specific error message if available
    }
  };
  

  if (!fontsLoaded) {
    return <Text>Loading Fonts...</Text>;
  }

  return (
    <ImageBackground
      source={require("../../assets/images/Bg (3).jpg")}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.greeting}>Doctor Registration</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={(text) => setName(text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={(text) => setPassword(text)}
        />

        <Picker
          selectedValue={profession}
          style={styles.picker}
          onValueChange={(itemValue) => setProfession(itemValue)}
        >
          <Picker.Item label="General Practioner" value="General Practioner" />
          <Picker.Item label="Dermatologist" value="Dermatologist" />
          <Picker.Item label="Internale Medicine" value="Internale Medicine" />
          <Picker.Item label="Herbal Medicine" value="Herbal Medicine" />
          <Picker.Item label="Infectious Disease" value="Infectious Disease" />
          <Picker.Item label="Specialist" value="Specialist" />
          <Picker.Item label="Surgeon" value="Surgeon" />
          {/* Add other specialties as needed */}
        </Picker>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("DoctorLogin")}>
            <Text style={styles.loginText}>Login here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    opacity: 0.6, // Slight transparency for background
  },
  innerContainer: {
    alignItems: 'center',
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slight white overlay for readability
    padding: 20,
    borderRadius: 15,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'OpenSans_700Bold',
    color: '#22177A',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    fontFamily: 'OpenSans_400Regular',
  },
  input: {
    backgroundColor: '#fff',
    width: '100%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    borderColor: '#22177A',
    borderWidth: 1,
    fontFamily: 'OpenSans_400Regular',
  },
  picker: {
    width: '100%',
    height: 50,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22177A',
    fontFamily: 'OpenSans_400Regular',
  },
  button: {
    backgroundColor: '#22177A',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    fontFamily: 'OpenSans_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  registerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontFamily: 'OpenSans_400Regular',
    fontSize: 14,
    color: '#22177A',
  },
  loginText: {
    color: '#22177A',
    fontFamily: 'OpenSans_400Regular',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default DoctorRegistrationScreen;

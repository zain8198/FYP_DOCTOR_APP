import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { Button } from 'react-native-elements';
import { auth, db } from '../../firebase';
import { ref, get } from 'firebase/database';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useFonts, OpenSans_400Regular, OpenSans_700Bold } from '../../assets/fonts/fonts';

function DoctorLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_700Bold,
  });

  if (!fontsLoaded) {
    return <Text>Loading Fonts...</Text>;
  }

  const handleLogin = async () => {
    setError(''); // Clear previous errors
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if doctor exists in the database
      const doctorRef = ref(db, `doctors/${user.uid}`);
      const snapshot = await get(doctorRef);

      if (snapshot.exists()) {
        const doctorData = snapshot.val();
        console.log('Doctor logged in successfully:', doctorData);

        // Navigate to doctor's dashboard or another screen
        navigation.navigate('DoctorDashboard', { doctorData });
      } else {
        setError('No doctor found with this account.');
      }
    } catch (error) {
      console.error('Error logging in doctor:', error.message);
      setError(error.message || 'An error occurred while logging in.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateDoctorRegister = () => {
    navigation.navigate('DoctorRegister'); // Navigate to the Doctor Register screen
  };
  const navigateUserLogin = () => {
    navigation.navigate("LoginScreen"); // Navigate to the Doctor Login screen
  };

  return (
    <ImageBackground
      source={require('../../assets/images/Bg (3).jpg')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.greeting}>Doctor Login</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.buttonContainer}>
          <Button
            containerStyle={styles.button}
            buttonStyle={styles.button}
            onPress={handleLogin}
            title={isLoading ? 'Logging in...' : 'Login'}
            titleStyle={styles.buttonText}
            disabled={isLoading}
          />
        </View>

        <View style={styles.registerContainer}>
          <TouchableOpacity onPress={navigateDoctorRegister}>
            <Text style={styles.registerText}>Don't have an account? Register here</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={navigateUserLogin} style={styles.doctorLoginContainer}>
            <Text style={styles.doctorLoginText}>User Login</Text>
          </TouchableOpacity>
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
    opacity: 0.3,
  },
  innerContainer: {
    alignItems: 'center',
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 15,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'OpenSans_700Bold',
    color: '#22177A',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    borderColor: '#22177A',
    borderWidth: 1,
    fontFamily: 'OpenSans_400Regular',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    fontFamily: 'OpenSans_400Regular',
  },
  buttonContainer: {
    width: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  button: {
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#22177A',
  },
  buttonText: {
    fontFamily: 'OpenSans_700Bold',
    fontSize: 16,
  },
  registerContainer: {
    marginTop: 15,
  },
  registerText: {
    color: '#22177A',
    fontFamily: 'OpenSans_400Regular',
    fontSize: 14,
    textDecorationLine: 'underline',
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

export default DoctorLogin;

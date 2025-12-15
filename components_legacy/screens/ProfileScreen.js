import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Avatar, Button} from "react-native-elements";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "../../firebase";
import { ref, set, get } from "firebase/database";
import DefaultAvatar from "../../assets/images/default_avatar.jpg";
import { Text } from "react-native";


export default function ProfileScreen({ navigation }) {
  const [userName, setUserName] = useState(auth.currentUser.displayName || "");
  const [userEmail, setUserEmail] = useState(auth.currentUser?.email || "");
  const [userBio, setUserBio] = useState("");
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    const userRef = ref(db, "users/" + auth.currentUser.uid);
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserBio(data.bio || "");
        setImageUri(data.profileImage || null);
      }
    });
  }, []);

  const handleSignOut = () => {
    auth
      .signOut()
      .then(() => navigation.navigate("LoginScreen"))
      .catch((err) => alert(err.message));
  };

  const handleEditProfile = () => {
    if (!userName.trim()) {
      Alert.alert("Please enter a valid name.");
      return;
    }
    const userRef = ref(db, "users/" + auth.currentUser.uid);
    set(userRef, {
      displayName: userName,
      email: userEmail,
      bio: userBio,
      profileImage: imageUri || auth.currentUser.photoURL || DefaultAvatar,
    })
      .then(() => alert("Profile updated successfully!"))
      .catch((error) => alert(error.message));
  };

  return (
    <LinearGradient colors={["#7AB2D3", "#E9EEF3"]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <Avatar
          rounded
          size={120}
          source={
            imageUri
              ? { uri: imageUri }
              : auth.currentUser.photoURL
              ? { uri: auth.currentUser.photoURL }
              : DefaultAvatar
          }
          containerStyle={styles.avatarContainer}
          activeOpacity={0.7}
        />

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={userName}
            onChangeText={setUserName}
          />
          <TextInput
            style={styles.input}
            placeholder="Bio"
            value={userBio}
            onChangeText={setUserBio}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={userEmail}
            editable={false} // Make email non-editable
          />
        </View>

        <Button
          title="Save Profile"
          buttonStyle={styles.saveButton}
          titleStyle={styles.saveButtonText}
          containerStyle={styles.buttonContainer}
          onPress={handleEditProfile}
        />
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    alignItems: "center",
    padding: 20,
  },
  avatarContainer: {
    marginVertical: 20,
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginVertical: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
    fontSize: 14,
    fontFamily: 'OpenSans_400Regular',
  },
  inputDisabled: {
    backgroundColor: "#e9e9e9",
    padding: 12,
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
    fontSize: 16,
    color: "#999",
  },
  saveButton: {
    backgroundColor: "#22177A",
    borderRadius: 10,
    paddingVertical: 12,
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: 'OpenSans_400Regular',
  },
  buttonContainer: {
    width: "80%",
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "#22133A",
    borderRadius: 10,
    paddingVertical: 12,
    width: "80%",
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
  },

});

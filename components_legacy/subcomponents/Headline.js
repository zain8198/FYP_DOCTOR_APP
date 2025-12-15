import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Icon } from "react-native-elements";
import { format } from "date-fns";
import { ref, onValue } from "firebase/database"; // Correct import
import { auth, db } from "../../firebase";

export default function Headline({ onNotificationPress }) {
  const [date, setDate] = useState(new Date());
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userRef = ref(db, `/users/${currentUser.uid}/displayName`);
      onValue(userRef, (snapshot) => {
        const displayName = snapshot.val();
        setUserName(displayName || "Guest");
      });
    }
  }, []);

  return (
    <View style={styles.header}>
      {/* Left Section */}
      <View>
        <Text style={styles.dashboardText}>Dashboard</Text>
        <Text style={styles.dateText}>{format(date, "EEEE, MMMM dd")}</Text>
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        <Text style={styles.greetingText}>Hello, {userName}</Text>
        <TouchableOpacity onPress={onNotificationPress}>
          <Icon name="notifications" size={28} color="#5A5A5A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dashboardText: {
    fontSize: 20,
    fontFamily: 'OpenSans_700Bold',
    color: "#1A1A1A",
  },
  dateText: {
    fontSize: 16,
    color: "#6A6A6A",
    fontFamily: 'OpenSans_400Regular',
  },
  rightSection: {
    alignItems: "flex-end",
  },
  greetingText: {
    fontSize: 14,
    marginBottom: 1,
    fontWeight: "600",
    color: "#1A1A1A",
    fontFamily: 'OpenSans_700Bold',
  },
});

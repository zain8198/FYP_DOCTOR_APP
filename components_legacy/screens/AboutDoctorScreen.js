import React from "react";
import { StyleSheet, View, Text } from "react-native";

function AboutDoctorScreen({ navigation, doctor }) {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>Doctor's greeting</Text>
      <Text style={styles.greetingText}>{doctor.greeting}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    marginTop: 28,
  },
  headerText: {
    fontSize: 16,
    fontFamily: 'OpenSans_700Bold',
    color: "gray",
    paddingLeft: 14,
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 12,
    fontFamily: 'OpenSans_400Regular',
    marginRight: 14,
    marginLeft: 14,
    marginBottom: 20,
  },
});

export default AboutDoctorScreen;

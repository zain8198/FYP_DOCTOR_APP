import React from "react";
import { StyleSheet, View, Text, Dimensions, Image } from "react-native";
import { useFonts, OpenSans_400Regular, OpenSans_700Bold } from '../../assets/fonts/fonts';

const { width } = Dimensions.get("screen");
const cardWidth = width / 2;

function Card({ doctor, index }) {
  return (
    <View style={styles.card}>
      <Image
        source={doctor.image}
        style={[styles.cardImage, styles.shadowProp]}
      />
      <View style={styles.cardTitle}>
        <Text style={{ fontFamily: 'OpenSans_700Bold', fontSize: 16 }}>
          Dr.{doctor.lastname}
        </Text>
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: "grey" }}>
          {doctor.title}
        </Text>
      </View>
    </View>
  );
}

export default Card;

const styles = StyleSheet.create({
  card: {
    height: 280,
    width: cardWidth,
    elevation: 15,
    marginRight: 20,
    borderRadius: 15,
    backgroundColor: "#ADD8E6",
  },
  cardImage: {
    height: 230,
    width: "90%",
    marginTop: 8,
    marginRight: "auto",
    marginLeft: "auto",
    borderRadius: 15,
  },
  cardTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginLeft: 8,
    marginRight: 8,
    
    
  },
  shadowProp: {
    shadowColor: "#171717",
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

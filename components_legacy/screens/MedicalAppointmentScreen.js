import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Card, Button, Icon } from "react-native-elements";
import RadioButtonRN from "radio-buttons-react-native";
import { format, parse } from "date-fns";
import ModalPopUp from "../subcomponents/ModalPopUp";
import meetings from "../consts/Meetings";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auth, db } from "../../firebase";
import { ref, push, get } from "firebase/database";

function MedicalAppointmentScreen({ doctor }) {
  const navigation = useNavigation();
  const [appointment, setAppointment] = useState({
    doctor: `${doctor.firstname} ${doctor.lastname}`,
    professional: doctor.professional, // Include the professional field here
    date: new Date(),
    meeting: "",
  });
  const [mode, setMode] = useState("date");
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false); // Modal visibility state
  const [confirming, setConfirming] = useState(false); // Confirm booking state

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || appointment.date;
    setShow(false);
    setAppointment({ ...appointment, date: currentDate });
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const showTimepicker = () => {
    showMode("time");
  };

  const saveAppointments = async (appointment) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const appointmentRef = ref(db, `appointments`);
    const newDateFormatted = format(new Date(appointment.date), "EEEE, MMM dd hh:mm a");

    try {
      const snapshot = await get(appointmentRef);
      const allAppointments = snapshot.val();

      if (allAppointments) {
        console.log("Fetched existing appointments:", allAppointments);

        for (const userKey in allAppointments) {
          const userAppointments = allAppointments[userKey];

          for (const appointmentKey in userAppointments) {
            const existingAppointment = userAppointments[appointmentKey];

            if (!existingAppointment.date) continue;

            try {
              const existingDate = parse(existingAppointment.date, "EEEE, MMM dd hh:mm a", new Date());
              const newDate = parse(newDateFormatted, "EEEE, MMM dd hh:mm a", new Date());

              if (existingDate.getTime() === newDate.getTime()) {
                alert(`This slot (${newDateFormatted}) is already booked. Please select another time.`);
                return;
              }
            } catch (dateError) {
              console.error("Error parsing date:", dateError);
            }
          }
        }
      }

      const userAppointmentRef = ref(db, `appointments/${userId}`);
      await push(userAppointmentRef, {
        ...appointment,
        date: newDateFormatted,
        professional: doctor.professional,
      });
      return true;

    } catch (error) {
      console.error("Error checking appointments:", error);
      return false;
    }
  };

  const navigateConfirm = () => {
    navigation.navigate('ConfirmScreen',
       { appointment: appointment });
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.bookingContainer}>
        <View>
          <Text style={styles.headerText}>Make an Appointment</Text>
          <Text style={styles.appointmentTime}>
            {format(appointment.date, "EEE, MMM dd HH:mm aaa")}
          </Text>
        </View>

        <View style={styles.dateButtonsContainer}>
          <Button
            type="clear"
            onPress={showDatepicker}
            title="Change Date"
            titleStyle={styles.changeDateContainer}
          />
          <Button
            type="clear"
            onPress={showTimepicker}
            title="Change Time"
            titleStyle={styles.changeDateContainer}
          />
          {show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={appointment.date}
              mode={mode}
              is24Hour={true}
              themeVariant="light"
              onChange={onChange}
            />
          )}
        </View>
      </View>

      <View style={styles.panel}>
        <Card containerStyle={styles.card}>
          <RadioButtonRN
            data={meetings}
            boxStyle={styles.radioBox}
            textStyle={styles.radioText}
            circleStyle={styles.radioCircle}
            selectedBtn={(meeting) =>
              setAppointment({ ...appointment, meeting: meeting.label })
            }
            icon={<Icon name="check-circle" size={25} color="#2c9dd1" />}
          />
        </Card>
      </View>

      {/* Modal Pop-Up */}
      <View style={styles.modalContainer}>
        <ModalPopUp visible={visible}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setVisible(false); // Close the modal
              }}
            >
              <Image
                source={require("../../assets/images/x.png")}
                style={styles.closeButton}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Image
              source={require("../../assets/images/successImg.png")}
              style={styles.successImage}
            />
            <Text style={styles.modalText}>
              Congratulations! Your booking was successful!
            </Text>
            <Button
              containerStyle={styles.button1}
              title="Confirm Booking"
              onPress={() => {
                setConfirming(true); // Mark the confirmation state
                setVisible(false); // Close the modal
                navigateConfirm(); // Navigate to Confirm Screen
              }}
            />
          </View>
        </ModalPopUp>

        <Button
          containerStyle={styles.button}
          title="Book"
          onPress={async () => {
            const isBooked = await saveAppointments(appointment);
            if (isBooked) {
              setVisible(true); // Show the modal once appointment is saved
            }
          }}
        />
      </View>
    </View>
  );
}

  const styles = StyleSheet.create({
    headerContainer: {
      flex: 1,
      marginTop: 1,
      backgroundColor: "#F9FAFB",
    },
    headerText: {
      fontSize: 16,
      fontFamily: 'OpenSans_700Bold',
      color: "#333",
      marginTop: 8,
    },
    appointmentTime: {
      fontSize: 14,
      color: "#777",
      marginBottom: 20,
      marginTop: 10,
      fontFamily: 'OpenSans_400Regular',
    },
    bookingContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginRight: 14,
      marginLeft: 20,
      marginBottom: 10,
    },
    dateButtonsContainer: {
      marginBottom: 25,
    },
    changeDateContainer: {
      fontSize: 14,
      color: "#22177A",
      fontFamily: 'OpenSans_400Regular',
    },
    panel: {
      width: Dimensions.get("window").width,
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      marginTop: 80,
    },
    card: {
      width: Dimensions.get("window").width - 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#E0E0E0",
      padding: 10,
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    radioBox: {
      borderWidth: 0,
      paddingVertical: 10,
    },
    radioText: {
      fontSize: 16,
      color: "#555",
      fontFamily: 'OpenSans_400Regular',
    },
    radioCircle: {
      size: 20,
      borderWidth: 2,
      borderColor: "#22177A",

    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalHeader: {
      width: "100%",
      alignItems: "flex-end",
    },
    closeButton: {
      height: 30,
      width: 30,
    },
    modalBody: {
      alignItems: "center",
    },
    successImage: {
      height: 150,
      width: 150,
      marginVertical: 10,
    },
    modalText: {
      marginVertical: 80,
      fontSize: 16,
      textAlign: "center",
      color: "#333",
      fontFamily: 'OpenSans_400Regular',
      marginTop:20
    },
    button: {
      right: 20,
      left: 20,
      bottom: 30,
      position: "absolute",
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
      color: "#22177A",
    },
    button1: {
      right: 20,
      left: 20,
      bottom: 1,
      position: "absolute",
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
      color: "#22177A",
    },
    header: {
      width: "100%",
      height: 50,
      alignItems: "flex-end",
      justifyContent: "center",
    },
  });

  export default MedicalAppointmentScreen;

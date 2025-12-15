import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../firebase";
import { View, ActivityIndicator } from "react-native";
import { useFonts, OpenSans_400Regular, OpenSans_700Bold } from "@expo-google-fonts/open-sans";

export default function Index() {
    const [loading, setLoading] = useState(true);
    const [isDoctor, setIsDoctor] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                // Check if user is a doctor
                try {
                    console.log("Checking doctor role for:", u.uid);
                    const doctorRef = ref(db, `doctors/${u.uid}`);

                    // Race between database fetch and 5s timeout
                    const snapshot: any = await Promise.race([
                        get(doctorRef),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
                    ]);

                    console.log("Doctor check result:", snapshot.exists());
                    setIsDoctor(snapshot.exists());
                } catch (e) {
                    console.error("Error or Timeout checking doctor role:", e);
                    setIsDoctor(false); // Default to user on error/timeout
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!loading) {
            if (user) {
                if (isDoctor) {
                    router.replace("/doctor/dashboard");
                } else {
                    router.replace("/(tabs)/home");
                }
            } else {
                router.replace("/(auth)/login");
            }
        }
    }, [loading, user, isDoctor]);

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" />
        </View>
    );
}

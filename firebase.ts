import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth";
import { Platform } from "react-native";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD-JiGWOfwvQo4ahvlQJcsUFZIkeK-X9q4",
    authDomain: "doc-app-905e8.firebaseapp.com",
    databaseURL: "https://doc-app-905e8-default-rtdb.firebaseio.com/",
    projectId: "doc-app-905e8",
    storageBucket: "doc-app-905e8.firebasestorage.app",
    messagingSenderId: "945344925692",
    appId: "1:945344925692:web:af60ac81ad155864fcac79"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication with persistence
// We use initializeAuth with getReactNativePersistence to enable Session persistence in React Native.
// usages of @ts-ignore are to bypass potential type definition mismatches in the Firebase SDK.
let auth: Auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    // @ts-ignore: getReactNativePersistence might be missing in type definitions but available in runtime
    const { getReactNativePersistence } = require("firebase/auth");

    auth = initializeAuth(app, {
        // @ts-ignore
        persistence: getReactNativePersistence(AsyncStorage)
    });
}

// Initialize Realtime Database
const db = getDatabase(app);

// Initialize Firebase Storage (if needed elsewhere, though we switched to Cloudinary)
const storage = getStorage(app);

export { auth, db, storage, app };

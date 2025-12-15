import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth";
import { Platform } from "react-native";
import { getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ... (keep existing lines in between if possible or just replace the block)
// I'll replace the block from imports to exports to be safe.

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
// We use initializeAuth to set up persistence with AsyncStorage
let auth: Auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
}

// Initialize Realtime Database
const db = getDatabase(app);

export { auth, db, app };

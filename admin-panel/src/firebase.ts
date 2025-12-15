import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD-JiGWOfwvQo4ahvlQJcsUFZIkeK-X9q4",
    authDomain: "doc-app-905e8.firebaseapp.com",
    databaseURL: "https://doc-app-905e8-default-rtdb.firebaseio.com/",
    projectId: "doc-app-905e8",
    storageBucket: "doc-app-905e8.firebasestorage.app",
    messagingSenderId: "945344925692",
    appId: "1:945344925692:web:af60ac81ad155864fcac79"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app); // Realtime DB
export const firestore = getFirestore(app); // Firestore (if needed later)
export default app;

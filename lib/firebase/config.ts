import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Dán trực tiếp mã thật của bạn vào trong các dấu ngoặc kép này:
const firebaseConfig = {
  apiKey: "AIzaSyBSI0k4D0u_nyGGb4S8tCDGI49UPLzoTxI", 
  authDomain: "hanzi-master-ff916.firebaseapp.com",
  projectId: "hanzi-master-ff916",
  storageBucket: "hanzi-master-ff916.appspot.com",
  messagingSenderId: "942892351899", 
  appId: "1:1234567890:web:abcdef123456" 
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore database
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

import { GoogleAuthProvider } from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();

export { app, db, auth };

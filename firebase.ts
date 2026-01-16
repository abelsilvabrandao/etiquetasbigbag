
// Fix: Ensure named exports are correctly imported from the Firebase modular SDK (v9+).
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARY7B2quitKNNPP1tDIHsMhpC_spStFbY",
  authDomain: "agenda-f2287.firebaseapp.com",
  projectId: "agenda-f2287",
  storageBucket: "agenda-f2287.firebasestorage.app",
  messagingSenderId: "786170238662",
  appId: "1:786170238662:web:769e1b44c5c467e3a429c7",
  measurementId: "G-REL6C7GH76"
};

// Fix: Initialize Firebase using the correct modular API.
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

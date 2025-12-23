// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvIfZuE18BDnTu3aUouJaVUh-Ft238cyg",
    authDomain: "technoghar-ab7cb.firebaseapp.com",
    projectId: "technoghar-ab7cb",
    storageBucket: "technoghar-ab7cb.firebasestorage.app",
    messagingSenderId: "247607745520",
    appId: "1:247607745520:web:00f42dae74338ab1cc9b35",
    measurementId: "G-2KKZSSCCQZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Export services
export { db, collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc, query, where };

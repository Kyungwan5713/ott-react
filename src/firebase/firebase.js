// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:import.meta.env.VITE_FIREBASE_APP_ID
 
  // apiKey: "AIzaSyCEw3I-UDLgZohSqlZly10UVK9zB4bLmtY",
  // authDomain: "ott-test-4169f.firebaseapp.com",
  // projectId: "ott-test-4169f",
  // storageBucket: "ott-test-4169f.firebasestorage.app",
  // messagingSenderId: "940312613983",
  // appId: "1:940312613983:web:5f53370840eb7748ccb7ea"
};

// Initialize Firebase
console.log("Firebase 설정 확인:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "있음" : "없음",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "있음" : "없음",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "있음" : "없음",
});
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
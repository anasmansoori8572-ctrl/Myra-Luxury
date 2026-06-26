import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAfgxVzb2KrKm805ANK7h6HVRyRc0EVr8s",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "myra-luxury-9c49c.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "myra-luxury-9c49c",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "myra-luxury-9c49c.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "500396522177",
  appId: env.VITE_FIREBASE_APP_ID || "1:500396522177:web:0f039c3e7b774f78e9b240"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");

export default app;

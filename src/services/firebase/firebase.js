import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Real production configuration for "thequietdesk-63f05"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDPJ2pzg4zTmCPfgoOycCgA70HrOBC7F4w",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "thequietdesk-63f05.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "thequietdesk-63f05",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "thequietdesk-63f05.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "780957484603",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:780957484603:web:be108adb8e2731fca0fe1e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-40PEKJ9P4H"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Export Firestore & Auth Instances
export const db = getFirestore(app);
export const auth = getAuth(app);

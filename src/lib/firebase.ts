// src/lib/firebase.ts - Update to ensure proper configuration

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth"; // Add Auth import
import { getFunctions, Functions } from "firebase/functions"; // Import Functions

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: Functions; // Define functions variable

// Initialize Firebase only if it hasn't been initialized yet and we're in browser
if (isBrowser && !getApps().length) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  functions = getFunctions(app); // Initialize Functions
} else if (isBrowser) {
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  functions = getFunctions(app); // Get existing Functions instance
} else {
  // Handle server-side initialization or cases where Firebase is not needed
  // Depending on your needs, you might initialize admin SDK here
  // or simply leave these variables undefined/null for server environments.
}

// Export initialized instances
export { app, db, auth, functions };

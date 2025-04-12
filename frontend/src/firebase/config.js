import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Log environment variables (will be undefined if not loading correctly)
console.log("Firebase environment variables loaded:", {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? "DEFINED" : "UNDEFINED",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? "DEFINED" : "UNDEFINED",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? "DEFINED" : "UNDEFINED"
});

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD12fR5yxzAL7SlLqBBtCXkmLNRY1TCcA8",
  authDomain: "personal-finance-applica-af375.firebaseapp.com",
  projectId: "personal-finance-applica-af375",
  storageBucket: "personal-finance-applica-af375.appspot.com",
  messagingSenderId: "572400768725",
  appId: "1:572400768725:web:13993240904eaee02e345c",
  measurementId: "G-LBXGDX6X26"
};

// For debugging
console.log("Using Firebase config:", { ...firebaseConfig, apiKey: "HIDDEN" });

let app;
let auth;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  app = null;
  auth = null;
}

export { auth };
export default app;
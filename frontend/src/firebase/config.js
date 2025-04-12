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
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// For debugging (without exposing sensitive info)
console.log("Firebase initialized with config for project:", process.env.REACT_APP_FIREBASE_PROJECT_ID);

let app;
let auth;

try {
  // Check if required config values are present
  const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
  
  if (missingKeys.length > 0) {
    throw new Error(`Missing required Firebase configuration: ${missingKeys.join(', ')}. Make sure your environment variables are properly set.`);
  }
  
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log("Firebase authentication initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  app = null;
  auth = null;
}

export { auth };
export default app;
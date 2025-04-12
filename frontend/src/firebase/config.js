import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// For debugging environment variables
console.log('Firebase Environment Variables:');
console.log('API Key present:', !!process.env.REACT_APP_FIREBASE_API_KEY);
console.log('Auth Domain present:', !!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);
console.log('Project ID present:', !!process.env.REACT_APP_FIREBASE_PROJECT_ID);

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyD12fR5yxzAL7SlLqBBtCXkmLNRY1TCcA8',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'personal-finance-applica-af375.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'personal-finance-applica-af375',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'personal-finance-applica-af375.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '572400768725',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:572400768725:web:13993240904eaee02e345c',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-LBXGDX6X26'
};

// Check if all required configs are available
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error('Missing required Firebase config keys:', missingKeys);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
export default app;
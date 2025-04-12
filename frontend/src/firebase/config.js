import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD12fR5yxzAL7SlLqBBtCXkmLNRY1TCcA8",
  authDomain: "personal-finance-applica-af375.firebaseapp.com",
  projectId: "personal-finance-applica-af375",
  storageBucket: "personal-finance-applica-af375.firebasestorage.app",
  messagingSenderId: "572400768725",
  appId: "1:572400768725:web:13993240904eaee02e345c",
  measurementId: "G-LBXGDX6X26"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
export default app;
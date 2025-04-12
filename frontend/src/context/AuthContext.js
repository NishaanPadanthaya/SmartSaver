import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase/config';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // API base URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Register with email and password
  async function register(email, password, displayName) {
    try {
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await updateProfile(userCredential.user, { displayName });

      // Get ID token
      const token = await userCredential.user.getIdToken();

      try {
        // Register user in our backend
        await axios.post(`${API_URL}/users/register`, {
          firebase_uid: userCredential.user.uid,
          email: userCredential.user.email,
          display_name: displayName || userCredential.user.displayName,
          photo_url: userCredential.user.photoURL
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (apiError) {
        console.error("Backend registration error:", apiError);
        // Continue with the registration process even if backend fails
        // This will allow users to still use the app, and we can sync with backend later
      }

      // Sign out after registration so user can explicitly sign in
      await signOut(auth);

      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Login with email and password
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Login with Google
  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      // Get ID token
      const token = await userCredential.user.getIdToken();

      let isNewUser = false;

      try {
        // Try to register user in our backend (in case they're new)
        await axios.post(`${API_URL}/users/register`, {
          firebase_uid: userCredential.user.uid,
          email: userCredential.user.email,
          display_name: userCredential.user.displayName,
          photo_url: userCredential.user.photoURL
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        // If we get here without an error, this was a new user registration
        isNewUser = true;
      } catch (error) {
        // If user already exists (409 conflict), that's fine
        if (error.response && error.response.status === 409) {
          // It's an existing user
          isNewUser = false;
        } else {
          console.error("Backend registration error:", error);
          // Continue with the registration process even if backend fails
          isNewUser = true;
        }
      }

      // If this was a new user registration, sign out so they can explicitly sign in
      if (isNewUser) {
        await signOut(auth);
      }

      return { user: userCredential.user, isNewUser };
    } catch (err) {
      // Handle specific Firebase auth errors
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show an error message
        return null;
      }
      setError(err.message);
      throw err;
    }
  }

  // Logout
  async function logout() {
    setUserProfile(null);
    return await signOut(auth);
  }

  // Reset password
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Fetch user profile from backend
  async function fetchUserProfile() {
    if (!currentUser) return null;

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUserProfile(response.data);
      return response.data;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Don't set an error message for users as this is a background operation
      // Just return null so the app can continue functioning
      return null;
    }
  }

  // Update user profile
  async function updateUserProfile(profileData) {
    if (!currentUser) return null;

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.put(`${API_URL}/users/me`, profileData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUserProfile(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        // Fetch user profile when authenticated
        await fetchUserProfile();
      } else {
        setUserProfile(null);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    fetchUserProfile,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
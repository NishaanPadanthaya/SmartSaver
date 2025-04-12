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
  const [token, setToken] = useState(null);

  // API base URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  console.log('AuthContext - API_URL:', API_URL);

  // Get current user's token
  const getToken = async () => {
    if (currentUser) {
      try {
        console.log('Getting fresh token for user:', currentUser.uid);
        const newToken = await currentUser.getIdToken(true);
        console.log('Token retrieved successfully');
        setToken(newToken);
        return newToken;
      } catch (error) {
        console.error("Error getting token:", error);
        return null;
      }
    } else {
      console.log('No current user to get token for');
      return null;
    }
  };

  // Register with email and password
  async function register(email, password, displayName) {
    try {
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(userCredential.user, { displayName });
      
      // Get ID token
      const token = await userCredential.user.getIdToken();
      
      // Register user in our backend
      try {
        await axios.post(`${API_URL}/users/register`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log("User registered successfully in backend");
      } catch (apiError) {
        console.error("Backend registration error:", apiError);
        // Continue with the registration process even if backend fails
      }

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
      
      // Get and store the token immediately
      const newToken = await userCredential.user.getIdToken();
      setToken(newToken);
      console.log('Token set after login');
      
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
      
      // Get ID token and set it immediately
      const newToken = await userCredential.user.getIdToken();
      setToken(newToken);
      console.log('Token set after Google login');
      
      try {
        // Register user in our backend (this is idempotent - won't create duplicates)
        await axios.post(`${API_URL}/users/register`, {}, {
          headers: {
            Authorization: `Bearer ${newToken}`
          }
        });
        console.log("User registered/verified in backend after Google login");
      } catch (error) {
        console.error("Backend registration error after Google login:", error);
        // Continue even if backend registration fails
      }
      
      return { user: userCredential.user, isNewUser: false };
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
      const currentToken = token || await getToken();
      if (!currentToken) {
        console.error("No token available to fetch user profile");
        return null;
      }
      
      console.log(`Fetching profile for user ${currentUser.uid}`);
      const response = await axios.get(`${API_URL}/users/${currentUser.uid}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      
      console.log("User profile fetched:", response.data);
      setUserProfile(response.data);
      return response.data;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  }

  // Fetch user dashboard data (profile + budgets + savings)
  async function fetchUserDashboard() {
    if (!currentUser) return null;
    
    try {
      const currentToken = token || await getToken();
      if (!currentToken) {
        console.error("No token available to fetch user dashboard");
        return null;
      }
      
      console.log(`Fetching dashboard for user ${currentUser.uid}`);
      const response = await axios.get(`${API_URL}/users/${currentUser.uid}/dashboard`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      
      console.log("User dashboard fetched:", response.data);
      // Update user profile from dashboard data
      setUserProfile(response.data.profile);
      return response.data;
    } catch (err) {
      console.error("Error fetching user dashboard:", err);
      return null;
    }
  }

  // Update user profile in backend
  async function updateUserProfileInBackend(profileData) {
    if (!currentUser) throw new Error('No user logged in');
    
    try {
      const currentToken = token || await getToken();
      if (!currentToken) {
        throw new Error("No token available to update user profile");
      }
      
      console.log(`Updating profile for user ${currentUser.uid}:`, profileData);
      const response = await axios.put(
        `${API_URL}/users/${currentUser.uid}`, 
        profileData,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        }
      );
      
      console.log("Profile update response:", response.data);
      // Update local user profile state
      setUserProfile({
        ...userProfile,
        ...profileData
      });
      
      return response.data;
    } catch (err) {
      console.error("Error updating user profile in backend:", err);
      throw err;
    }
  }

  // Update user profile (combined Firebase + backend)
  async function updateUserProfile(profileData) {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      // Only update Firebase profile if displayName is changing
      if (profileData.displayName && profileData.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, {
          displayName: profileData.displayName
        });
        
        // Update the current user state
        setCurrentUser({
          ...currentUser,
          displayName: profileData.displayName
        });
      }
      
      // Update profile in backend
      await updateUserProfileInBackend(profileData);
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? user.uid : "logged out");
      setCurrentUser(user);
      
      if (user) {
        // Get the token
        await getToken();
        // Fetch user profile when authenticated
        await fetchUserProfile();
      } else {
        setUserProfile(null);
        setToken(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    loginWithGoogle,
    fetchUserProfile,
    fetchUserDashboard,
    updateUserProfile,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
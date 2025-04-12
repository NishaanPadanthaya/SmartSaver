import axios from 'axios';
import { getAuth } from 'firebase/auth';

const auth = getAuth();

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Get a development token for testing without Firebase
const getDevToken = () => {
    // Use a consistent token for development
    const userId = localStorage.getItem('dev_user_id') || 'fzas6b84fjUiUcg2bmMMTm09xLp1';
    localStorage.setItem('dev_user_id', userId);
    return `dev_${userId}`;
};

// Add a request interceptor to attach token to every request
axios.interceptors.request.use(
  async (config) => {
    try {
      // For development, optionally use a development token
      if (isDevelopment && !auth.currentUser && localStorage.getItem('use_dev_token') === 'true') {
        const devToken = getDevToken();
        console.log('Using development token for testing');
        config.headers.Authorization = `Bearer ${devToken}`;
        return config;
      }

      const user = auth.currentUser;
      if (user) {
        // Get a fresh token for every request
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token attached to request');
      } else {
        console.log('No user logged in, request sent without token');
      }
    } catch (error) {
      console.error('Error getting authentication token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const user = auth.currentUser;
  return !!user || (isDevelopment && localStorage.getItem('use_dev_token') === 'true');
};

// Helper function to get current user
export const getCurrentUser = () => {
  if (auth.currentUser) {
    return auth.currentUser;
  } else if (isDevelopment && localStorage.getItem('use_dev_token') === 'true') {
    // Return a mock user for development
    const userId = localStorage.getItem('dev_user_id');
    return {
      uid: userId,
      email: `${userId}@example.com`,
      displayName: `Test User (${userId})`,
      getIdToken: () => Promise.resolve(getDevToken())
    };
  }
  return null;
};

// Enable development mode for testing without Firebase
export const enableDevMode = (enabled = true) => {
  localStorage.setItem('use_dev_token', enabled ? 'true' : 'false');
  console.log(`Development mode ${enabled ? 'enabled' : 'disabled'}`);
  return enabled;
};

// Check if we're using development mode
export const isDevMode = () => {
  return isDevelopment && localStorage.getItem('use_dev_token') === 'true';
};

export default axios; 
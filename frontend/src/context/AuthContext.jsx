import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence
} from '../config/firebase.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const rawUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
// Remove trailing slash to prevent double slashes in requests
const BACKEND_URL = rawUrl.replace(/\/+$/, '');

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleAuthResponse = (token, user) => {
    if (!token || !user) {
      console.error('Invalid auth response data');
      return;
    }
    localStorage.setItem('apna_rooms_token', token);
    localStorage.setItem('apna_rooms_user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setCurrentUser({ uid: user.id, ...user });
    setUserData(user);
  };

  const ensureGoogleConfigured = () => {
    const requiredKeys = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_APP_ID'
    ];

    const missing = requiredKeys.filter((key) => !import.meta.env[key]);
    if (missing.length > 0) {
      throw new Error('Google login is not configured. Please add the Firebase web env values.');
    }
  };

  const syncGoogleUser = async (firebaseUser, options = {}) => {
    const { showToast = true } = options;
    const response = await axios.post(`${BACKEND_URL}/api/users/google-login`, {
      email: firebaseUser.email,
      fullName: firebaseUser.displayName,
      firebase_uid: firebaseUser.uid
    });

    if (response.data && response.data.token) {
      handleAuthResponse(response.data.token, response.data.user);
      if (showToast) {
        toast.success('Google login successful!');
      }
      return response.data.user;
    }

    throw new Error('Backend sync failed after Google login');
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);

        const savedToken = localStorage.getItem('apna_rooms_token');
        const savedUser = localStorage.getItem('apna_rooms_user');

        if (savedToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            if (!isMounted) return;
            setCurrentUser({ uid: parsedUser.id, ...parsedUser });
            setUserData(parsedUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          } catch (e) {
            console.error('Session restoration failed', e);
            localStorage.removeItem('apna_rooms_token');
            localStorage.removeItem('apna_rooms_user');
          }
        }

        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          await syncGoogleUser(redirectResult.user, { showToast: true });
        }
      } catch (error) {
        console.error('Auth bootstrap error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signup = async (email, password, fullName, role = 'user', studentCategory = 'National') => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/signup`, {
        email,
        password,
        fullName,
        role,
        studentCategory
      });
      if (response.data && response.data.token) {
        handleAuthResponse(response.data.token, response.data.user);
        return response.data.user;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Signup failed';
      toast.error(errorMsg);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/login`, {
        email,
        password
      });
      if (response.data && response.data.token) {
        handleAuthResponse(response.data.token, response.data.user);
        return response.data.user;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      toast.error(errorMsg);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      ensureGoogleConfigured();

      const result = await signInWithPopup(auth, googleProvider);
      if (!result || !result.user) {
        throw new Error('Google sign in failed - no user returned');
      }

      return await syncGoogleUser(result.user);
    } catch (error) {
      const code = error?.code || '';
      const shouldFallbackToRedirect = [
        'auth/popup-blocked',
        'auth/cancelled-popup-request',
        'auth/operation-not-supported-in-this-environment'
      ].includes(code);

      if (shouldFallbackToRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }

      console.error('Google Login Error:', error);
      if (code === 'auth/popup-closed-by-user') {
        toast.error('Google login was closed before it finished.');
      } else {
        toast.error(error.response?.data?.error || error.message || 'Google login failed');
      }
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    const token = localStorage.getItem('apna_rooms_token');
    const res = await axios.put(`${BACKEND_URL}/api/users/update-profile`, 
      profileData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data.user) {
      localStorage.setItem('apna_rooms_user', JSON.stringify(res.data.user));
      setCurrentUser({ uid: res.data.user.id, ...res.data.user });
      setUserData(res.data.user);
    }
    return res.data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const token = localStorage.getItem('apna_rooms_token');
    const res = await axios.put(`${BACKEND_URL}/api/users/change-password`, 
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  };

  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/forgot-password`, { email });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to send reset email';
      toast.error(errorMsg);
      throw error;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/reset-password`, { token, newPassword });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to reset password';
      toast.error(errorMsg);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('apna_rooms_token');
    localStorage.removeItem('apna_rooms_user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setUserData(null);
  };

  const value = {
    currentUser,
    userData,
    signup,
    login,
    loginWithGoogle,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

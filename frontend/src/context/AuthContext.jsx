import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { auth, googleProvider, signInWithPopup } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const BACKEND_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Professional persistent session handling
    const savedToken = localStorage.getItem('apna_rooms_token');
    const savedUser = localStorage.getItem('apna_rooms_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser({ uid: parsedUser.id, ...parsedUser });
        setUserData(parsedUser);
        
        // Set default auth header for all professional requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (e) {
        console.error('Session restoration failed', e);
        localStorage.removeItem('apna_rooms_token');
        localStorage.removeItem('apna_rooms_user');
      }
    }
    setLoading(false);
  }, []);

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

  const signup = async (email, password, fullName, role = 'user') => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/signup`, {
        email,
        password,
        fullName,
        role
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
      const result = await signInWithPopup(auth, googleProvider);
      if (!result || !result.user) {
        throw new Error('Google sign in failed - no user returned');
      }
      const user = result.user;
      
      // Send google user data to backend to sync with Supabase and get JWT
      const response = await axios.post(`${BACKEND_URL}/api/users/google-login`, {
        email: user.email,
        fullName: user.displayName,
        firebase_uid: user.uid
      });

      if (response.data && response.data.token) {
        handleAuthResponse(response.data.token, response.data.user);
        toast.success('Google Login Successful!');
        return response.data.user;
      }
      throw new Error('Backend sync failed after Google login');
    } catch (error) {
      console.error('Google Login Error:', error);
      toast.error(error.message || 'Google login failed');
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

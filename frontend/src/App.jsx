import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { supabase } from './config/supabase.js';
import Header from './components/Header';
import Loader from './components/Loader';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PGList from './pages/PGList';
import PGDetail from './pages/PGDetail';
import Dashboard from './pages/Dashboard';
import BookingConfirmation from './pages/BookingConfirmation';
import ResetPassword from './pages/ResetPassword';
import Contact from './pages/Contact';

import Footer from './components/Footer';

const App = () => {
  const { loading, currentUser } = useAuth();

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!currentUser ? <Signup /> : <Navigate to="/dashboard" />} />
          <Route path="/pgs" element={<PGList />} />
          <Route path="/pg/:id" element={<PGDetail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsAndConditions />} />
          <Route path="/refund-cancellation" element={<RefundCancellation />} />
          <Route path="/shipping-delivery" element={<ShippingDelivery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/booking-confirmation/:id" element={currentUser ? <BookingConfirmation /> : <Navigate to="/login" />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={currentUser ? <Dashboard /> : <Navigate to="/login" />} 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

// Missing Policy placeholders
const PrivacyPolicy = () => (
  <div className="max-w-4xl mx-auto px-4 py-20 text-center">
    <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
    <p className="text-gray-600">Privacy policy content goes here.</p>
  </div>
);

const TermsAndConditions = () => (
  <div className="max-w-4xl mx-auto px-4 py-20 text-center">
    <h1 className="text-4xl font-bold mb-6">Terms and Conditions</h1>
    <p className="text-gray-600">Terms and conditions content goes here.</p>
  </div>
);

const RefundCancellation = () => (
  <div className="max-w-4xl mx-auto px-4 py-20 text-center">
    <h1 className="text-4xl font-bold mb-6">Refund & Cancellation</h1>
    <p className="text-gray-600">Refund and cancellation policy goes here.</p>
  </div>
);

const ShippingDelivery = () => (
  <div className="max-w-4xl mx-auto px-4 py-20 text-center">
    <h1 className="text-4xl font-bold mb-6">Shipping & Delivery</h1>
    <p className="text-gray-600">Shipping and delivery policy goes here.</p>
  </div>
);
export default App;

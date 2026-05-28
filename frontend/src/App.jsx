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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong.</h1>
          <pre className="bg-white p-4 rounded-lg shadow-md border border-red-200 text-left overflow-auto max-w-4xl text-sm text-red-800">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const { loading, currentUser } = useAuth();

  if (loading) return <Loader />;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Toaster position="top-right" />
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/signup" element={!currentUser ? <Signup /> : <Navigate to="/dashboard" />} />
            <Route path="/pgs" element={<PGList />} />
            <Route path="/pg/:slugAndId" element={<PGDetail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsAndConditions />} />
            <Route path="/refund-cancellation" element={<RefundCancellation />} />
          
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
    </ErrorBoundary>
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

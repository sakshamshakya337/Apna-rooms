import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { supabase } from './config/supabase';
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
          <Route path="/booking-confirmation/:id" element={currentUser ? <BookingConfirmation /> : <Navigate to="/login" />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={currentUser ? <Dashboard /> : <Navigate to="/login" />} 
          />
          
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

// Placeholder components to avoid crashes
const Contact = () => {
  const [formData, setFormData] = useState({ email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('contact_queries').insert([formData]);
      if (error) throw error;
      toast.success('Query sent successfully!');
      setFormData({ email: '', message: '' });
    } catch (err) {
      toast.error('Failed to send query');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
      <p className="text-gray-600 mb-8">Have questions? Send us a message and we'll get back to you soon.</p>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-lg mx-auto">
        <form className="space-y-4 text-left" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" 
              placeholder="your@email.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
            <textarea 
              rows="4" 
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" 
              placeholder="How can we help?"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            ></textarea>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-accent text-white py-3 rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-primary text-white py-12 mt-20">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-2xl font-bold mb-4">Apna Rooms</h3>
          <p className="text-gray-400 max-w-sm">Premium PG management platform for modern students and professionals. Find your perfect home with us.</p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link to="/" className="hover:text-accent">Home</Link></li>
            <li><Link to="/pgs" className="hover:text-accent">Browse PGs</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Support</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link to="/dashboard" className="hover:text-accent">Dashboard</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Help Center</Link></li>
            <li><Link to="/pgs" className="hover:text-accent">Locations</Link></li>
          </ul>
        </div>
      </div>
      <div className="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>© 2026 Apna Rooms. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default App;

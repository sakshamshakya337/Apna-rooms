import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserPlus, Mail, Lock, User, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData.fullName);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Illustration Side */}
        <div className="hidden md:flex md:w-1/2 bg-primary p-12 flex-col justify-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80" 
              alt="Background" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-6 text-accent">Join Our Community</h2>
            <p className="text-lg text-gray-300 mb-8">
              "Start your journey with Apna Rooms. Access the best PG options and manage your stay professionally."
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Easy Maintenance Tracking</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Secure Digital Payments</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Electricity Bill History</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="mb-10 text-center md:text-left">
            <img 
              src="/logo.png" 
              alt="Apna Rooms Logo" 
              className="h-16 w-auto mb-6 mx-auto md:mx-0 object-contain rounded-xl shadow-sm"
            />
            <h2 className="text-3xl font-extrabold text-primary tracking-tight">Create Account</h2>
            <p className="mt-3 text-gray-500 text-lg">Experience premium living with Apna Rooms</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="fullName"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              By signing up, you agree to our <a href="#" className="text-accent hover:underline">Terms of Service</a> and <a href="#" className="text-accent hover:underline">Privacy Policy</a>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 uppercase tracking-widest font-medium">Or join with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 border-2 border-gray-100 rounded-xl font-bold flex items-center justify-center space-x-3 hover:bg-gray-50 transition-all group"
          >
            <Chrome className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
            <span>Google Account</span>
          </button>

          <p className="mt-10 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;

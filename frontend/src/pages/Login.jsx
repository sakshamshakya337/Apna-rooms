import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { LogIn, Mail, Lock, Chrome, X, Send, Clock, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const data = await forgotPassword(forgotEmail);
      toast.success(data.message || 'Password reset link sent to your email');
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (error) {
      console.error('Forgot Password Error:', error);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf8ff] font-['Manrope'] text-[#342d55] flex flex-col md:flex-row relative overflow-hidden">
      
      {/* Abstract Background for general page context */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#e7c9ff] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      
      {/* Visual Header / Welcome Section (Top on mobile, Left on Desktop) */}
      <div className="md:w-[45%] lg:w-[50%] p-6 md:p-12 lg:p-20 flex flex-col justify-center relative">
        {/* The Signature Gradient Background for this half */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4a4bd7] to-[#842cd3] overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80')] opacity-10 mix-blend-overlay object-cover w-full h-full"></div>
          <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-[#61c2ff] rounded-full blur-[100px] opacity-30 mix-blend-screen"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-lg mx-auto">
          {/* Glassmorphic Brand Card */}
          <div className="bg-[#ffffff]/10 backdrop-blur-3xl p-10 lg:p-14 rounded-[3rem] border border-[#ffffff]/20 shadow-[0_40px_80px_rgba(34,30,181,0.2)]">
            <h1 className="text-4xl lg:text-5xl font-['Plus_Jakarta_Sans'] font-extrabold text-[#ffffff] mb-4 tracking-tight leading-tight">
              Apna Rooms
            </h1>
            <p className="text-[#e6deff] text-xl font-medium leading-relaxed mb-10">
              Welcome to your academic sanctuary. Experience living defined by comfort and connection.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4 bg-[#ffffff]/10 rounded-2xl p-4 border border-[#ffffff]/10">
                 <div className="w-10 h-10 bg-[#ffffff]/20 rounded-full flex items-center justify-center shrink-0">
                   <div className="w-2.5 h-2.5 bg-[#61c2ff] rounded-full"></div>
                 </div>
                 <span className="text-[#fbf7ff] font-medium text-lg tracking-wide">Verified Stays</span>
              </div>
              <div className="flex items-center space-x-4 bg-[#ffffff]/10 rounded-2xl p-4 border border-[#ffffff]/10">
                 <div className="w-10 h-10 bg-[#ffffff]/20 rounded-full flex items-center justify-center shrink-0">
                   <div className="w-2.5 h-2.5 bg-[#61c2ff] rounded-full"></div>
                 </div>
                 <span className="text-[#fbf7ff] font-medium text-lg tracking-wide">Instant digital bookings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 p-6 md:p-12 lg:p-20 flex items-center justify-center relative z-10 w-full">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:mb-12">
            <h2 className="text-4xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#0f0b20] mb-3">Sign In</h2>
            <p className="text-[#615985] text-lg font-medium">Continue your journey with us.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Email identity"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f7f1ff] border-none rounded-full py-5 px-6 text-[#342d55] placeholder:text-[#a099b4] focus:ring-0 focus:bg-[#ffffff] shadow-inner transition-colors text-lg"
                />
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f7f1ff] border-none rounded-full py-5 px-6 text-[#342d55] placeholder:text-[#a099b4] focus:ring-0 focus:bg-[#ffffff] shadow-inner transition-colors text-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm px-2">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative flex items-center">
                   <input type="checkbox" className="peer w-5 h-5 rounded-[0.4rem] border-[#b5acdc] text-[#4a4bd7] focus:ring-0 focus:ring-offset-0 bg-[#f7f1ff] cursor-pointer" />
                </div>
                <span className="text-[#615985] font-bold group-hover:text-[#342d55] transition-colors">Keep me signed in</span>
              </label>
              <button 
                type="button" 
                onClick={() => setShowForgotModal(true)} 
                className="text-[#4a4bd7] font-bold hover:text-[#842cd3] transition-colors"
              >
                Reset Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 mt-2 bg-gradient-to-r from-[#4a4bd7] to-[#842cd3] text-white rounded-full font-bold text-xl shadow-[0_15px_30px_rgba(74,75,215,0.25)] hover:shadow-[0_20px_40px_rgba(74,75,215,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : (
                <>
                  <span>Sign in securely</span>
                  <LogIn className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 mb-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e6deff]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-[#fdf8ff] text-[#a099b4] font-bold tracking-widest uppercase">Or connect via</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-5 bg-[#ffffff] border border-[#ece4ff] rounded-full font-bold text-[#342d55] flex items-center justify-center space-x-3 hover:bg-[#f7f1ff] shadow-[0_10px_20px_rgba(52,45,85,0.03)] hover:-translate-y-0.5 transition-all text-lg"
          >
            <Chrome className="w-6 h-6 text-[#4a4bd7]" />
            <span>Google SSO</span>
          </button>

          <div className="mt-12 text-center text-[#615985] font-medium text-lg">
            New to Apna Rooms?{' '}
            <Link to="/signup" className="text-[#4a4bd7] font-bold hover:text-[#842cd3] transition-colors">
              Create an account
            </Link>
          </div>
          
          <div className="mt-8 text-center">
            <Link to="/staff-login" className="inline-flex items-center justify-center space-x-2 text-sm text-[#7d75a2] font-bold hover:text-[#342d55] transition-colors py-2 px-4 rounded-full hover:bg-[#f1ebff]">
               <UserCog className="w-4 h-4" />
               <span>Service Staff Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0b20]/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-[#ffffff]/80 backdrop-blur-3xl rounded-[3rem] p-10 md:p-14 max-w-lg w-full shadow-[0_40px_80px_rgba(34,30,181,0.1)] border border-[#ffffff]"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0f0b20]">Reset Route</h3>
                  <p className="text-lg text-[#615985] mt-2 font-medium">We'll send transmission to your email.</p>
                </div>
                <button 
                  onClick={() => setShowForgotModal(false)} 
                  className="p-3 bg-[#f7f1ff] text-[#342d55] hover:bg-[#ece4ff] rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-8">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-[#fdf8ff] border-none rounded-[1.5rem] py-5 px-6 text-[#342d55] placeholder:text-[#a099b4] focus:ring-0 focus:bg-[#ffffff] shadow-inner transition-colors text-lg"
                  />
                </div>

                <div className="bg-[#f0dbff]/60 border border-[#e7c9ff] p-5 rounded-3xl flex items-start space-x-4">
                  <div className="bg-[#ffffff] p-2 rounded-xl text-[#842cd3] shrink-0 shadow-sm mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-[#7614c4] leading-relaxed">
                    A secure password reset link will be active for 1 hour after transmission.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-5 bg-gradient-to-r from-[#4a4bd7] to-[#842cd3] text-white rounded-full font-bold text-xl shadow-[0_15px_30px_rgba(74,75,215,0.25)] hover:shadow-[0_20px_40px_rgba(74,75,215,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  {forgotLoading ? 'Transmitting...' : (
                    <>
                      <span>Send Recovery Link</span>
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;

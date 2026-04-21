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
      const user = await loginWithGoogle();
      if (user) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#060410] text-[#e1e1e6] flex flex-col md:flex-row relative overflow-hidden font-['Sora'] selection:bg-accent/30">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-accent/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
      
      {/* Left Visual Section */}
      <div className="hidden md:flex md:w-[45%] p-12 lg:p-20 flex-col justify-between relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80')] opacity-10 grayscale brightness-[0.3] object-cover scale-110"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#060410] via-[#060410]/95 to-[#060410]/40"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-16 group cursor-pointer">
            <div className="p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl group-hover:border-accent/40 transition-all shadow-2xl">
              <img src="/apna_light.jpg" alt="Logo" className="h-10 w-10 rounded-lg shadow-inner" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">Apna <span className="text-accent underline decoration-accent/30 underline-offset-4">Rooms</span></span>
          </div>
          
          <div className="space-y-10">
            <h1 className="text-6xl lg:text-8xl font-black leading-[1] tracking-tighter text-white drop-shadow-2xl">
              Elevate <br />Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">Living.</span>
            </h1>
            <p className="text-gray-400 text-lg lg:text-xl font-medium leading-relaxed max-w-sm border-l-2 border-accent/30 pl-6">
              Access India's most advanced student housing platform with enterprise-grade security and comfort.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl max-w-sm">
            <div className="flex -space-x-3 mb-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#060410] bg-gray-800 overflow-hidden shadow-lg transform hover:scale-110 transition-transform cursor-pointer">
                  <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-[#060410] bg-accent flex items-center justify-center text-[10px] font-black text-white shadow-lg">+5k</div>
            </div>
            <p className="text-xs text-gray-500 font-bold tracking-[0.1em] uppercase">Trusted by the next generation of leaders</p>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20 relative z-10 bg-[#060410]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center justify-center space-x-3 mb-12">
            <div className="p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl">
              <img src="/apna_light.jpg" alt="Logo" className="h-10 w-10 rounded-lg shadow-inner" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">Apna <span className="text-accent">Rooms</span></span>
          </div>

          <div className="mb-12">
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white tracking-tight">Access Portal</h2>
            <p className="text-gray-400 font-medium text-lg leading-relaxed">Secure authentication required for entry.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-5">
              <div className="group transition-all">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] ml-2 mb-3 block group-focus-within:text-accent transition-colors">Digital Identity</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-accent transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#110d26] border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-white placeholder:text-gray-500 focus:bg-[#161133] focus:border-accent outline-none transition-all font-semibold text-lg shadow-2xl"
                  />
                </div>
              </div>

              <div className="group transition-all">
                <div className="flex justify-between items-center ml-2 mb-3">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] group-focus-within:text-accent transition-colors">Access Key</label>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotModal(true)}
                    className="text-[10px] text-accent/60 font-black uppercase tracking-widest hover:text-accent transition-colors py-1"
                  >
                    Lost access?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-accent transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#110d26] border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-white placeholder:text-gray-500 focus:bg-[#161133] focus:border-accent outline-none transition-all font-semibold text-lg shadow-2xl"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-accent hover:bg-accent/90 text-white rounded-[2.5rem] font-black text-xl shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.5)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-3 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <LogIn className="w-6 h-6 relative z-10" />
              <span className="relative z-10">{loading ? 'Verifying...' : 'Authorize Entry'}</span>
            </button>
          </form>

          <div className="my-12 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="px-6 bg-[#060410] text-gray-700">Third-Party Federation</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-5 bg-white/[0.02] border border-white/5 rounded-3xl font-bold text-white flex items-center justify-center space-x-4 hover:bg-white/[0.05] hover:border-white/10 transition-all text-sm mb-12 group shadow-xl"
          >
            <div className="bg-white p-1 rounded-full group-hover:scale-110 transition-transform">
              <Chrome className="w-4 h-4 text-[#4285F4]" />
            </div>
            <span className="tracking-wide">Continue with Google Network</span>
          </button>

          <div className="text-center p-8 bg-[#110d26]/30 rounded-[2.5rem] border border-white/5 shadow-inner">
            <p className="text-gray-500 text-sm font-medium">
              Not a member yet? {' '}
              <Link to="/signup" className="text-accent font-black hover:text-white transition-colors underline underline-offset-8 decoration-accent/30 decoration-2 hover:decoration-accent">Request Access</Link>
            </p>
          </div>
          
          <div className="mt-14 pt-8 border-t border-white/5 flex flex-col items-center space-y-4">
             <Link to="/staff-login" className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-accent transition-all flex items-center group">
                <UserCog className="w-5 h-5 mr-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" /> 
                Administrative Portal
             </Link>
             <p className="text-[9px] text-gray-700 font-bold uppercase tracking-[0.4em]">© 2026 Apna Rooms Technology Corp.</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060410]/80 backdrop-blur-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 40 }} 
              className="bg-[#0f0e1c] border border-white/10 rounded-[4rem] p-12 md:p-16 max-w-lg w-full shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-t border-white/20 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-purple-500 to-accent"></div>
              
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-4xl font-black text-white tracking-tighter">Reset Access</h3>
                  <p className="text-lg text-gray-400 mt-3 font-medium">Identity verification required.</p>
                </div>
                <button 
                  onClick={() => setShowForgotModal(false)} 
                  className="p-4 bg-white/5 text-gray-400 hover:text-white rounded-full transition-all hover:rotate-90"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-10">
                <div className="group">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] ml-2 mb-3 block group-focus-within:text-accent transition-colors">Registered Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@university.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-[2rem] py-6 px-8 text-white placeholder:text-gray-700 focus:ring-0 focus:border-accent/40 focus:bg-white/[0.05] transition-all text-lg shadow-inner outline-none"
                  />
                </div>

                <div className="bg-accent/5 border border-accent/10 p-6 rounded-[2rem] flex items-center space-x-5">
                  <Send className="w-8 h-8 text-accent animate-bounce" />
                  <p className="text-sm font-bold text-accent/80 leading-relaxed tracking-wide">
                    A secure recovery link will be dispatched to your terminal immediately.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-6 bg-accent text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-accent/20 hover:shadow-accent/40 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  <Send className="w-6 h-6" />
                  <span>{forgotLoading ? 'Transmitting...' : 'Send Recovery Link'}</span>
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

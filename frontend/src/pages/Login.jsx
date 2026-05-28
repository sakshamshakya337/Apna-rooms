import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { LogIn, Mail, Lock, Chrome, X, Send, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, forgotPassword } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  
  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  
  // Issue 1 Fix: Explicitly redirect away from login if already authenticated
  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaToken) {
      toast.error('Please complete the captcha verification');
      return;
    }
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
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row relative overflow-hidden transition-colors duration-300">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
      
      {/* Left Visual Section */}
      <div className="hidden md:flex md:w-[45%] p-12 lg:p-20 flex-col justify-between relative overflow-hidden border-r border-border-low bg-surface-main">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80')] opacity-5 grayscale brightness-[0.9] dark:brightness-[0.2] object-cover scale-110"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/50"></div>
        
        <div className="relative z-10 space-y-12">
          <div className="flex items-center space-x-3 group cursor-pointer w-fit">
            <img 
              src={theme === 'dark' ? '/apna_dark.jpg' : '/apna_light.jpg'} 
              alt="Logo" 
              className="h-10 w-auto rounded-lg shadow-sm" 
            />
            <span className="text-xl font-bold text-text-primary tracking-tight">Apna Rooms</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-text-primary">
              Elevate <br />Your <span className="text-gradient">Living.</span>
            </h1>
            <p className="text-text-secondary text-base lg:text-lg font-medium leading-relaxed max-w-sm border-l-2 border-primary/30 pl-4">
              Access India's most advanced student housing platform with enterprise-grade security and comfort.
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-xs">
          <div className="bg-surface-container-low backdrop-blur-md rounded-xl p-6 border border-border-low shadow-sm">
            <div className="flex -space-x-2 mb-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border border-background bg-surface-container-high overflow-hidden">
                  <img src={`https://i.pravatar.cc/80?img=${i+22}`} alt="User" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border border-background bg-primary flex items-center justify-center text-[10px] font-bold text-on-primary shadow-sm">+5k</div>
            </div>
            <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Trusted by professionals & guests</p>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20 relative z-10 bg-surface-main">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center justify-center space-x-3 mb-8">
            <img 
              src={theme === 'dark' ? '/apna_dark.jpg' : '/apna_light.jpg'} 
              alt="Logo" 
              className="h-10 w-auto rounded-lg shadow-sm" 
            />
            <span className="text-xl font-bold text-text-primary tracking-tight">Apna Rooms</span>
          </div>

          <div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight">Access Portal</h2>
            <p className="text-text-secondary font-medium text-sm lg:text-base mt-1">Secure authentication required for entry.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 mb-2 block group-focus-within:text-primary transition-colors">Digital Identity Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-low border border-border-low rounded-lg py-3.5 px-4 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-center ml-1 mb-2">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider group-focus-within:text-primary transition-colors">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotModal(true)}
                    className="text-[10px] text-primary/80 font-bold uppercase tracking-wider hover:underline"
                  >
                    Lost access?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-low border border-border-low rounded-lg py-3.5 px-4 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center my-4">
              <Turnstile 
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                onSuccess={(token) => setCaptchaToken(token)} 
                options={{ theme: theme === 'dark' ? 'dark' : 'light' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:opacity-90 text-on-primary rounded-lg font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Authorize Entry'}</span>
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-low"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
              <span className="px-4 bg-surface-main text-text-secondary">Third-Party Federation</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-surface-container-low hover:bg-surface-container border border-border-low rounded-lg font-semibold text-text-primary flex items-center justify-center space-x-3 transition-colors text-xs cursor-pointer"
          >
            <Chrome className="w-4 h-4 text-[#4285F4]" />
            <span>Continue with Google Network</span>
          </button>

          <div className="text-center p-4 bg-surface-container-low rounded-lg border border-border-low">
            <p className="text-text-secondary text-xs font-semibold">
              Not a member yet? {' '}
              <Link to="/signup" className="text-primary font-bold hover:underline">Request Access</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-surface-main border border-border-low rounded-xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-text-primary tracking-tight">Reset Access</h3>
                  <p className="text-sm text-text-secondary mt-1">Identity verification email required.</p>
                </div>
                <button 
                  onClick={() => setShowForgotModal(false)} 
                  className="p-1.5 rounded-lg hover:bg-surface-container text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-6">
                <div className="group">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 mb-2 block">Registered Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-surface-container-low border border-border-low rounded-lg py-3 px-4 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold"
                  />
                </div>

                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex items-center gap-3 text-xs text-primary font-semibold">
                  <Send className="w-5 h-5 shrink-0" />
                  <span>A secure recovery link will be dispatched to your email immediately.</span>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-primary text-on-primary rounded-lg font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
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

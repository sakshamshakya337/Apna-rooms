import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { UserPlus, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentCategory: 'National'
  });
  const { signup, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaToken) {
      return toast.error('Please complete the captcha verification');
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData.fullName, 'user', formData.studentCategory);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row relative overflow-hidden transition-colors duration-300">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
      
      {/* Left Form Section */}
      <div className="flex-grow flex items-center justify-center p-6 md:p-12 lg:p-20 relative z-10 bg-surface-main">
        <div className="w-full max-w-lg space-y-6">
          
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center justify-center space-x-3 mb-6">
            <img 
              src={theme === 'dark' ? '/apna_dark.jpg' : '/apna_light.jpg'} 
              alt="Logo" 
              className="h-10 w-auto rounded-lg shadow-sm" 
            />
            <span className="text-xl font-bold text-text-primary tracking-tight">Apna Rooms</span>
          </div>

          <div className="text-center md:text-left space-y-1">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight">Create Profile</h2>
            <p className="text-text-secondary font-medium text-sm lg:text-base">Join India's most exclusive student network.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 block">Legal Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-surface-container-low border border-border-low rounded-lg py-3 px-4 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 block">Institutional Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-surface-container-low border border-border-low rounded-lg py-3 px-4 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold"
                />
              </div>
            </div>

            {/* Student Category Selection */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 block">Origin Classification</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, studentCategory: 'National' })}
                  className={`flex flex-col items-center justify-center p-5 rounded-lg border transition-all duration-300 relative overflow-hidden bg-surface-container-low hover:bg-surface-container ${
                    formData.studentCategory === 'National'
                      ? 'border-primary text-text-primary shadow-sm bg-primary/5'
                      : 'border-border-low text-text-secondary'
                  }`}
                >
                  <span className={`font-bold text-xs uppercase tracking-wider ${formData.studentCategory === 'National' ? 'text-primary' : 'text-text-secondary'}`}>Domestic</span>
                  <span className="text-[9px] font-bold text-text-secondary/60 mt-1 uppercase tracking-widest">Scholar of India</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, studentCategory: 'International' })}
                  className={`flex flex-col items-center justify-center p-5 rounded-lg border transition-all duration-300 relative overflow-hidden bg-surface-container-low hover:bg-surface-container ${
                    formData.studentCategory === 'International'
                      ? 'border-primary text-text-primary shadow-sm bg-primary/5'
                      : 'border-border-low text-text-secondary'
                  }`}
                >
                  <span className={`font-bold text-xs uppercase tracking-wider ${formData.studentCategory === 'International' ? 'text-primary' : 'text-text-secondary'}`}>Global</span>
                  <span className="text-[9px] font-bold text-text-secondary/60 mt-1 uppercase tracking-widest">Global Scholar</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 block">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-surface-container-low border border-border-low rounded-lg py-3 px-4 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 block">Confirm Key</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-surface-container-low border border-border-low rounded-lg py-3 px-4 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold"
                />
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
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Provision Account'}</span>
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-low"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
              <span className="px-4 bg-surface-main text-text-secondary">Digital Identity Provider</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-surface-container-low hover:bg-surface-container border border-border-low rounded-lg font-semibold text-text-primary flex items-center justify-center space-x-3 transition-colors text-xs cursor-pointer"
          >
            <Chrome className="w-4 h-4 text-[#4285F4]" />
            <span>Register with Google Identity</span>
          </button>

          <div className="text-center p-4 bg-surface-container-low rounded-lg border border-border-low">
            <p className="text-text-secondary text-xs font-semibold">
              Already verified?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Access Portal
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Visual Section */}
      <div className="hidden md:flex md:w-[45%] p-12 lg:p-20 flex-col justify-between relative overflow-hidden border-l border-border-low bg-surface-main">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555854816-802f18809a1c?auto=format&fit=crop&q=80')] opacity-5 grayscale brightness-[0.9] dark:brightness-[0.2] object-cover scale-110"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/50"></div>
        
        <div className="relative z-10 space-y-12">
          <div className="flex items-center space-x-3 group cursor-pointer w-fit">
            <img 
              src={theme === 'dark' ? '/apna_dark.jpg' : '/apna_light.jpg'} 
              alt="Logo" 
              className="h-10 w-auto rounded-lg shadow-sm" 
            />
            <span className="text-xl font-bold text-text-primary tracking-tight">Join the Network</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-text-primary">
              Unleash <br />Your <span className="text-gradient">Potential.</span>
            </h1>
            <p className="text-text-secondary text-base lg:text-lg font-medium leading-relaxed max-w-sm border-l-2 border-primary/30 pl-4">
              Join 5,000+ high-achieving students who have upgraded their living experience to premium standards.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-surface-container-low backdrop-blur-md rounded-xl p-6 border border-border-low shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Network Capacity</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider font-mono">92% Filled</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '92%' }}></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Signup;

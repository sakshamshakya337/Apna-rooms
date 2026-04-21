import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserPlus, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentCategory: 'National'
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
    <div className="min-h-screen bg-[#060410] text-[#e1e1e6] flex flex-col md:flex-row relative overflow-hidden font-['Sora'] selection:bg-accent/30">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-accent/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
      
      {/* Left Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20 relative z-10 bg-[#060410]">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center justify-center space-x-3 mb-10">
            <div className="p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl">
              <img src="/apna_light.jpg" alt="Logo" className="h-10 w-10 rounded-lg shadow-inner" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">Apna <span className="text-accent underline decoration-accent/30 underline-offset-4">Rooms</span></span>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white tracking-tight">Create Profile</h2>
            <p className="text-gray-400 font-medium text-lg leading-relaxed">Join India's most exclusive student network.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 group transition-all">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] ml-2 block group-focus-within:text-accent transition-colors">Legal Identity</label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-[#110d26] border border-white/10 rounded-3xl py-4.5 px-6 text-white placeholder:text-gray-500 focus:bg-[#161133] focus:border-accent outline-none transition-all font-semibold text-lg shadow-2xl"
                  />
                </div>
              </div>
              <div className="space-y-3 group transition-all">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] ml-2 block group-focus-within:text-accent transition-colors">Institutional ID</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="john@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-[#110d26]/50 border border-white/5 rounded-3xl py-4.5 px-6 text-white placeholder:text-gray-700 focus:bg-[#161133] focus:border-accent/40 outline-none transition-all font-semibold text-lg shadow-2xl"
                  />
                </div>
              </div>
            </div>

            {/* Student Category Selection - Enhanced Stitch Design */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] ml-2 block">Origin Classification</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, studentCategory: 'National' })}
                  className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden backdrop-blur-3xl ${
                    formData.studentCategory === 'National'
                      ? 'bg-accent/15 border-accent text-white shadow-[0_20px_50px_rgba(59,130,246,0.2)]'
                      : 'bg-white/[0.02] border-white/5 text-gray-600 hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full mb-3 transition-all duration-500 ${formData.studentCategory === 'National' ? 'bg-accent scale-125 shadow-[0_0_15px_rgba(59,130,246,1)]' : 'bg-gray-700'}`}></div>
                  <span className={`font-black text-sm uppercase tracking-[0.2em] transition-colors ${formData.studentCategory === 'National' ? 'text-white' : 'text-gray-400 font-bold'}`}>Domestic</span>
                  <span className="text-[9px] font-bold text-gray-500 mt-2 tracking-widest">Scholar of India</span>
                  {formData.studentCategory === 'National' && (
                    <motion.div layoutId="category-glow" className="absolute inset-0 bg-accent/5 pointer-events-none" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, studentCategory: 'International' })}
                  className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden backdrop-blur-3xl ${
                    formData.studentCategory === 'International'
                      ? 'bg-purple-500/15 border-purple-500 text-white shadow-[0_20px_50px_rgba(168,85,247,0.2)]'
                      : 'bg-white/[0.02] border-white/5 text-gray-600 hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full mb-3 transition-all duration-500 ${formData.studentCategory === 'International' ? 'bg-purple-500 scale-125 shadow-[0_0_15px_rgba(168,85,247,1)]' : 'bg-gray-700'}`}></div>
                  <span className={`font-black text-sm uppercase tracking-[0.2em] transition-colors ${formData.studentCategory === 'International' ? 'text-white' : 'text-gray-400 font-bold'}`}>Global</span>
                  <span className="text-[9px] font-bold text-gray-500 mt-2 tracking-widest">Global Scholar</span>
                  {formData.studentCategory === 'International' && (
                    <motion.div layoutId="category-glow" className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 group transition-all">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-2 group-focus-within:text-accent transition-colors">Access Key</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#110d26] border border-white/10 rounded-3xl py-4.5 px-6 text-white placeholder:text-gray-500 focus:bg-[#161133] focus:border-accent outline-none transition-all font-semibold text-lg shadow-2xl"
                />
              </div>
              <div className="space-y-2 group transition-all">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-2 group-focus-within:text-accent transition-colors">Confirm Key</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-[#110d26] border border-white/10 rounded-3xl py-4.5 px-6 text-white placeholder:text-gray-500 focus:bg-[#161133] focus:border-accent outline-none transition-all font-semibold text-lg shadow-2xl"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-accent hover:bg-accent/90 text-white rounded-[2.5rem] font-black text-xl shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.5)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-3 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <UserPlus className="w-6 h-6 relative z-10" />
              <span className="relative z-10">{loading ? 'Processing...' : 'Provision Account'}</span>
            </button>
          </form>

          <div className="my-10 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="px-6 bg-[#060410] text-gray-700">Digital Identity Provider</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-5 bg-white/[0.02] border border-white/5 rounded-3xl font-bold text-white flex items-center justify-center space-x-4 hover:bg-white/[0.05] hover:border-white/10 transition-all text-sm mb-12 group shadow-xl"
          >
            <div className="bg-white p-1 rounded-full group-hover:scale-110 transition-transform">
              <Chrome className="w-4 h-4 text-[#4285F4]" />
            </div>
            <span className="tracking-wide">Register with Google Identity</span>
          </button>

          <div className="mt-10 text-center p-8 bg-[#110d26]/30 rounded-[2.5rem] border border-white/5 shadow-inner">
            <p className="text-gray-500 font-medium text-sm">
              Already verified?{' '}
              <Link to="/login" className="text-accent font-black hover:text-white transition-colors underline underline-offset-8 decoration-accent/30 decoration-2 hover:decoration-accent">
                Access Portal
              </Link>
            </p>
          </div>
        </div>
      </div>

       {/* Right Visual Section */}
       <div className="hidden md:flex md:w-[45%] p-12 lg:p-20 flex-col justify-between relative overflow-hidden border-l border-white/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555854816-802f18809a1c?auto=format&fit=crop&q=80')] opacity-10 grayscale brightness-[0.3] object-cover scale-110"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#060410] via-[#060410]/95 to-[#060410]/40"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-16 group cursor-pointer">
            <div className="p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl group-hover:border-accent/40 transition-all shadow-2xl">
              <img src="/apna_light.jpg" alt="Logo" className="h-10 w-10 rounded-lg shadow-inner" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">Join the <span className="text-accent underline decoration-accent/30 underline-offset-4">Network</span></span>
          </div>
          
          <div className="space-y-10">
            <h1 className="text-6xl lg:text-8xl font-black leading-[1] tracking-tighter text-white drop-shadow-2xl">
              Unleash <br />Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">Potential.</span>
            </h1>
            <p className="text-gray-400 text-lg lg:text-xl font-medium leading-relaxed max-w-sm border-l-2 border-accent/30 pl-6">
              Join 5,000+ high-achieving students who have upgraded their living experience to premium standards.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl max-w-sm">
            <div className="flex items-center space-x-5 mb-6">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-ping shadow-[0_0_15px_rgba(34,197,94,1)]"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Network Status: Optimized</p>
            </div>
            <div className="space-y-4">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '92%' }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-accent to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                />
              </div>
              <div className="flex justify-between">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Capacity: 92%</p>
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Premium Tiers Only</p>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-gray-700 font-bold uppercase tracking-[0.4em] mt-8 text-center">© 2026 Apna Rooms Technology Corp.</p>
        </div>
      </div>

    </div>
  );
};

export default Signup;

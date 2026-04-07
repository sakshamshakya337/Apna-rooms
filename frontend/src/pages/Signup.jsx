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
    <div className="min-h-screen bg-[#fdf8ff] font-['Manrope'] text-[#342d55] flex flex-col-reverse md:flex-row relative overflow-hidden">
      
      {/* Abstract Background for general page context */}
      <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-[#ece4ff] rounded-full blur-[120px] opacity-30 pointer-events-none"></div>

      {/* Form Section (Left on Desktop, Bottom on Mobile due to reverse) */}
      <div className="flex-1 p-6 md:p-12 lg:p-20 flex items-center justify-center relative z-10 w-full">
        <div className="w-full max-w-lg">
          <div className="mb-10 lg:mb-12 text-center md:text-left">
            <h2 className="text-4xl lg:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#0f0b20] mb-3">Create Account</h2>
            <p className="text-[#615985] text-lg font-medium">Experience premium living with Apna Rooms</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="bg-[#ffffff]/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-[#ffffff] shadow-[0_20px_40px_rgba(52,45,85,0.03)] space-y-4">
                
                <div>
                   <label className="text-xs font-bold uppercase tracking-widest text-[#a099b4] ml-4 mb-2 block">Full Legal Name</label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    placeholder="Priya Sharma"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-[#f7f1ff] border-none rounded-full py-4 px-6 text-[#342d55] placeholder:text-[#b5acdc] focus:ring-0 focus:bg-[#ffffff] shadow-inner transition-colors text-lg"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#a099b4] ml-4 mb-2 block">Email Identity</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-[#f7f1ff] border-none rounded-full py-4 px-6 text-[#342d55] placeholder:text-[#b5acdc] focus:ring-0 focus:bg-[#ffffff] shadow-inner transition-colors text-lg"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-[#a099b4] ml-4 mb-2 block">Secure Password</label>
                      <input
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-[#f7f1ff] border-none rounded-full py-4 px-6 text-[#342d55] placeholder:text-[#b5acdc] focus:ring-0 focus:bg-[#ffffff] shadow-inner transition-colors text-lg"
                      />
                   </div>
                   <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-[#a099b4] ml-4 mb-2 block">Confirm Phrase</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full bg-[#f7f1ff] border-none rounded-full py-4 px-6 text-[#342d55] placeholder:text-[#b5acdc] focus:ring-0 focus:bg-[#ffffff] shadow-inner transition-colors text-lg"
                      />
                   </div>
                </div>

              </div>
            </div>

            <p className="text-sm text-[#a099b4] font-medium px-4 text-center md:text-left">
              By initiating creation, you agree to our <a href="#" className="text-[#4a4bd7] font-bold hover:text-[#842cd3]">Terms of Service</a> & <a href="#" className="text-[#4a4bd7] font-bold hover:text-[#842cd3]">Privacy Policy</a>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 mt-4 bg-gradient-to-r from-[#4a4bd7] to-[#842cd3] text-white rounded-full font-bold text-xl shadow-[0_15px_30px_rgba(74,75,215,0.25)] hover:shadow-[0_20px_40px_rgba(74,75,215,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Initializing...' : (
                <>
                  <span>Create Account</span>
                  <UserPlus className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 mb-8 relative">
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

          <div className="mt-10 text-center text-[#615985] font-medium text-lg">
            Already verified?{' '}
            <Link to="/login" className="text-[#4a4bd7] font-bold hover:text-[#842cd3] transition-colors">
              Access Portal
            </Link>
          </div>
        </div>
      </div>

       {/* Visual Header / Welcome Section (Top on mobile, Right on Desktop) */}
       <div className="md:w-[45%] lg:w-[50%] p-6 md:p-12 lg:p-20 flex flex-col justify-center relative">
        {/* The Signature Gradient Background for this half */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4a4bd7] to-[#842cd3] overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80')] opacity-10 mix-blend-overlay object-cover w-full h-full scale-110"></div>
          <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-[#61c2ff] rounded-full blur-[100px] opacity-30 mix-blend-screen"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-lg mx-auto">
          {/* Glassmorphic Brand Card */}
          <div className="bg-[#ffffff]/10 backdrop-blur-3xl p-10 lg:p-14 rounded-[3rem] border border-[#ffffff]/20 shadow-[0_40px_80px_rgba(34,30,181,0.2)]">
            <h1 className="text-4xl lg:text-5xl font-['Plus_Jakarta_Sans'] font-extrabold text-[#ffffff] mb-4 tracking-tight leading-tight">
              Join the Network
            </h1>
            <p className="text-[#e6deff] text-xl font-medium leading-relaxed mb-10">
              Start your journey with Apna Rooms. Elevate your living standards.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4 bg-[#ffffff]/10 rounded-2xl p-4 border border-[#ffffff]/10">
                 <div className="w-10 h-10 bg-[#ffffff]/20 rounded-full flex items-center justify-center shrink-0">
                   <div className="w-2.5 h-2.5 bg-[#f0dbff] rounded-full"></div>
                 </div>
                 <span className="text-[#fbf7ff] font-medium text-lg tracking-wide">Premium Accommodations</span>
              </div>
              <div className="flex items-center space-x-4 bg-[#ffffff]/10 rounded-2xl p-4 border border-[#ffffff]/10">
                 <div className="w-10 h-10 bg-[#ffffff]/20 rounded-full flex items-center justify-center shrink-0">
                   <div className="w-2.5 h-2.5 bg-[#f0dbff] rounded-full"></div>
                 </div>
                 <span className="text-[#fbf7ff] font-medium text-lg tracking-wide">Automated Issue Tracking</span>
              </div>
               <div className="flex items-center space-x-4 bg-[#ffffff]/10 rounded-2xl p-4 border border-[#ffffff]/10">
                 <div className="w-10 h-10 bg-[#ffffff]/20 rounded-full flex items-center justify-center shrink-0">
                   <div className="w-2.5 h-2.5 bg-[#f0dbff] rounded-full"></div>
                 </div>
                 <span className="text-[#fbf7ff] font-medium text-lg tracking-wide">Secure Global Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Signup;

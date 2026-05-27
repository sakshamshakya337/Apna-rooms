import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { Lock, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      console.error('Reset Password Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 transition-colors duration-300">
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Invalid Reset Link</h2>
          <p className="text-text-secondary text-sm mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1.5 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background px-4 py-12 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface-main rounded-xl border border-border-low shadow-lg p-8 md:p-10"
      >
        <div className="text-center mb-8 space-y-4">
          <img 
            src={theme === 'dark' ? '/apna_dark.jpg' : '/apna_light.jpg'} 
            alt="Apna Rooms Logo" 
            className="w-16 h-16 object-contain rounded-xl mx-auto shadow-sm" 
          />
          <div>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">Reset Password</h2>
            <p className="mt-1 text-sm text-text-secondary">Create a new secure password for your account</p>
          </div>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-4"
          >
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto text-success border border-success/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">Success!</h3>
              <p className="text-sm text-text-secondary mt-1">Your password has been reset. Redirecting to login...</p>
            </div>
            <Link to="/login" className="inline-block px-6 py-2.5 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 transition-all text-sm">
              Go to Login
            </Link>
          </motion.div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="group">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 mb-2 block">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-surface-container-low border border-border-low rounded-lg py-3 pl-4 pr-10 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="group">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 mb-2 block">Confirm Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    className="w-full bg-surface-container-low border border-border-low rounded-lg py-3 px-4 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-4 rounded-lg border border-border-low">
              <ul className="text-[10px] text-text-secondary space-y-1 font-semibold uppercase tracking-wider">
                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 shrink-0"></span> Minimum 6 characters</li>
                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 shrink-0"></span> Use symbols & numbers for strength</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Resetting...' : 'Update Password'}</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
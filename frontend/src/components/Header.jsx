import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, User, LogOut, Sun, Moon } from 'lucide-react';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-main border-b border-border-low transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src={theme === 'dark' ? '/apna_dark.jpg' : '/apna_light.jpg'} 
              alt="Apna Rooms Logo" 
              className="h-10 w-auto object-contain rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-sm"
            />
            <span className="text-xl font-bold text-primary tracking-tight">Apna Rooms</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/pgs" className="text-text-secondary font-medium hover:text-primary transition-colors duration-200">Find PGs</Link>
            <Link to="/contact" className="text-text-secondary font-medium hover:text-primary transition-colors duration-200">Contact Us</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Light/Dark Mode Switcher */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors duration-200 text-text-secondary hover:text-primary"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {currentUser ? (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-surface-container text-primary font-semibold rounded-lg hover:bg-surface-container-high transition-colors">
                <User className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-text-secondary font-semibold hover:text-primary transition-colors">Login</Link>
              <Link to="/signup" className="px-5 py-2 bg-primary-container text-on-primary font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-all">Sign Up</Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-text-secondary hover:text-primary p-2 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-surface-main border-b border-border-low py-4 px-4 space-y-4 transition-colors duration-300">
          <Link to="/pgs" className="block text-text-secondary hover:text-primary font-medium" onClick={() => setIsOpen(false)}>Find PGs</Link>
          <Link to="/contact" className="block text-text-secondary hover:text-primary font-medium" onClick={() => setIsOpen(false)}>Contact Us</Link>
          {currentUser ? (
            <div className="space-y-2 pt-2 border-t border-border-low">
              <Link to="/dashboard" className="block px-4 py-2 text-center bg-surface-container text-primary font-semibold rounded-lg" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <button 
                onClick={() => { handleLogout(); setIsOpen(false); }}
                className="w-full px-4 py-2 text-center bg-primary text-on-primary font-semibold rounded-lg"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-2 border-t border-border-low">
              <Link to="/login" className="block text-center text-text-secondary font-semibold py-2" onClick={() => setIsOpen(false)}>Login</Link>
              <Link to="/signup" className="block text-center bg-primary-container text-on-primary font-semibold py-2 rounded-lg" onClick={() => setIsOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut, Home, Building2, Phone } from 'lucide-react';

const Header = () => {
  const { currentUser, logout, userData } = useAuth();
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
    <nav className="sticky top-0 z-40 w-full glass-morphism border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/logo.png" 
              alt="Apna Rooms Logo" 
              className="h-10 w-auto object-contain rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-sm"
            />
            <span className="text-2xl font-extrabold text-primary tracking-tight group-hover:text-accent transition-colors">Apna Rooms</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-primary hover:text-accent transition-colors">Home</Link>
            <Link to="/pgs" className="text-primary hover:text-accent transition-colors">PGs</Link>
            <Link to="/contact" className="text-primary hover:text-accent transition-colors">Contact Us</Link>
            
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="flex items-center space-x-1 text-primary hover:text-accent">
                  <User className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-primary hover:text-accent transition-colors">Login</Link>
                <Link to="/signup" className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-primary p-2">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 py-4 px-4 space-y-4">
          <Link to="/" className="block text-primary" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/pgs" className="block text-primary" onClick={() => setIsOpen(false)}>PGs</Link>
          <Link to="/contact" className="block text-primary" onClick={() => setIsOpen(false)}>Contact Us</Link>
          {currentUser ? (
            <>
              <Link to="/dashboard" className="block text-primary" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <button 
                onClick={handleLogout}
                className="w-full text-left text-primary"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-primary" onClick={() => setIsOpen(false)}>Login</Link>
              <Link to="/signup" className="block bg-accent text-white text-center py-2 rounded-lg" onClick={() => setIsOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Header;

import React from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Shield, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hero-content relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
            Find Your Perfect Stay with <span className="text-accent">Apna Rooms</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience modern living with all amenities. Book a single seat or a complete room in the best PGs across the city.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link 
              to="/pgs" 
              className="bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <Search className="w-5 h-5" />
              <span>Explore PGs</span>
            </Link>
            <Link 
              to="/contact" 
              className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all w-full sm:w-auto text-center"
            >
              List Your Property
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Why Choose Apna Rooms?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-4">Secure & Verified</h3>
              <p className="text-gray-600">All properties and roommates are verified for your safety and peace of mind.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Premium Amenities</h3>
              <p className="text-gray-600">High-speed WiFi, nutritious meals, laundry, and 24/7 security services.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Easy Payments</h3>
              <p className="text-gray-600">Integrated online payments for rent and electricity bills with instant receipts.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

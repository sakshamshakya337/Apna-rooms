import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, ShieldCheck, CreditCard, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 group cursor-pointer">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <Building2 className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tighter">Apna Rooms</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              India's most professional and secure PG management platform. Experience premium living with digital ease and transparent management.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-accent transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-accent transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-accent transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-accent transition-colors">Home</Link></li>
              <li><Link to="/pgs" className="hover:text-accent transition-colors">Browse PGs</Link></li>
              <li><Link to="/login" className="hover:text-accent transition-colors">Member Login</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Support Center</Link></li>
            </ul>
          </div>

          {/* Policy Links (Critical for Payment Gateway) */}
          <div>
            <h4 className="text-lg font-bold mb-6">Legal & Policies</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-accent transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund-cancellation" className="hover:text-accent transition-colors">Refund & Cancellation</Link></li>
              <li><Link to="/shipping-delivery" className="hover:text-accent transition-colors">Shipping & Delivery</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-6">Contact Us</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-accent shrink-0" />
                <span>Sector 62, Noida, Uttar Pradesh, India - 201301</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <span>support@apnarooms.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <span>+91 98765 43210</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment & Security Trust Badges */}
        <div className="border-t border-white/5 py-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-gray-500 text-xs">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>SSL Secured Connection</span>
            </div>
            {/* <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <span>Razorpay Verified Merchant</span>
            </div> */}
          </div>
          <p>© {new Date().getFullYear()} Apna Rooms. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
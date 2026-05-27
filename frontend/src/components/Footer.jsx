import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer className="w-full bg-surface-subtle border-t border-border-low transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center space-x-3 group w-fit">
              <img 
                src={theme === 'dark' ? '/apna_dark.jpg' : '/apna_light.jpg'} 
                alt="Apna Rooms" 
                className="h-8 w-auto object-contain rounded-lg"
              />
              <span className="text-lg font-bold text-primary tracking-tight">Apna Rooms</span>
            </Link>
            <p className="text-text-secondary text-sm max-w-sm leading-relaxed">
              India's most trusted platform for professional PG rentals, managed coliving spaces, and seamless digital utility management.
            </p>
            <div className="flex items-center space-x-2 pt-2 text-xs text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>SSL Secured & Verified Platform</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2">
            <h4 className="font-semibold text-sm text-primary mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-text-secondary text-sm hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/pgs" className="text-text-secondary text-sm hover:text-primary transition-colors">Browse PGs</Link></li>
              <li><Link to="/contact" className="text-text-secondary text-sm hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal / Policies */}
          <div className="md:col-span-2">
            <h4 className="font-semibold text-sm text-primary mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="text-text-secondary text-sm hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="text-text-secondary text-sm hover:text-primary transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund-cancellation" className="text-text-secondary text-sm hover:text-primary transition-colors">Refund Policy</Link></li>
              
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-semibold text-sm text-primary mb-4 uppercase tracking-wider">Newsletter</h4>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="flex-1 bg-surface-main border border-border-low rounded-lg px-3 py-2 text-sm text-on-background focus:ring-1 focus:ring-primary focus:outline-none transition-colors placeholder:text-text-secondary/60"
              />
              <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80">
                Subscribe
              </button>
            </div>
            <div className="space-y-2 pt-2 text-text-secondary text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Sector 62, Noida, Uttar Pradesh, India - 201301</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>support@apnarooms.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="pt-8 border-t border-border-low flex flex-col md:flex-row justify-between items-center text-center gap-4 text-xs text-text-secondary">
          <span>© {new Date().getFullYear()} Apna Rooms. Professional PG Rentals.</span>
          <span>
            Maintained & Developed by{' '}
            <a 
              href="https://sakshamshakya.tech" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold text-primary hover:underline"
            >
              Saksham Shakya
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
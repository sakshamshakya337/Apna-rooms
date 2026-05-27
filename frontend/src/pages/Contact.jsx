import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { toast } from 'react-hot-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaToken) {
      return toast.error('Please complete the captcha verification');
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('contact_queries').insert([formData]);
      if (error) throw error;
      toast.success('Query sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background text-on-background py-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          
          {/* Left Side: Contact Information Cards */}
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Support 24/7 Hotline
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
                Let's craft your <br />
                <span className="text-gradient">perfect stay.</span>
              </h1>
              <p className="text-text-secondary text-sm lg:text-base max-w-md leading-relaxed font-medium">
                Whether you have a question about our properties, need help with your current booking, or simply want to chat about options, our team is always ready to assist.
              </p>
            </div>

            <div className="space-y-4">
              {/* Contact Information Details */}
              <div className="bg-surface-main p-5 border border-border-low rounded-xl flex items-center gap-5 hover:border-outline transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Call Us Direct</p>
                  <p className="text-lg font-bold text-text-primary mt-0.5">+91 98765 43210</p>
                </div>
              </div>

              <div className="bg-surface-main p-5 border border-border-low rounded-xl flex items-center gap-5 hover:border-outline transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Email Support</p>
                  <p className="text-lg font-bold text-text-primary mt-0.5">hello@apnarooms.com</p>
                </div>
              </div>

              <div className="bg-surface-main p-5 border border-border-low rounded-xl flex items-center gap-5 hover:border-outline transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Headquarters</p>
                  <p className="text-base font-bold text-text-primary leading-snug mt-0.5">
                    123 Academic Tower, Sector 45, Noida
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Message Submission Form */}
          <div className="w-full lg:w-1/2">
            <div className="bg-surface-main border border-border-low p-8 rounded-xl shadow-sm space-y-6">
              <h3 className="text-2xl font-bold text-text-primary tracking-tight">Send a Message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 block">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    placeholder="E.g. Priya Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border border-border-low rounded-lg py-3 px-4 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 block">Email Identity</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    placeholder="student@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border border-border-low rounded-lg py-3 px-4 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 block">How can we help?</label>
                  <textarea 
                    name="message"
                    required
                    rows="4"
                    placeholder="I am looking for a single-occupancy room near..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border border-border-low rounded-lg py-3 px-4 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-all text-sm font-semibold resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-center my-4">
                  <Turnstile 
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                    onSuccess={(token) => setCaptchaToken(token)} 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary text-on-primary rounded-lg font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Transmitting...' : 'Send Message'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;

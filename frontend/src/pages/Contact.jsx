import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { toast } from 'react-hot-toast';
import { Mail, Phone, MapPin, Search } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-[#fdf8ff] font-['Manrope'] text-[#342d55] relative overflow-hidden py-32 px-4 md:px-8">
      {/* Immersive Ethereal Background Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-gradient-to-br from-[#4a4bd7] to-[#842cd3] rounded-full blur-[120px] opacity-10"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#006592] rounded-full blur-[100px] opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row gap-16 lg:gap-8 items-center">
        
        {/* Left Side: Editorial Typography & Cards */}
        <div className="lg:w-1/2 w-full space-y-12">
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-[#ffffff]/60 backdrop-blur-xl rounded-full border border-[#f1ebff] text-xs font-bold text-[#4a4bd7] tracking-widest uppercase mb-6 shadow-sm">
              Support 24/7
            </div>
            <h1 className="text-5xl lg:text-7xl font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight leading-[1.05] text-[#0f0b20] mb-6">
              Let's craft your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4a4bd7] to-[#842cd3]">perfect stay.</span>
            </h1>
            <p className="text-lg text-[#615985] max-w-md font-medium leading-relaxed">
              Whether you have a question about our properties, need help with your current booking, or simply want to chat about options, our team is always ready to assist.
            </p>
          </div>

          <div className="space-y-6">
            {/* Contact Cards */}
            <div className="bg-[#ffffff]/60 backdrop-blur-2xl p-6 rounded-[2rem] border border-[#ffffff] shadow-[0_20px_40px_rgba(52,45,85,0.03)] flex items-center space-x-6 group hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-[#f1ebff] rounded-2xl flex items-center justify-center text-[#4a4bd7] group-hover:scale-110 transition-transform shadow-inner">
                <Phone className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-[#a099b4] mb-1">Call Us Direct</p>
                <p className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#0f0b20]">+91 98765 43210</p>
              </div>
            </div>

            <div className="bg-[#ffffff]/60 backdrop-blur-2xl p-6 rounded-[2rem] border border-[#ffffff] shadow-[0_20px_40px_rgba(52,45,85,0.03)] flex items-center space-x-6 group hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-[#f0dbff] rounded-2xl flex items-center justify-center text-[#842cd3] group-hover:scale-110 transition-transform shadow-inner">
                <Mail className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-[#a099b4] mb-1">Email Support</p>
                <p className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#0f0b20]">hello@apnarooms.com</p>
              </div>
            </div>

            <div className="bg-[#ffffff]/60 backdrop-blur-2xl p-6 rounded-[2rem] border border-[#ffffff] shadow-[0_20px_40px_rgba(52,45,85,0.03)] flex items-center space-x-6 group hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-[#f5f9ff] rounded-2xl flex items-center justify-center text-[#006592] group-hover:scale-110 transition-transform shadow-inner">
                <MapPin className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-[#a099b4] mb-1">Visit Headquarters</p>
                <p className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-[#0f0b20] leading-snug">
                  123 Academic Tower<br/>Sector 45, Gurugram
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Floating Ethereal Form */}
        <div className="lg:w-1/2 w-full relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-[#f1ebff] to-[#f0dbff] rounded-[3rem] blur-2xl opacity-50 -z-10"></div>
          
          <div className="bg-[#ffffff]/80 backdrop-blur-3xl p-10 md:p-14 rounded-[3rem] border border-[#ffffff] shadow-[0_30px_60px_rgba(52,45,85,0.06)]">
            <h3 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0f0b20] mb-8">Send a Message</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#615985] ml-2">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  placeholder="E.g. Priya Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#f7f1ff] border-none rounded-[1.5rem] p-5 text-[#342d55] placeholder:text-[#a099b4] focus:ring-0 shadow-inner text-lg transition-colors focus:bg-[#ece4ff]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#615985] ml-2">Email Identity</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder="student@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#f7f1ff] border-none rounded-[1.5rem] p-5 text-[#342d55] placeholder:text-[#a099b4] focus:ring-0 shadow-inner text-lg transition-colors focus:bg-[#ece4ff]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#615985] ml-2">How can we help?</label>
                <textarea 
                  name="message"
                  required
                  rows="4"
                  placeholder="I am looking for a single-occupancy room near..."
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-[#f7f1ff] border-none rounded-[1.5rem] p-5 text-[#342d55] placeholder:text-[#a099b4] focus:ring-0 shadow-inner text-lg transition-colors focus:bg-[#ece4ff] resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-6 py-5 bg-gradient-to-r from-[#4a4bd7] to-[#842cd3] text-white rounded-full font-bold text-xl shadow-[0_15px_30px_rgba(74,75,215,0.25)] hover:shadow-[0_20px_40px_rgba(74,75,215,0.4)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Transmitting...' : 'Send Message'}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;

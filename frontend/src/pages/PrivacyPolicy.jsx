import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, Bell, UserCheck, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-primary p-12 text-white text-center">
          <ShieldCheck className="w-16 h-16 mx-auto mb-6 text-accent" />
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-300">Effective Date: March 17, 2026</p>
        </div>

        <div className="p-12 space-y-8 text-gray-600 leading-relaxed">
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">1. Information We Collect</h2>
            </div>
            <p>
              At Apna Rooms, we collect personal information that you provide to us directly when you register, book a room, or contact us. This includes:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Contact Information (Name, Email, Phone Number, Address)</li>
              <li>KYC Documents (Aadhar Card, University/Office ID, Photos)</li>
              <li>Payment Information (Processed securely via Razorpay)</li>
              <li>Usage Data (IP address, browser type, device information)</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">2. How We Use Your Information</h2>
            </div>
            <p>
              We use the collected information for the following professional purposes:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>To facilitate room bookings and contract management.</li>
              <li>To verify your identity for police verification and security records.</li>
              <li>To process payments and generate invoices/receipts.</li>
              <li>To communicate important updates regarding your stay or billing.</li>
              <li>To improve our platform and provide personalized user experiences.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">3. Information Sharing & Disclosure</h2>
            </div>
            <p>
              We do not sell your personal data. We only share information with:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong>Property Owners:</strong> To manage your stay and room allocation.</li>
              <li><strong>Payment Processors:</strong> Securely sharing data with Razorpay for transaction handling.</li>
              <li><strong>Legal Authorities:</strong> When required by law for police verification or criminal investigations.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <Bell className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">4. Data Security</h2>
            </div>
            <p>
              We implement industry-standard security measures, including SSL encryption and secure database protocols, to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">5. Contact Us</h2>
            </div>
            <p>
              If you have any questions about this Privacy Policy, please contact our Data Protection Officer at:
              <br />
              <strong className="text-primary">Email:</strong> support@apnarooms.com
              <br />
              <strong className="text-primary">Address:</strong> Apna Rooms Headquarters, New Delhi, India
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
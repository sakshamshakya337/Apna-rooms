import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Scale, AlertCircle, CheckCircle2, UserPlus, CreditCard } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-primary p-12 text-white text-center">
          <FileText className="w-16 h-16 mx-auto mb-6 text-accent" />
          <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-gray-300">Last Updated: March 17, 2026</p>
        </div>

        <div className="p-12 space-y-8 text-gray-600 leading-relaxed">
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">1. Agreement to Terms</h2>
            </div>
            <p>
              By accessing and using Apna Rooms, you agree to be bound by these Terms and Conditions. These terms govern your use of our website, mobile application, and the PG booking services provided by us.
            </p>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">2. User Eligibility</h2>
            </div>
            <p>
              You must be at least 18 years of age to book a room through Apna Rooms. By creating an account, you represent that all information provided is accurate and complete. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">3. Booking & Payments</h2>
            </div>
            <p>
              Bookings are subject to availability and confirmation.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Users must pay the booking amount (Full or 50% as per chosen plan) to secure a room.</li>
              <li>Monthly rent and electricity bills must be paid by the due date mentioned in the dashboard.</li>
              <li>Failure to pay rent on time may result in penalties or termination of the stay contract.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">4. KYC & Verification</h2>
            </div>
            <p>
              Professional conduct requires identity verification.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>All tenants must upload valid KYC documents (Aadhar, ID card, Photo).</li>
              <li>Apna Rooms reserves the right to share these documents with local law enforcement for mandatory police verification.</li>
              <li>Bookings may be cancelled if documents are found to be fraudulent or incomplete.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">5. Termination</h2>
            </div>
            <p>
              We reserve the right to terminate or suspend your account and access to our services at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users or property management.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsAndConditions;
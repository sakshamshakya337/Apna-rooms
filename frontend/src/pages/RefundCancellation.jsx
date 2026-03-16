import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, XCircle, Clock, IndianRupee, HelpCircle, ShieldAlert } from 'lucide-react';

const RefundCancellation = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-primary p-12 text-white text-center">
          <RefreshCcw className="w-16 h-16 mx-auto mb-6 text-accent" />
          <h1 className="text-4xl font-bold mb-4">Refund & Cancellation</h1>
          <p className="text-gray-300">Effective Date: March 17, 2026</p>
        </div>

        <div className="p-12 space-y-8 text-gray-600 leading-relaxed">
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <XCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">1. Cancellation Policy</h2>
            </div>
            <p>
              Users can cancel their booking through the dashboard or by contacting support.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong>Cancellation within 24 hours:</strong> 100% refund of the booking amount.</li>
              <li><strong>Cancellation after 24 hours but before check-in:</strong> 50% refund of the booking amount.</li>
              <li><strong>Cancellation after check-in:</strong> No refund of the booking amount or first month's rent.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">2. Refund Process</h2>
            </div>
            <p>
              Approved refunds are processed back to the original payment method used via Razorpay.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Refund requests are typically processed within 5-7 business days.</li>
              <li>The time taken for the amount to reflect in your account depends on your bank's policies.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">3. Security Deposit Refund</h2>
            </div>
            <p>
              The security deposit is fully refundable at the end of the contract stay, provided:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>There is no damage to the property or room inventory.</li>
              <li>All pending electricity bills and dues are cleared.</li>
              <li>The tenant has provided the mandatory notice period (usually 30 days) before moving out.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">4. Late Payments</h2>
            </div>
            <p>
              Late payments for rent or bills are not eligible for refunds. Penalties incurred due to late payments are also non-refundable.
            </p>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">5. Contact for Support</h2>
            </div>
            <p>
              For any refund or cancellation queries, please raise a ticket in the "Complaints" section of your dashboard or email us at <strong className="text-primary">billing@apnarooms.com</strong>.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default RefundCancellation;
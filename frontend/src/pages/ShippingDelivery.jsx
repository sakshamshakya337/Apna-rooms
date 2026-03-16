import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Home, MapPin, Calendar, CheckCircle, Info } from 'lucide-react';

const ShippingDelivery = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-primary p-12 text-white text-center">
          <Truck className="w-16 h-16 mx-auto mb-6 text-accent" />
          <h1 className="text-4xl font-bold mb-4">Shipping & Delivery</h1>
          <p className="text-gray-300">Effective Date: March 17, 2026</p>
        </div>

        <div className="p-12 space-y-8 text-gray-600 leading-relaxed">
          <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <div className="flex items-center space-x-3 mb-2">
              <Info className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-blue-900">Service Based Delivery</h2>
            </div>
            <p className="text-blue-800 opacity-80">
              Apna Rooms provides digital services for PG room bookings and management. As we do not ship physical products, our "Delivery" refers to the fulfillment of your digital booking and access to physical property premises.
            </p>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">1. Booking Fulfillment</h2>
            </div>
            <p>
              Upon successful payment of the booking amount:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>You will receive an instant confirmation on your dashboard.</li>
              <li>A digital rent receipt and booking confirmation will be sent to your registered email address within 5 minutes.</li>
              <li>Your room status will be updated to "Occupied" in our system.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">2. Check-in & Physical Access</h2>
            </div>
            <p>
              The "delivery" of physical room access happens on your scheduled check-in date.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Tenants must carry their original ID proof used during KYC for verification at the property.</li>
              <li>Keys/Access cards will be handed over by the PG warden/manager upon successful physical verification.</li>
              <li>Physical check-in is available between 9:00 AM and 8:00 PM on the check-in date.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <MapPin className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">3. Service Location</h2>
            </div>
            <p>
              Services are currently limited to the specific PG locations listed on the Apna Rooms platform across various cities in India. Delivery of service is restricted to the specific room and property chosen during the booking process.
            </p>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-accent">
                <Home className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-primary">4. Digital Documents</h2>
            </div>
            <p>
              All invoices, electricity bills, and rent receipts are delivered digitally through the user dashboard. Tenants can download these documents at any time during their active contract period.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default ShippingDelivery;
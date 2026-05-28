import React from 'react';
import { motion } from 'framer-motion';
import { Truck, PackageCheck, MapPin, Clock } from 'lucide-react';

const ShippingDelivery = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Shipping & Delivery Policy
          </h1>
          <p className="text-lg text-gray-600">
            Apna Rooms - PG Accommodation Management
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
        >
          <div className="space-y-10">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Truck className="w-7 h-7 mr-3 text-blue-600" />
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                This Shipping & Delivery Policy applies to Apna Rooms, a platform facilitating Paying Guest (PG) 
                accommodation bookings. Please note that Apna Rooms primarily provides accommodation services 
                and does not ship physical products. This policy outlines our procedures related to service 
                delivery, booking confirmations, and any physical items that may be associated with your stay.
              </p>
            </section>

            {/* Service Delivery Timeline */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Clock className="w-7 h-7 mr-3 text-blue-600" />
                Service Delivery Timeline
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <strong>Booking Confirmation:</strong> Instant digital confirmation sent to your registered email upon successful payment.
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <strong>Check-in Process:</strong> You may check in to your PG accommodation on the agreed-upon date as per your booking details.
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <strong>Room Allocation:</strong> Room allocation is completed on the day of check-in by the PG owner/manager.
                </li>
              </ul>
            </section>

            {/* Physical Items (if any) */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <PackageCheck className="w-7 h-7 mr-3 text-blue-600" />
                Physical Items & Amenities
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Any physical amenities or items provided as part of your PG accommodation (such as keys, access 
                cards, bed linens, etc.) will be delivered to you in person during the check-in process at the 
                PG property.
              </p>
            </section>

            {/* Contact for Queries */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <MapPin className="w-7 h-7 mr-3 text-blue-600" />
                Contact for Delivery Queries
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions regarding your booking, check-in process, or amenities, please 
                contact us through our Contact page or reach out to the PG owner/manager directly using 
                the contact details provided in your booking confirmation.
              </p>
            </section>

            {/* Policy Updates */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Policy Updates
              </h2>
              <p className="text-gray-700">
                We reserve the right to update or modify this Shipping & Delivery Policy at any time without 
                prior notice. Changes will be effective immediately upon posting to the website. Your continued 
                use of the platform after any changes constitutes your acceptance of the revised policy.
              </p>
              <p className="text-gray-500 text-sm mt-4">
                Last updated: {new Date().toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShippingDelivery;

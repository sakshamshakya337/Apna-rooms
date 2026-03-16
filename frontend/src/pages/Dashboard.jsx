import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  MessageSquare, 
  CreditCard, 
  User, 
  Settings, 
  ChevronRight,
  PlusCircle,
  FileText,
  ShieldCheck,
  Building2,
  IndianRupee,
  Download
} from 'lucide-react';
import ElectricityBill from '../components/ElectricityBill';
import Complaints from '../components/Complaints';
import Payments from '../components/Payments';
import AdminPanel from '../components/AdminPanel';
import Profile from '../components/Profile';
import { motion } from 'framer-motion';
import { generateRentReceiptPDF } from '../utils/pdfUtils';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin' || userData?.role === 'sub_admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin' : 'overview');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchUserBooking();
    }

    const handleChangeTab = (e) => {
      setActiveTab(e.detail);
    };

    window.addEventListener('changeTab', handleChangeTab);
    return () => window.removeEventListener('changeTab', handleChangeTab);
  }, [currentUser]);

  const fetchUserBooking = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          pgs:pg_id (name, address, city),
          rooms:room_id (room_number, total_seats, available_seats)
        `)
        .eq('user_id', currentUser.uid)
        .eq('status', 'confirmed')
        .maybeSingle();
      
      if (data) setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const userMenuItems = [
    { id: 'overview', icon: User, label: 'Overview' },
    { id: 'profile', icon: Settings, label: 'My Profile' },
    { id: 'bills', icon: Zap, label: 'Electricity Bills' },
    { id: 'complaints', icon: MessageSquare, label: 'Complaints' },
    { id: 'payments', icon: CreditCard, label: 'Rent Payments' },
  ];

  const adminMenuItems = [
    { id: 'admin', icon: Settings, label: 'Admin Dashboard' },
    { id: 'pgs', icon: Building2, label: 'Manage PGs' },
    { id: 'revenue', icon: IndianRupee, label: 'Manage Revenue' },
    { id: 'bills_admin', icon: Zap, label: 'Manage Bills' },
    { id: 'complaints_admin', icon: MessageSquare, label: 'Manage Complaints' },
    { id: 'team', icon: ShieldCheck, label: 'Manage Team' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-accent text-white shadow-lg shadow-blue-200' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.id ? 'rotate-90' : ''}`} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-grow">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[600px]"
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold">Welcome, {userData?.full_name}!</h2>
                  <div className="px-4 py-2 bg-blue-50 text-accent rounded-full text-sm font-bold uppercase tracking-wider">
                    {userData?.role || 'User'}
                  </div>
                </div>

                {booking ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-accent" />
                        Current Booking
                      </h3>
                      <div className="space-y-2 text-gray-600">
                        <p><span className="font-medium text-primary">PG Name:</span> {booking.pgs?.name}</p>
                        <p><span className="font-medium text-primary">Room Number:</span> {booking.rooms?.room_number}</p>
                        <p><span className="font-medium text-primary">Location:</span> {booking.pgs?.city}</p>
                        <p><span className="font-medium text-primary">Rent:</span> ₹{booking.amount}</p>
                        <p><span className="font-medium text-primary">Next Payment:</span> April 1, 2026</p>
                      </div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold flex items-center text-green-800">
                          <Zap className="w-5 h-5 mr-2 text-green-600" />
                          Payment Status
                        </h3>
                        <button 
                          onClick={() => generateRentReceiptPDF(booking, userData, booking.pgs)}
                          className="p-2 bg-white text-green-600 rounded-lg shadow-sm hover:bg-green-100 transition-all border border-green-200"
                          title="Download Receipt"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-2 text-green-800">
                        <p>All clear! Your booking is confirmed.</p>
                        <p className="text-sm opacity-80">Booking Date: {new Date(booking.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <PlusCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">No active bookings found</h3>
                    <p className="text-gray-500 mb-6">Start your journey by finding the perfect PG!</p>
                    <button 
                      onClick={() => navigate('/pgs')}
                      className="bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all"
                    >
                      Browse PGs
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bills' && <ElectricityBill booking={booking} userData={userData} />}
            {activeTab === 'complaints' && <Complaints booking={booking} userData={userData} />}
            {activeTab === 'payments' && <Payments booking={booking} userData={userData} />}
            {activeTab === 'profile' && <Profile />}
            {isAdmin && (activeTab === 'admin' || activeTab === 'team' || activeTab === 'pgs' || activeTab === 'bills_admin' || activeTab === 'complaints_admin' || activeTab === 'revenue') && (
              <AdminPanel section={activeTab} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

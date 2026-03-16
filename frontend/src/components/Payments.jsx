import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { CreditCard, IndianRupee, CheckCircle2, AlertCircle, Clock, Download } from 'lucide-react';
import { loadRazorpay, createRazorpayOrder, verifyPaymentOnBackend } from '../utils/razorpay';
import { generatePaymentReceiptPDF } from '../utils/pdfUtils';
import { toast } from 'react-hot-toast';

const Payments = ({ booking }) => {
  const { userData } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (booking?.id) {
      fetchPayments();
    }
  }, [booking]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          bookings (
            *,
            pgs (name, address, city),
            rooms (room_number)
          )
        `)
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayRent = async (type = 'user_rent') => {
    if (!booking) {
      toast.error('No active booking found to pay rent for.');
      return;
    }

    const res = await loadRazorpay();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      return;
    }

    // Ensure amount is valid
    const rentAmount = type === 'user_rent' ? booking.amount : (booking.amount * (booking.rooms?.total_seats || 1));
    
    if (!rentAmount || isNaN(rentAmount) || rentAmount <= 0) {
      toast.error('Invalid rent amount. Please check your booking details.');
      console.error('Invalid amount:', rentAmount, 'Booking:', booking);
      return;
    }
    
    try {
      const order = await createRazorpayOrder(rentAmount, 'INR', booking.id.slice(0, 30));

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Apna Rooms',
        description: `${type === 'user_rent' ? 'Individual' : 'Room'} Rent Payment`,
        order_id: order.id,
        handler: async (response) => {
          // Verify payment on backend
          try {
            await verifyPaymentOnBackend({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_details: {
                booking_id: booking.id,
                amount: rentAmount,
                type: type,
                status: 'success'
              }
            });
            
            toast.success('Payment successful and verified!');
            fetchPayments();
          } catch (error) {
            console.error('Verification Error:', error);
            toast.error('Payment successful but verification failed. Please contact support.');
          }
        },
        prefill: {
          name: userData?.full_name || '',
          email: userData?.email || '',
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Order Creation Error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to initiate payment. Please check if the backend server is running.';
      toast.error(errorMsg);
    }
  };

  const handleDownload = (payment) => {
    try {
      const loadingToast = toast.loading('Generating your receipt...');
      
      // Handle potential array structure from Supabase joins
      const bookingData = Array.isArray(payment.bookings) ? payment.bookings[0] : payment.bookings;
      const pgData = bookingData?.pgs || booking?.pgs;
      
      generatePaymentReceiptPDF(payment, userData, pgData, bookingData || booking);
      
      toast.dismiss(loadingToast);
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      toast.dismiss(); 
      toast.error(`Error: ${error.message}`);
      console.error('Download Error:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading payment history...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Rent Payments</h2>
          <p className="text-gray-500">Manage your monthly rent and view payment history</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => handlePayRent('user_rent')}
            className="bg-accent text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg"
          >
            Pay My Rent
          </button>
          <button 
            onClick={() => handlePayRent('room_rent')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg"
          >
            Pay Room Rent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {payments.map((payment) => (
          <div key={payment.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${payment.status === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <IndianRupee className={`w-6 h-6 ${payment.status === 'success' ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h4 className="font-bold text-lg">₹{payment.amount}</h4>
                <p className="text-sm text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                    payment.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {payment.status}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">ID: {payment.payment_id?.slice(0, 10)}...</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleDownload(payment)}
              className="p-3 text-gray-400 hover:text-accent transition-colors"
              title="Download Receipt"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {payments.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">No payment history</h3>
          <p className="text-gray-500">Your future payments will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default Payments;

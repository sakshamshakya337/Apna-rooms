import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Shield, CheckCircle, ArrowRight, Upload, Loader2 } from 'lucide-react';
import { loadRazorpay, createRazorpayOrder, verifyPaymentOnBackend } from '../utils/razorpay';
import { toast } from 'react-hot-toast';
import { compressImage } from '../utils/imageUtils';

const BookingConfirmation = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');
  const bookingType = searchParams.get('type');
  const paymentPlan = searchParams.get('plan') || 'full';
  const contractDuration = parseInt(searchParams.get('duration') || '1');
  
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  
  const [pg, setPg] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [files, setFiles] = useState({
    userPhoto: null,
    universityId: null,
    aadharFront: null,
    aadharBack: null
  });

  useEffect(() => {
    fetchDetails();
  }, [id, roomId]);

  const fetchDetails = async () => {
    try {
      const { data: pgData } = await supabase.from('pgs').select('*').eq('id', id).single();
      const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      setPg(pgData);
      setRoom(roomData);
    } catch (error) {
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const getPricing = () => {
    if (!room || !pg) return { rent: 0, deposit: 0, total: 0, payableNow: 0 };
    
    const basePrice = Number(room.price_per_seat);
    const rent = bookingType === 'single' ? basePrice : (basePrice * Number(room.total_seats));
    const deposit = Number(pg?.security_deposit ?? 2000);
    const bookingAmount = paymentPlan === 'half' ? (rent / 2) : rent;
    
    return {
      rent,
      deposit,
      total: rent + deposit,
      payableNow: bookingAmount + deposit
    };
  };

  const pricing = getPricing();

  const handlePayment = async () => {
    const res = await loadRazorpay();
    if (!res) return toast.error('Razorpay failed to load');

    setProcessing(true);
    
    try {
      // First, create a pending booking in Supabase to get a booking ID
      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          user_id: currentUser.uid,
          pg_id: pg.id,
          room_id: room.id,
          amount: pricing.total, // Total actual booking value
          paid_amount: pricing.payableNow, // Amount paid now
          type: bookingType,
          payment_plan: paymentPlan,
          contract_months: contractDuration,
          status: 'pending'
        }])
        .select()
        .single();
      
      if (bookingError) throw bookingError;
      setBookingId(newBooking.id);

      const order = await createRazorpayOrder(pricing.payableNow, 'INR', newBooking.id.slice(0, 30));
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Apna Rooms',
        description: `Booking for ${pg.name} - Room ${room.room_number}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await verifyPaymentOnBackend({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_details: {
                booking_id: newBooking.id,
                amount: pricing.payableNow,
                type: 'initial_booking'
              }
            });
            setPaymentSuccess(true);
            toast.success('Booking Confirmed!');
          } catch (err) {
            toast.error('Verification failed. Contact support.');
          }
        },
        prefill: {
          name: userData?.full_name,
          email: currentUser?.email
        },
        theme: { color: '#3b82f6' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error('Payment initialization failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = (e, type) => {
    setFiles({ ...files, [type]: e.target.files[0] });
  };

  const finalizeBooking = async () => {
    if (!files.userPhoto || !files.universityId || !files.aadharFront || !files.aadharBack) {
      return toast.error('Please upload all required documents');
    }
    
    setProcessing(true);
    try {
      // Create a folder for this user/booking
      const folderPath = `kyc/${currentUser.uid}/${bookingId || id}`;

      const uploadTasks = Object.entries(files).map(async ([key, file]) => {
        // Compress document if it's an image
        let uploadFile = file;
        if (file.type.startsWith('image/')) {
          uploadFile = await compressImage(file, 2); // 2MB limit
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${key}_${Date.now()}.${fileExt}`;
        const filePath = `${folderPath}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('kyc-documents')
          .upload(filePath, uploadFile);

        if (error) throw error;
        
        // Return key-value pair for database update
        const columnMapping = {
          userPhoto: 'user_photo_url',
          universityId: 'university_id_url',
          aadharFront: 'aadhar_front_url',
          aadharBack: 'aadhar_back_url'
        };
        
        return { [columnMapping[key]]: filePath };
      });

      const results = await Promise.all(uploadTasks);
      const updateData = Object.assign({}, ...results);
      
      // Update booking with document paths
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          ...updateData,
          status: 'confirmed'
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      toast.success('Documents uploaded and booking confirmed!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload documents. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-primary p-8 text-white">
          <h1 className="text-3xl font-bold">Review & Pay</h1>
          <p className="opacity-80">Complete your booking for {pg.name}</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">Booking Details</h3>
              <div className="flex justify-between text-gray-600">
                <span>Room Number</span>
                <span className="font-medium text-primary">{room.room_number}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Booking Type</span>
                <span className="font-medium capitalize text-primary">{bookingType}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Address</span>
                <span className="font-medium text-primary text-right max-w-[200px]">{pg.address}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Contract Duration</span>
                <span className="font-bold text-primary">{contractDuration} {contractDuration === 12 ? 'Year' : (contractDuration === 1 ? 'Month' : 'Months')}</span>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 p-6 rounded-2xl">
              <h3 className="font-bold text-lg border-b pb-2 text-primary">Price Breakdown</h3>
              <div className="flex justify-between text-gray-600">
                <span>Rent ({paymentPlan === 'half' ? '50% Booking' : 'Full'})</span>
                <span>₹{paymentPlan === 'half' 
                  ? (bookingType === 'single' ? room.price_per_seat / 2 : (room.price_per_seat * room.total_seats) / 2)
                  : (bookingType === 'single' ? room.price_per_seat : room.price_per_seat * room.total_seats)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Security Deposit</span>
                <span>₹{pg.security_deposit || 2000}</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-4 border-t text-accent">
                <span>Payable Now</span>
                <span>₹{(paymentPlan === 'half' 
                  ? (bookingType === 'single' ? room.price_per_seat / 2 : (room.price_per_seat * room.total_seats) / 2)
                  : (bookingType === 'single' ? room.price_per_seat : room.price_per_seat * room.total_seats)) + (pg.security_deposit || 2000)}</span>
              </div>
              {paymentPlan === 'half' && (
                <p className="text-[10px] text-gray-400 mt-2 italic">Remaining 50% rent will be collected at check-in.</p>
              )}
            </div>
          </div>

          {!paymentSuccess ? (
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-accent text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {processing ? <Loader2 className="animate-spin" /> : <Shield className="w-5 h-5" />}
              <span>{processing ? 'Processing...' : 'Pay with Razorpay'}</span>
            </button>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex items-center space-x-4">
                <div className="bg-green-500 p-2 rounded-full text-white">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-green-800">Payment Successful!</h4>
                  <p className="text-green-600 text-sm">Please upload your documents to finalize the booking for police verification.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold">Police Verification Documents</h3>
                  <p className="text-sm text-gray-500 mt-1 italic text-red-500">Note: Please upload your latest photo and valid documents. All images are compressed automatically.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Your Latest Photo', key: 'userPhoto', instruction: 'Clear face photo for records' },
                    { label: 'University ID Card', key: 'universityId', instruction: 'Front side of your ID' },
                    { label: 'Aadhar Card (Front)', key: 'aadharFront', instruction: 'Front side of Aadhar' },
                    { label: 'Aadhar Card (Back)', key: 'aadharBack', instruction: 'Back side of Aadhar' }
                  ].map((doc) => (
                    <div key={doc.key} className="relative border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-accent transition-colors group">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, doc.key)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-accent" />
                      <span className="text-sm font-bold text-primary block">{files[doc.key]?.name || doc.label}</span>
                      <span className="text-[10px] text-gray-400 mt-1 block uppercase tracking-tighter">{doc.instruction}</span>
                      {files[doc.key] && <span className="text-[10px] text-green-600 font-bold mt-1 block">READY TO UPLOAD</span>}
                    </div>
                  ))}
                </div>
                <button
                  onClick={finalizeBooking}
                  disabled={processing}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="animate-spin" /> : null}
                  <span>{processing ? 'Uploading Documents...' : 'Finalize Booking'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;

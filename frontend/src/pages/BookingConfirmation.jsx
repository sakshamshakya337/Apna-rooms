import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Shield, CheckCircle, ArrowRight, Upload, Loader2, FileText, Download } from 'lucide-react';
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
  const [offlinePending, setOfflinePending] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [files, setFiles] = useState({
    userPhoto: null,
    universityId: null,
    aadharPancard: null,
    aadharBack: null,
    parentAadhar: null,
    passport: null,
    viduDoc: null,
    policeVerification: null
  });

  const [docRequirements, setDocRequirements] = useState([]);
  const [dynamicFiles, setDynamicFiles] = useState({});
  const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];

  const hasActiveBookingForAnotherUser = (roomData) => {
    return roomData?.bookings?.some((booking) => {
      return ACTIVE_BOOKING_STATUSES.includes(booking.status) && booking.user_id !== currentUser?.uid;
    });
  };

  const isRoomSoldOut = (roomData) => {
    return hasActiveBookingForAnotherUser(roomData);
  };

  const getMissingProfileFields = () => {
    const category = userData?.student_category || userData?.studentCategory || 'National';
    const missing = [];

    if (!userData?.fullName?.trim()) missing.push('full name');
    if (!userData?.student_category && !userData?.studentCategory) missing.push('student origin classification');
    if (!userData?.phoneNumber?.trim()) missing.push('resident phone number');
    if (category.toLowerCase() !== 'international' && !userData?.parentPhoneNumber?.trim()) {
      missing.push('parent/guardian phone number');
    }
    if (!userData?.address?.trim()) missing.push('home address');
    if (!userData?.city?.trim()) missing.push('city');
    if (!userData?.state?.trim()) missing.push('state');

    return missing;
  };

  const ensureProfileComplete = () => {
    const missingProfileFields = getMissingProfileFields();
    if (missingProfileFields.length > 0) {
      toast.error(`Complete profile first: ${missingProfileFields.join(', ')}`);
      navigate('/dashboard?tab=profile');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (userData) {
      ensureProfileComplete();
    }
  }, [userData]);

  useEffect(() => {
    fetchDetails();
  }, [id, roomId]);

  const fetchDetails = async () => {
    try {
      const { data: pgData } = await supabase.from('pgs').select('*').eq('id', id).single();
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('id, status, user_id')
        .eq('room_id', roomId)
        .in('status', ACTIVE_BOOKING_STATUSES);

      const enrichedRoom = roomData ? { ...roomData, bookings: bookingData || [] } : null;

      if (!enrichedRoom || isRoomSoldOut(enrichedRoom)) {
        toast.error('This room is sold out.');
        navigate(`/pg/${id}`);
        return;
      }

      setPg(pgData);
      setRoom(enrichedRoom);

      // Fetch dynamic document requirements for this PG
      const { data: reqs } = await supabase
        .from('pg_document_requirements')
        .select('*')
        .eq('pg_id', id);
      setDocRequirements(reqs || []);
      
    } catch (error) {
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const getPricing = () => {
    if (!room || !pg) return { rent: 0, deposit: 0, total: 0, payableNow: 0, monthlyRent: 0 };
    
    // contractDuration is either 6 or 12
    const duration = contractDuration || 6;
    const monthlyRent = Number(room.price_per_seat); // Full room rent
    const totalRentForContract = monthlyRent * duration;
    
    // Security deposit is strictly 1 month rent
    const deposit = monthlyRent;
    
    // Calculate payable amount based on payment plan
    const payableNow = paymentPlan === 'monthly' 
      ? monthlyRent + deposit 
      : totalRentForContract + deposit;
    
    return {
      monthlyRent,
      rent: totalRentForContract,
      deposit,
      total: totalRentForContract + deposit,
      payableNow
    };
  };

  const pricing = getPricing();

  const createPendingBooking = async () => {
    const { data: latestRoom, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', room.id)
      .single();

    if (roomError) throw roomError;

    const { data: latestBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, status, user_id')
      .eq('room_id', room.id)
      .in('status', ACTIVE_BOOKING_STATUSES);

    if (bookingsError) throw bookingsError;

    const latestRoomState = { ...latestRoom, bookings: latestBookings || [] };
    if (isRoomSoldOut(latestRoomState)) {
      throw new Error('This room has already been booked.');
    }

    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        user_id: currentUser.uid,
        pg_id: pg.id,
        room_id: room.id,
        amount: pricing.total,
        paid_amount: 0,
        type: bookingType,
        status: 'pending',
        payment_plan: paymentPlan,
        contract_months: contractDuration
      }])
      .select()
      .single();
    
    if (bookingError) throw bookingError;

    const { error: roomUpdateError } = await supabase
      .from('rooms')
      .update({ available_seats: 0 })
      .eq('id', room.id);

    if (roomUpdateError) throw roomUpdateError;
    return newBooking;
  };

  const handlePayment = async () => {
    if (!ensureProfileComplete()) return;

    const res = await loadRazorpay();
    if (!res) return toast.error('Razorpay failed to load');

    setProcessing(true);
    
    try {
      const newBooking = await createPendingBooking();
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
            toast.success('Booking confirmed. Documents unlock after admin verification.');
          } catch (err) {
            toast.error('Verification failed. Contact support.');
          }
        },
        prefill: {
          name: userData?.fullName,
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

  const handleOfflinePayment = async () => {
    if (!ensureProfileComplete()) return;

    setProcessing(true);
    try {
      const newBooking = await createPendingBooking();
      setBookingId(newBooking.id);
      setPaymentSuccess(true);
      setOfflinePending(true);
      toast.success('Offline booking registered. Pending Admin Approval.');
    } catch (error) {
      console.error('Offline booking error:', error);
      toast.error('Failed to initiate offline booking: ' + (error.message || ''));
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error('File size strictly limited to 1MB. Please compress and retry.');
        return;
      }
      setFiles({ ...files, [type]: file });
    }
  };

  const finalizeBooking = async () => {
    if (!bookingId) {
      return toast.error('Please complete the booking step before uploading documents.');
    }

    const isInternational = (userData?.studentCategory || userData?.student_category || 'National').toLowerCase() === 'international';
    
    const requiredFiles = isInternational
      ? ['userPhoto', 'passport', 'viduDoc', 'universityId']
      : ['userPhoto', 'aadharPancard', 'parentAadhar', 'universityId'];

    const missingFiles = requiredFiles.filter(key => !files[key]);
    if (missingFiles.length > 0) {
      return toast.error(`Please upload all required: ${missingFiles.join(', ')}`);
    }
    
    setProcessing(true);
    try {
      // Create a folder for this user/booking
      const folderPath = `kyc/${currentUser.uid}/${bookingId || id}`;

      const uploadTasks = Object.entries(files).map(async ([key, file]) => {
        if (!file) return null;
        
        // Final size check
        if (file.size > 1.1 * 1024 * 1024) throw new Error(`${key} exceeds 1MB limit`);

        // Compress image further if possible
        let uploadFile = file;
        if (file.type.startsWith('image/')) {
          uploadFile = await compressImage(file, 0.9); // Target 0.9MB to be safe
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
          aadharPancard: 'aadhar_pancard_url',
          aadharBack: 'aadhar_back_url',
          parentAadhar: 'parent_aadhar_url',
          passport: 'passport_url',
          viduDoc: 'vidu_doc_url',
          policeVerification: 'police_verification_url'
        };
        
        return { [columnMapping[key]]: filePath };
      });

      const results = await Promise.all(uploadTasks.filter(t => t !== null));
      const updateData = Object.assign({}, ...results);
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);
      
      if (updateError) throw updateError;

      // === NEW: Dynamic Document Uploads ===
      const dynamicUploadTasks = Object.entries(dynamicFiles).map(async ([reqId, file]) => {
        if (!file) return null;
        
        const requirement = docRequirements.find(r => r.id === reqId);
        const fileExt = file.name.split('.').pop();
        const fileName = `dynamic_${reqId}_${Date.now()}.${fileExt}`;
        const filePath = `kyc/${currentUser.uid}/${bookingId || id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('kyc-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from('booking_documents')
          .insert([{
            booking_id: bookingId,
            requirement_id: reqId,
            document_name: requirement?.document_name || 'Additional Doc',
            uploaded_url: publicUrl,
            status: 'pending'
          }]);

        if (insertError) throw insertError;
        return true;
      });

      await Promise.all(dynamicUploadTasks.filter(t => t !== null));
      // ======================================

      toast.success('Documents uploaded successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-text-primary">Loading booking system...</div>;

  const isInternational = (userData?.studentCategory || userData?.student_category || 'National').toLowerCase() === 'international';
  const showInlineDocumentUpload = false;

  return (
    <div className="font-body-md text-text-primary antialiased bg-background min-h-screen">
      <main className="pt-24 pb-xl max-w-[1280px] mx-auto px-margin-desktop min-h-screen">
        
        {/* Header Banner */}
        <div className="mb-12">
          <h1 className="font-headline-xl text-4xl font-bold mb-2 text-on-background tracking-tight">Review & Pay</h1>
          <p className="text-on-surface-variant font-body-md max-w-xl">
            Finalizing your stay at {pg.name}. Please review your stay summary and financial details before proceeding to checkout.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden border border-outline-variant/30 shadow-2xl">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-primary to-primary-container px-10 py-10 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-on-primary-container text-on-primary text-xs font-medium mb-4">
                  <Shield className="w-4 h-4" />
                  RESERVATION PENDING
                </div>
                <h2 className="text-3xl font-bold">{pg.name} - Room {room.room_number}</h2>
                <div className="flex items-center gap-4 mt-2 text-primary-fixed/80">
                  <span className="flex items-center gap-1 text-sm">
                    {pg.city}, {pg.state}
                  </span>
                  <span className="flex items-center gap-1 text-sm uppercase">
                    {pg.accommodation_type}
                  </span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                <span className="block text-white/60 text-xs font-medium uppercase mb-1">Contract Duration</span>
                <span className="text-white text-2xl font-bold">{contractDuration} Months</span>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 bg-surface-dim">
            {/* Left Column: Stay Summary */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-surface-container-highest rounded-lg">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-on-surface">Stay Summary</h3>
              </div>
              
              <div className="space-y-1 bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden">
                <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Room Profile</span>
                  <span className="text-on-surface font-semibold">Room {room.room_number}</span>
                </div>
                <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Property Type</span>
                  <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-md text-xs font-bold uppercase tracking-widest">{pg.accommodation_type}</span>
                </div>
                <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Location</span>
                  <span className="text-on-surface font-semibold">{pg.city}</span>
                </div>
                <div className="flex justify-between items-center px-6 py-5">
                  <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Contract Type</span>
                  <span className="text-on-surface font-semibold">Fixed Term</span>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-surface-container-low rounded-2xl border-l-4 border-primary">
                <p className="text-on-surface-variant text-sm italic">
                  "By proceeding, you agree to the community guidelines and the property's maintenance policies as outlined in the digital lease."
                </p>
              </div>
            </section>

            {/* Right Column: Financial Statement */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-surface-container-highest rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-on-surface">Financial Statement</h3>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-medium">Monthly Room Rent</span>
                  <span className="font-bold text-on-surface">₹{pricing.monthlyRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-medium">Security Deposit (Refundable)</span>
                  <span className="font-bold text-on-surface">₹{pricing.deposit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t border-outline-variant/10 pt-4">
                  <span className="text-on-surface-variant font-medium">Payment Option</span>
                  <span className="font-bold text-on-surface">{paymentPlan === 'monthly' ? 'Month-wise' : 'Full Upfront'}</span>
                </div>
                <div className="pt-6 mt-6 border-t border-outline-variant border-dashed">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="block text-2xl font-bold text-on-surface">Amount Due Now</span>
                      <span className="text-xs text-primary font-bold uppercase tracking-[0.2em]">{paymentPlan === 'monthly' ? '1st Month Rent + Security' : 'Total Rent + Security'}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-4xl font-bold text-primary-container leading-none">₹{pricing.payableNow.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Action Bar */}
          {!paymentSuccess ? (
            <div className="p-8 md:p-12 bg-surface-container-high border-t border-outline-variant/20">
              <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
                <button 
                  onClick={handlePayment}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all group disabled:opacity-50"
                >
                  {processing ? <Loader2 className="animate-spin" /> : <ArrowRight className="group-hover:translate-x-1 transition-transform" />}
                  {processing ? 'Processing...' : 'Digital Checkout'}
                </button>
                <button 
                  onClick={handleOfflinePayment}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-transparent border-2 border-outline-variant text-on-surface rounded-2xl font-bold text-lg hover:bg-surface-container-highest transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Offline Reserve'}
                </button>
              </div>
              <p className="text-center mt-6 text-on-surface-variant text-sm">
                Secure 256-bit SSL encrypted payment gateway
              </p>
            </div>
          ) : (
            <div className="p-8 md:p-12 bg-surface-container-high border-t border-outline-variant/20 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className={`p-8 rounded-[2.5rem] flex items-center space-x-6 border-2 ${offlinePending ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                <div className={`p-4 rounded-3xl ${offlinePending ? 'bg-amber-500' : 'bg-green-500'} shadow-lg shadow-black/20`}>
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className={`text-2xl font-black ${offlinePending ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                    {offlinePending ? 'Slot Reserved!' : 'Transaction Approved!'}
                  </h4>
                  <p className="text-on-surface-variant font-medium mt-1">
                    Documents can be uploaded from your dashboard after admin confirmation.
                  </p>
                </div>
              </div>

              <div className="bg-surface-container border border-outline-variant/30 p-8 rounded-[2.5rem] text-center space-y-5">
                <Shield className="w-12 h-12 text-primary mx-auto" />
                <div>
                  <h3 className="text-2xl font-bold text-on-surface">KYC will open in your dashboard</h3>
                  <p className="text-on-surface-variant mt-2">
                    Admin must confirm the booking first. After that, you will see the correct document list for your student type.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard?tab=kyc')}
                  className="px-8 py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-primary/80 transition-all"
                >
                  Open Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Trust Indicators Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto border border-outline-variant/30">
              <Shield className="text-3xl text-primary w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg text-on-surface">Verified Properties</h4>
            <p className="text-on-surface-variant text-sm">Every room in the Apna Rooms network undergoes a 50-point quality and safety inspection.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto border border-outline-variant/30">
              <CheckCircle className="text-3xl text-primary w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg text-on-surface">Deposit Protection</h4>
            <p className="text-on-surface-variant text-sm">Your security deposit is held in a protected escrow account and is fully refundable per policy.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto border border-outline-variant/30">
              <FileText className="text-3xl text-primary w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg text-on-surface">24/7 Concierge</h4>
            <p className="text-on-surface-variant text-sm">Dedicated property managers and support staff available round the clock for all residents.</p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default BookingConfirmation;

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
    return Number(roomData?.available_seats || 0) <= 0 || hasActiveBookingForAnotherUser(roomData);
  };

  useEffect(() => {
    fetchDetails();
  }, [id, roomId]);

  const fetchDetails = async () => {
    try {
      const { data: pgData } = await supabase.from('pgs').select('*').eq('id', id).single();
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*, bookings (id, status, user_id)')
        .eq('id', roomId)
        .single();

      if (!roomData || isRoomSoldOut(roomData)) {
        toast.error('This room is sold out.');
        navigate(`/pg/${id}`);
        return;
      }

      setPg(pgData);
      setRoom(roomData);

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
    const monthlyRent = Number(room.price_per_seat); 
    const totalRentForContract = monthlyRent * duration;
    const deposit = Number(pg?.security_deposit ?? 2000);
    
    return {
      monthlyRent,
      rent: totalRentForContract,
      deposit,
      total: totalRentForContract + deposit,
      payableNow: totalRentForContract + deposit // Always full payment now
    };
  };

  const pricing = getPricing();

  const createPendingBooking = async () => {
    const { data: latestRoom, error: roomError } = await supabase
      .from('rooms')
      .select('*, bookings (id, status, user_id)')
      .eq('id', room.id)
      .single();

    if (roomError) throw roomError;
    if (isRoomSoldOut(latestRoom)) {
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
            toast.success('Booking Confirmed! Now upload documents.');
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

  const handleOfflinePayment = async () => {
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

    const isInternational = userData?.studentCategory === 'International';
    
    const requiredFiles = [
      'userPhoto', 
      'universityId', 
      'viduDoc',
      'policeVerification'
    ];

    if (isInternational) {
      requiredFiles.push('passport');
    } else {
      requiredFiles.push('aadharPancard', 'aadharBack', 'parentAadhar');
    }

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

  if (loading) return <div className="p-20 text-center font-['Sora'] text-white">Loading booking system...</div>;

  const isInternational = userData?.studentCategory === 'International';

  return (
    <div className="max-w-5xl mx-auto px-4 py-32 font-['Sora']">
      <div className="bg-[#1a1435] rounded-[3rem] shadow-2xl overflow-hidden border border-white/10">
        <div className="bg-accent p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
          <h1 className="text-4xl font-black tracking-tight">Review & Pay</h1>
          <p className="opacity-70 font-medium mt-2">Finalizing your stay at {pg.name}</p>
        </div>

        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="font-black text-xl text-white flex items-center">
                <div className="p-2 bg-accent/20 rounded-xl mr-3 text-accent"><Shield className="w-5 h-5" /></div>
                Stay Summary
              </h3>
              <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Room Profile</span>
                  <span className="font-black text-white text-right">{pg.name} - Room {room.room_number}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Property Type</span>
                  <span className="font-black text-accent uppercase">{pg.accommodation_type}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Location</span>
                  <span className="font-black text-white text-right max-w-[200px] truncate">{pg.city}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Contract</span>
                  <span className="font-black text-white">{contractDuration} Months</span>
                </div>
              </div>
            </div>

            <div className="bg-accent/5 p-8 rounded-[2.5rem] border border-accent/20 space-y-6">
              <h3 className="font-black text-xl text-white">Financial Statement</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Monthly Subscription</span>
                  <span className="text-white font-bold">₹{pricing.monthlyRent}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Security Deposit</span>
                  <span className="text-white font-bold">₹{pricing.deposit}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-white font-black text-xl">Total Payable</span>
                  <div className="text-right">
                    <span className="font-black text-3xl text-accent block tracking-tighter">₹{pricing.total}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Inclusive of all taxes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!paymentSuccess ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handlePayment}
                disabled={processing}
                className="bg-accent text-white py-5 rounded-2xl font-black text-lg hover:bg-accent/80 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-accent/20 disabled:opacity-50"
              >
                {processing ? <Loader2 className="animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                <span>{processing ? 'Processing...' : 'Digital Checkout'}</span>
              </button>
              
              <button
                onClick={handleOfflinePayment}
                disabled={processing}
                className="bg-white/5 text-white border border-white/10 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                <span>{processing ? 'Processing...' : 'Offline Reserve'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className={`p-8 rounded-[2.5rem] flex items-center space-x-6 border-2 ${offlinePending ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                <div className={`p-4 rounded-3xl ${offlinePending ? 'bg-amber-500' : 'bg-green-500'} shadow-lg shadow-black/20`}>
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className={`text-2xl font-black ${offlinePending ? 'text-amber-400' : 'text-green-400'}`}>
                    {offlinePending ? 'Slot Reserved!' : 'Transaction Approved!'}
                  </h4>
                  <p className="text-gray-400 font-medium mt-1">
                    Please transmit your credentials to activate your keys.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
                  <div>
                    <h3 className="text-3xl font-black text-white">Credential Vault</h3>
                    <p className="text-gray-500 font-medium text-sm mt-1">Stictly protected & encrypted transmission.</p>
                  </div>
                  <div className="px-5 py-2 bg-red-500/10 rounded-full border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
                    MAX 1MB PER FILE
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Categorized Document List */}
                  {[
                    { label: 'Passport Size Photo', key: 'userPhoto', inst: 'Professional Background' },
                    { label: 'University / College ID', key: 'universityId', inst: 'Face toward camera' },
                    ...(isInternational ? [
                      { label: 'Global Passport', key: 'passport', inst: 'Visa/Main page' },
                      { label: 'Visa / Permit', key: 'visa', inst: 'Residence Authorization' }
                    ] : [
                      { label: 'Aadhar / PAN', key: 'aadharPancard', inst: 'Primary ID Front' },
                      { label: 'Residency Proof', key: 'aadharBack', inst: 'Primary ID Back' },
                      { label: "Guardian Identity", key: 'parentAadhar', inst: "Sponsor's Aadhar" }
                    ]),
                  ].map((doc) => (
                    <div key={doc.key} className={`relative border-2 border-dashed rounded-[2.5rem] p-8 text-center transition-all duration-500 group overflow-hidden ${files[doc.key] ? 'border-accent bg-accent/5' : 'border-white/5 bg-white/2 hover:border-accent/40'}`}>
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, doc.key)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${files[doc.key] ? 'bg-accent text-white' : 'bg-white/5 text-gray-500 group-hover:text-accent'}`}>
                        {files[doc.key] ? <CheckCircle className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                      </div>
                      <span className="text-sm font-black text-white block truncate">{files[doc.key]?.name || doc.label}</span>
                      <span className="text-[10px] text-gray-500 mt-2 block uppercase font-black tracking-widest">{doc.inst}</span>
                    </div>
                  ))}

                  {/* Vidu & Police Doc Section */}
                  <div className="col-span-full space-y-6">
                    <div className="bg-white/[0.03] p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 group">
                       <div className="flex items-center space-x-6">
                         <div className="p-5 bg-accent/10 rounded-3xl text-accent transition-transform group-hover:scale-110">
                           <FileText className="w-10 h-10" />
                         </div>
                         <div>
                           <h4 className="text-xl font-black text-white">Vidu Authorization</h4>
                           <p className="text-sm text-gray-500 font-medium mt-1">Download official template, fill, and sync back.</p>
                         </div>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                          {pg?.owner_doc_url ? (
                            <a 
                              href={pg.owner_doc_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-8 py-4 bg-white/10 text-white border border-accent/30 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:border-accent transition-all flex items-center justify-center shadow-lg shadow-accent/10 group"
                            >
                              <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" /> Get Blank Vidu Form
                            </a>
                          ) : (
                            <div className="px-4 py-2 bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-tighter border border-red-500/20 rounded-xl">
                              Template Not Uploaded
                            </div>
                          )}
                         <div className="relative">
                            <input 
                              type="file" 
                              onChange={(e) => handleFileUpload(e, 'viduDoc')}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <button className={`w-full px-8 py-4 ${files.viduDoc ? 'bg-green-600' : 'bg-accent'} text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center shadow-xl shadow-accent/20`}>
                              <Upload className="w-4 h-4 mr-2" /> Sync Document
                            </button>
                         </div>
                       </div>
                    </div>

                    <div className="bg-white/[0.03] p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 group">
                       <div className="flex items-center space-x-6">
                         <div className="p-5 bg-purple-500/10 rounded-3xl text-purple-500 transition-transform group-hover:scale-110">
                           <Shield className="w-10 h-10" />
                         </div>
                         <div>
                           <h4 className="text-xl font-black text-white">Police Verification</h4>
                           <p className="text-sm text-gray-500 font-medium mt-1">Mandatory verification document required by law.</p>
                         </div>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                          {pg?.police_verification_template_url ? (
                            <a 
                              href={pg.police_verification_template_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-8 py-4 bg-white/10 text-white border border-purple-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:border-purple-600 transition-all flex items-center justify-center shadow-lg shadow-purple-500/10 group"
                            >
                              <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" /> Get Police Template
                            </a>
                          ) : (
                            <div className="px-4 py-2 bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-tighter border border-red-500/20 rounded-xl">
                              Template Not Uploaded
                            </div>
                          )}
                         <div className="relative">
                            <input 
                              type="file" 
                              onChange={(e) => handleFileUpload(e, 'policeVerification')}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <button className={`w-full px-8 py-4 ${files.policeVerification ? 'bg-green-600' : 'bg-purple-600'} text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center shadow-xl shadow-purple-500/20`}>
                              <Upload className="w-4 h-4 mr-2" /> Sync Document
                            </button>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* === NEW: Dynamic Document Requirements === */}
                {docRequirements.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex items-center space-x-3 mb-2">
                       <Shield className="w-5 h-5 text-accent" />
                       <h4 className="text-sm font-black text-white uppercase tracking-widest">Additional Property Requirements</h4>
                    </div>
                    {docRequirements.map((req) => (
                      <div key={req.id} className="bg-white/[0.03] p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 group">
                        <div className="flex items-center space-x-6">
                          <div className="p-5 bg-accent/10 rounded-3xl text-accent transition-transform group-hover:scale-110">
                            <FileText className="w-10 h-10" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-white">{req.document_name}</h4>
                            <p className="text-sm text-gray-500 font-medium mt-1">Property specific requirement.</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto text-center md:text-left">
                          {req.template_url && (
                            <a 
                              href={req.template_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-8 py-4 bg-white/10 text-white border border-accent/30 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:border-accent transition-all flex items-center justify-center shadow-lg shadow-accent/10 group"
                            >
                              <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" /> Get Template
                            </a>
                          )}
                          <div className="relative">
                            <input 
                              type="file" 
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  if (file.size > 1024 * 1024) return toast.error('Max 1MB');
                                  setDynamicFiles({ ...dynamicFiles, [req.id]: file });
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <button className={`w-full px-8 py-4 ${dynamicFiles[req.id] ? 'bg-green-600' : 'bg-accent'} text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center shadow-xl shadow-accent/20`}>
                              <Upload className="w-4 h-4 mr-2" /> {dynamicFiles[req.id] ? 'File Ready' : 'Sync Doc'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* ========================================= */}

                <button
                  onClick={finalizeBooking}
                  disabled={processing}
                  className="w-full bg-white text-[#1a1435] py-6 rounded-full font-black text-2xl shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center space-x-4 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="animate-spin w-8 h-8" /> : null}
                  <span>{processing ? 'Transmitting Data...' : 'Confirm Residency'}</span>
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

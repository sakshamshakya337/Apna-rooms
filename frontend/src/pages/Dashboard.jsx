import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Zap, 
  MessageSquare, 
  CreditCard, 
  User,
  Users,
  LayoutDashboard,
  Settings, 
  ChevronRight,
  PlusCircle,
  FileText,
  ShieldCheck,
  Building2,
  IndianRupee,
  Download,
  Wrench,
  Upload,
  Globe,
  Image as ImageIcon,
  FileCheck,
  FileX,
  Clock,
  CheckCircle2,
  FileSearch,
  Shield
} from 'lucide-react';
import ElectricityBill from '../components/ElectricityBill';
import Complaints from '../components/Complaints';
import Payments from '../components/Payments';
import AdminPanel from '../components/AdminPanel';
import Profile from '../components/Profile';
import ServiceWorkerDashboard from './ServiceWorkerDashboard';
import { motion } from 'framer-motion';
import { generateRentReceiptPDF } from '../utils/pdfUtils';
import { toast } from 'react-hot-toast';
import { compressImage } from '../utils/imageUtils';
import { compressPDF } from '../utils/pdfUtils';

const Dashboard = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin' || userData?.role === 'sub_admin';
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(requestedTab || (isAdmin ? 'admin' : 'overview'));
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docRequirements, setDocRequirements] = useState([]);
  const [dynamicDocs, setDynamicDocs] = useState([]);
  const [roommateRequests, setRoommateRequests] = useState([]);
  const [roommateForm, setRoommateForm] = useState({ full_name: '', email: '', phone_number: '' });
  const [roommateSubmitting, setRoommateSubmitting] = useState(false);
  const residentName = userData?.fullName || userData?.full_name || currentUser?.fullName || currentUser?.full_name || currentUser?.email || 'Resident';
  const residentFirstName = residentName.split(' ')[0];

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

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab);
    } else if (isAdmin && activeTab === 'overview') {
      setActiveTab('admin');
    }
  }, [requestedTab, isAdmin, activeTab]);

  const enrichBookingRecord = async (rawBooking) => {
    if (!rawBooking) return null;

    const [pgRes, roomRes] = await Promise.all([
      supabase
        .from('pgs')
        .select('*')
        .eq('id', rawBooking.pg_id)
        .maybeSingle(),
      supabase
        .from('rooms')
        .select('*')
        .eq('id', rawBooking.room_id)
        .maybeSingle()
    ]);

    if (pgRes.error) console.error('PG Fetch Error:', pgRes.error);
    if (roomRes.error) console.error('Room Fetch Error:', roomRes.error);

    return {
      ...rawBooking,
      pgs: pgRes.data || null,
      rooms: roomRes.data || null
    };
  };

  const fetchUserBooking = async () => {
    setLoading(true);
    try {
      let bookingData = null;

      const { data: primaryBooking, error: primaryBookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', currentUser.uid)
        .in('status', ['confirmed', 'pending'])
        .maybeSingle();

      if (primaryBookingError) {
        throw primaryBookingError;
      }

      if (primaryBooking) {
        bookingData = {
          ...(await enrichBookingRecord(primaryBooking)),
          occupant_role: 'primary'
        };
      } else if (currentUser?.email) {
        const { data: roommateMatches, error: roommateError } = await supabase
          .from('roommate_requests')
          .select('*')
          .eq('roommate_email', currentUser.email.trim().toLowerCase())
          .eq('status', 'approved')
          .order('verified_at', { ascending: false })
          .limit(1);

        if (roommateError) throw roommateError;

        if (roommateMatches?.[0]?.booking_id) {
          const { data: roommateBooking, error: roommateBookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', roommateMatches[0].booking_id)
            .maybeSingle();

          if (roommateBookingError) throw roommateBookingError;
          if (!roommateBooking) throw new Error('Approved roommate booking could not be found.');

          bookingData = {
            ...(await enrichBookingRecord(roommateBooking)),
            occupant_role: 'approved_roommate',
            occupant_record_id: roommateMatches[0].id,
            occupant_display_name: roommateMatches[0].roommate_full_name
          };
        }
      }

      if (bookingData) {
        setBooking(bookingData);
        // Fetch dynamic requirements and current uploads
        const [reqsRes, docsRes] = await Promise.all([
          supabase.from('pg_document_requirements').select('*').eq('pg_id', bookingData.pg_id),
          supabase.from('booking_documents').select('*').eq('booking_id', bookingData.id)
        ]);
        setDocRequirements(reqsRes.error ? [] : (reqsRes.data || []));
        setDynamicDocs(docsRes.error ? [] : (docsRes.data || []));

        const { data: roommateData, error: roommateListError } = await supabase
          .from('roommate_requests')
          .select('*')
          .eq('booking_id', bookingData.id)
          .order('created_at', { ascending: false });
        setRoommateRequests(roommateListError ? [] : (roommateData || []));
      } else {
        setBooking(null);
        setDocRequirements([]);
        setDynamicDocs([]);
        setRoommateRequests([]);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingRecord = async (bookingId, updatePayload) => {
    // Robust update that handles missing columns in the database
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { error } = await supabase.from('bookings').update(updatePayload).eq('id', bookingId);
      if (!error) return;

      const message = error.message || '';
      // Handle "column does not exist" or "Could not find the '...' column"
      const missingColumn = message.match(/'([^']+)' column/)?.[1] || message.match(/column "([^"]+)"/)?.[1];
      
      if (!missingColumn || !(missingColumn in updatePayload)) {
        throw error;
      }

      console.warn(`Column '${missingColumn}' missing in database. Retrying update without it.`);
      toast.error(`Warning: Database missing column '${missingColumn}'. Your document link was not saved to the record. Please contact the admin to update the database schema.`);
      delete updatePayload[missingColumn];
    }
  };

  const handleDocUpload = async (file, column) => {
    if (!file) return;
    if (booking?.occupant_role === 'approved_roommate') {
      return toast.error('Only the primary resident can manage KYC documents.');
    }

    const toastId = toast.loading(`Uploading ${column.replace(/_/g, ' ')}...`);
    
    try {
      let uploadFile = file;
      
      // Compress images
      if (file.type.startsWith('image/')) {
        uploadFile = await compressImage(file, 0.9);
      }
      
      // Compress PDFs
      if (file.type === 'application/pdf') {
        uploadFile = await compressPDF(file, 1);
      }

      if (uploadFile.size > 1 * 1024 * 1024) {
        toast.error('File is still above 1MB after compression. Please upload a smaller file.', { id: toastId });
        return;
      }

      const fileName = `${currentUser.uid}/${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, uploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      await updateBookingRecord(booking.id, { [column]: fileName });

      toast.success("Document uploaded successfully!", { id: toastId });
      fetchUserBooking(); // Refresh to show new doc
    } catch (error) {
      console.error('Upload Error:', error);
      toast.error("Upload failed. Please try again.", { id: toastId });
    }
  };

  const handleDynamicDocUpload = async (file, reqId, reqName) => {
    if (!file) return;
    if (booking?.occupant_role === 'approved_roommate') {
      return toast.error('Only the primary resident can manage KYC documents.');
    }

    const toastId = toast.loading(`Uploading ${reqName}...`);
    try {
        let uploadFile = file;
        
        // Compress images
        if (file.type.startsWith('image/')) {
          uploadFile = await compressImage(file, 0.9);
        }
        
        // Compress PDFs
        if (file.type === 'application/pdf') {
          uploadFile = await compressPDF(file, 1);
        }
        
        if (uploadFile.size > 1024 * 1024) {
          toast.error('File is still above 1MB after compression. Please upload a smaller file.', { id: toastId });
          return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.uid}/dynamic_${reqId}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('kyc-documents')
          .upload(fileName, uploadFile);
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(fileName);

        // Upsert the dynamic document record
        const existing = dynamicDocs.find(d => d.requirement_id === reqId);
        
        const docRecord = {
          booking_id: booking.id,
          requirement_id: reqId,
          document_name: reqName,
          uploaded_url: publicUrl,
          status: 'pending'
        };

        let result;
        if (existing) {
          result = await supabase.from('booking_documents').update(docRecord).eq('id', existing.id);
        } else {
          result = await supabase.from('booking_documents').insert([docRecord]);
        }

        if (result.error) throw result.error;
        toast.success(`${reqName} uploaded!`, { id: toastId });
        fetchUserBooking();
    } catch (error) {
        toast.error('Upload failed', { id: toastId });
    }
  };

  const handleRoommateRequest = async (e) => {
    e.preventDefault();
    if (!booking) return toast.error('Book a room before adding a roommate.');
    if (booking.occupant_role === 'approved_roommate') {
      return toast.error('Only the primary room holder can request an additional roommate.');
    }
    if (!roommateForm.full_name.trim() || !roommateForm.email.trim()) {
      return toast.error('Roommate name and email are required.');
    }

    const activeRequest = roommateRequests.find((request) => request.status === 'pending');
    if (activeRequest) {
      return toast.error('A roommate request is already pending for this room.');
    }

    const approvedOccupants = roommateRequests.filter((request) => request.status === 'approved').length;
    if (approvedOccupants >= 1) {
      return toast.error('A second occupant is already approved. Only admin can add a third student.');
    }

    setRoommateSubmitting(true);
    try {
      const { error } = await supabase
        .from('roommate_requests')
        .insert([{
          booking_id: booking.id,
          pg_id: booking.pg_id,
          room_id: booking.room_id,
          requested_by_user_id: currentUser.uid,
          roommate_full_name: roommateForm.full_name.trim(),
          roommate_email: roommateForm.email.trim().toLowerCase(),
          roommate_phone: roommateForm.phone_number.trim(),
          status: 'pending'
        }]);

      if (error) throw error;
      toast.success('Roommate request sent for admin verification.');
      setRoommateForm({ full_name: '', email: '', phone_number: '' });
      fetchUserBooking();
    } catch (error) {
      toast.error(error.message || 'Failed to send roommate request.');
    } finally {
      setRoommateSubmitting(false);
    }
  };

  const studentCategory = userData?.studentCategory || 'National';
  const isInternationalStudent = studentCategory === 'International';
  const approvedRoommates = roommateRequests.filter((request) => request.status === 'approved');
  const pendingRoommateRequest = roommateRequests.find((request) => request.status === 'pending');
  const currentOccupancy = booking ? 1 + approvedRoommates.length : 0;
  const roomCapacity = booking ? Math.min(3, Number(booking.rooms?.total_seats || 3)) : 0;
  const canPrimaryResidentAddRoommate = Boolean(
    booking &&
    booking.occupant_role !== 'approved_roommate' &&
    !pendingRoommateRequest &&
    approvedRoommates.length === 0 &&
    currentOccupancy < Math.min(2, roomCapacity || 2)
  );
  const kycDocuments = isInternationalStudent
    ? [
        { id: 'user_photo_url', label: 'Student Photo', icon: ImageIcon, req: true },
        { id: 'passport_url', label: 'Passport Photo / Bio Page', icon: Globe, req: true },
        { id: 'vidu_doc_url', label: 'Vidu Form', icon: FileSearch, req: true, templateKey: 'owner_doc_url' },
        { id: 'university_id_url', label: 'Student College ID Card', icon: FileCheck, req: true },
        { id: 'police_verification_url', label: 'Police Verification Form', icon: Shield, req: true, templateKey: 'police_verification_template_url' }
      ]
    : [
        { id: 'user_photo_url', label: 'Student Photo', icon: ImageIcon, req: true },
        { id: 'aadhar_pancard_url', label: 'Student Aadhaar Card', icon: FileText, req: true },
        { id: 'parent_aadhar_url', label: 'Parent / Guardian Aadhaar Card', icon: ShieldCheck, req: true },
        { id: 'university_id_url', label: 'Student College ID Card', icon: FileCheck, req: true },
        { id: 'police_verification_url', label: 'Police Verification Form', icon: Shield, req: true, templateKey: 'police_verification_template_url' }
      ];

  const userMenuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'profile', icon: User, label: 'My Profile' },
    { id: 'kyc', icon: ShieldCheck, label: 'KYC Documents' },
    { id: 'bills', icon: Zap, label: 'Electricity Bills' },
    { id: 'complaints', icon: MessageSquare, label: 'Complaints' },
    { id: 'payments', icon: CreditCard, label: 'Rent Payments' },
    { id: 'roommates', icon: Users, label: 'Roommate' },
  ];

  const adminMenuItems = [
    { id: 'admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
    { id: 'users_admin', icon: Users, label: 'Users & Tenants' },
    { id: 'pgs', icon: Building2, label: 'Manage PGs' },
    { id: 'revenue', icon: IndianRupee, label: 'Manage Revenue' },
    { id: 'bills_admin', icon: Zap, label: 'Manage Bills' },
    { id: 'complaints_admin', icon: MessageSquare, label: 'Manage Complaints' },
    { id: 'queries_admin', icon: MessageSquare, label: 'Contact Queries' },
    { id: 'workers_admin', icon: Wrench, label: 'Service Workers' },
    { id: 'team', icon: ShieldCheck, label: 'Manage Team' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const isWorker = ['plumber', 'electrician', 'wifi', 'service_worker'].includes(userData?.role?.toLowerCase());

  if (isWorker) {
    return <ServiceWorkerDashboard />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-accent text-white shadow-xl shadow-purple-200' 
                  : 'bg-white/50 text-gray-500 hover:bg-white hover:text-accent border border-transparent hover:border-gray-100 shadow-sm'
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white/70 backdrop-blur-3xl rounded-[3rem] p-10 shadow-2xl shadow-purple-900/5 border border-white min-h-[600px]"
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-4xl font-black tracking-tight">Howdy, {residentFirstName}!</h2>
                  <div className="px-6 py-2 bg-accent/10 text-accent rounded-full text-xs font-black uppercase tracking-widest border border-accent/20">
                    {userData?.role || 'Verified Resident'}
                  </div>
                </div>

                {booking ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       {booking.status === 'confirmed' ? (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-10 rounded-[3rem] relative overflow-hidden group mb-8">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/20 rounded-full blur-3xl -z-0 translate-x-20 -translate-y-20"></div>
                          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="space-y-4 text-center md:text-left">
                              <div className="inline-flex items-center space-x-2 bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Official Confirmation</span>
                              </div>
                              <h3 className="text-4xl font-black text-green-900 tracking-tight leading-tight">Welcome Home, {residentFirstName}! 🏡</h3>
                              <p className="text-green-700/80 font-medium max-w-md">Your residency at <span className="font-black underline decoration-green-300 decoration-2">{booking.pgs?.name}</span> has been officially approved. We're excited to have you!</p>
                              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                                <div className="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-green-200 shadow-sm">
                                  <div className="text-[10px] font-black text-green-800 uppercase tracking-widest opacity-50 mb-1">Room Secure</div>
                                  <div className="text-lg font-black text-green-900">Room #{booking.rooms?.room_number}</div>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-green-200 shadow-sm">
                                  <div className="text-[10px] font-black text-green-800 uppercase tracking-widest opacity-50 mb-1">Move-in Date</div>
                                  <div className="text-lg font-black text-green-900">{new Date(booking.created_at).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-3">
                              <button 
                                onClick={() => generateRentReceiptPDF(booking, userData, booking.pgs)}
                                className="bg-white text-green-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-xl shadow-green-900/5 flex items-center justify-center space-x-2 border border-green-100"
                              >
                                <Download className="w-4 h-4" />
                                <span>Download Receipt</span>
                              </button>
                            </div>
                          </div>
                        </div>
                       ) : (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-10 rounded-[3rem] relative overflow-hidden group mb-8">
                          <div className="relative z-10 space-y-4">
                            <div className="inline-flex items-center space-x-2 bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                              <Clock className="w-3 h-3" />
                              <span>Approval Pending</span>
                            </div>
                            <h3 className="text-3xl font-black text-amber-900 tracking-tight">Hang Tight!</h3>
                            <p className="text-amber-700/80 font-medium max-w-sm">Our admin is currently verifying your offline payment. You'll receive a confirmation here shortly.</p>
                          </div>
                        </div>
                       )}
                    </div>

                    <div className="glass-card p-8 rounded-[2.5rem] border-white/50">
                      <h3 className="text-xl font-black mb-6 flex items-center">
                        <div className="p-2.5 bg-accent/10 rounded-2xl mr-3 text-accent">
                           <FileText className="w-6 h-6" />
                        </div>
                        Residency Details
                      </h3>
                      <div className="space-y-4 text-gray-500 text-sm">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="font-semibold text-primary/60 uppercase text-[10px] tracking-widest">Property</span>
                          <span className="font-black text-primary">{booking.pgs?.name}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="font-semibold text-primary/60 uppercase text-[10px] tracking-widest">Address</span>
                          <span className="font-black text-primary text-right max-w-[150px] truncate">{booking.pgs?.address}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="font-semibold text-primary/60 uppercase text-[10px] tracking-widest">Room Number</span>
                          <span className="font-black text-accent text-lg text-right">{booking.pgs?.name} - Room {booking.rooms?.room_number}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary/60 uppercase text-[10px] tracking-widest">Booking Status</span>
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {booking.status === 'pending' ? 'Verifying Payment' : 'Live & Verified'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/50 p-8 rounded-[2.5rem] border border-white flex flex-col justify-center space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                           <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trust Store</div>
                          <div className="text-sm font-black text-primary">
                            {booking.occupant_role === 'approved_roommate' ? 'Approved Occupant' : 'KYC Verified'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                           <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority Support</div>
                          <div className="text-sm font-black text-primary">24/7 Hotline</div>
                        </div>
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
            {activeTab === 'roommates' && booking && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight text-primary">Roommate Request</h2>
                    <p className="text-gray-500 mt-2 font-medium">Primary resident can add one roommate. Admin can add the third occupant if the room supports three students.</p>
                  </div>
                  <div className="px-5 py-2 bg-accent/10 text-accent rounded-full border border-accent/20 text-[10px] font-black uppercase tracking-widest">
                    {booking.pgs?.name} - Room {booking.rooms?.room_number}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Occupancy</div>
                    <div className="mt-2 text-3xl font-black text-primary">{currentOccupancy}</div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Room Capacity</div>
                    <div className="mt-2 text-3xl font-black text-primary">{roomCapacity || 1}</div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Your Access</div>
                    <div className="mt-2 text-sm font-black text-primary">
                      {booking.occupant_role === 'approved_roommate' ? 'Approved roommate' : 'Primary resident'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black mb-6">Add Student Details</h3>
                    {canPrimaryResidentAddRoommate ? (
                      <form onSubmit={handleRoommateRequest} className="space-y-4">
                        <input
                          required
                          placeholder="Roommate full name"
                          value={roommateForm.full_name}
                          onChange={(e) => setRoommateForm({ ...roommateForm, full_name: e.target.value })}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-accent"
                        />
                        <input
                          required
                          type="email"
                          placeholder="Roommate email"
                          value={roommateForm.email}
                          onChange={(e) => setRoommateForm({ ...roommateForm, email: e.target.value })}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-accent"
                        />
                        <input
                          placeholder="Roommate phone number"
                          value={roommateForm.phone_number}
                          onChange={(e) => setRoommateForm({ ...roommateForm, phone_number: e.target.value })}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-accent"
                        />
                        <button
                          type="submit"
                          disabled={roommateSubmitting}
                          className="w-full bg-accent text-white py-4 rounded-2xl font-black hover:bg-blue-600 transition-all disabled:opacity-50"
                        >
                          {roommateSubmitting ? 'Sending...' : 'Send For Admin Verification'}
                        </button>
                      </form>
                    ) : (
                      <div className="p-6 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 text-sm text-gray-600 space-y-2">
                        <p className="font-black text-primary">
                          {booking.occupant_role === 'approved_roommate'
                            ? 'Only the primary resident can send a roommate request.'
                            : pendingRoommateRequest
                              ? 'An approval request is already pending for this room.'
                              : approvedRoommates.length > 0
                                ? 'The second student is already approved. If the room supports 3 occupants, the admin can add the third student.'
                                : 'This room cannot take another resident from the user side.'}
                        </p>
                        <p>The invited student should use the same email when creating their account so access opens automatically after approval.</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black mb-6">Request Status</h3>
                    {roommateRequests.length > 0 ? (
                      <div className="space-y-4">
                        {roommateRequests.map((request) => (
                          <div key={request.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex justify-between gap-4">
                              <div>
                                <div className="font-black text-primary">{request.roommate_full_name}</div>
                                <div className="text-xs text-gray-500">{request.roommate_email}</div>
                                <div className="text-xs text-gray-400 mt-1">{request.roommate_phone || 'No phone added'}</div>
                              </div>
                              <span className={`h-fit px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {request.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No roommate request yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'roommates' && !booking && (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400">No Booking Active</h3>
                <p className="text-gray-500">You can add a roommate after booking a room.</p>
              </div>
            )}
            {activeTab === 'profile' && <Profile />}
            {activeTab === 'kyc' && booking && (
              <div className="space-y-12">
                {/* KYC Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 pb-8">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight text-primary">Verification Hub</h2>
                    <p className="text-gray-500 mt-2 font-medium">
                      {studentCategory} student documents unlock after admin confirms your booking
                    </p>
                  </div>
                  <div className={`flex items-center px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest ${
                    booking.is_kyc_verified 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }`}>
                    {booking.is_kyc_verified ? (
                      <><ShieldCheck className="w-4 h-4 mr-2" /> Verified Profile</>
                    ) : (
                      <><Clock className="w-4 h-4 mr-2" /> Processing KYC</>
                    )}
                  </div>
                </div>

                {booking.status !== 'confirmed' ? (
                  <div className="bg-amber-50 border border-amber-100 p-10 rounded-[3rem] text-center">
                    <Clock className="w-14 h-14 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-primary">Admin confirmation pending</h3>
                    <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                      Your room is reserved. Document upload will open here only after the admin confirms the booking.
                    </p>
                  </div>
                ) : booking.occupant_role === 'approved_roommate' ? (
                  <div className="bg-blue-50 border border-blue-100 p-10 rounded-[3rem] text-center">
                    <Users className="w-14 h-14 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-primary">KYC handled by the primary resident</h3>
                    <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                      Your access is active for this room. You can use complaints and bills, but only the primary resident can update the shared room documents.
                    </p>
                  </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Instructions Card */}
                  <div className="lg:col-span-1 glass-card p-8 rounded-[2.5rem] border-white/50 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black flex items-center">
                        <div className="p-2.5 bg-accent/10 rounded-2xl mr-3 text-accent text-lg">⚠️</div>
                        Guidelines
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {[
                        "Clear, high-quality images only",
                        "Images are compressed automatically during upload",
                        "Max final file size: 1MB per document",
                        "Self-attested copies preferred"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start space-x-3 text-sm text-gray-500 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Template Section */}
                    {booking.pgs && (
                    <div className="pt-6 border-t border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm uppercase tracking-widest text-gray-400">Required Templates</h4>
                        {!booking.pgs.police_verification_template_url && !isInternationalStudent && (
                           <div className="text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">Contact Admin</div>
                        )}
                      </div>
                      
                      {/* Quick Templates */}
                      <div className="grid grid-cols-1 gap-4">
                        {isInternationalStudent && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vidu Authorization</p>
                          {booking.pgs?.owner_doc_url ? (
                            <a 
                              href={booking.pgs.owner_doc_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center p-4 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-xl group"
                            >
                              <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" /> Get Vidu Form
                            </a>
                          ) : (
                            <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-bold border border-red-100 italic">
                              Vidu Template Not Uploaded
                            </div>
                          )}
                        </div>
                        )}

                        {/* Police Verification Form - Available for All Student Types */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Police Verification Form</p>
                          {booking.pgs?.police_verification_template_url ? (
                            <a 
                              href={booking.pgs.police_verification_template_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center p-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-xl group"
                            >
                              <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" /> Get Police Form
                            </a>
                          ) : (
                            <div className="p-4 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-bold border border-gray-100 italic">
                              Admin hasn't uploaded police form
                            </div>
                          )}
                        </div>

                        {/* === NEW: Dynamic Custom Templates === */}
                        {docRequirements.map((req) => (
                          req.template_url && (
                            <div key={req.id} className="space-y-2">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{req.document_name}</p>
                              <a 
                                href={req.template_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center p-4 bg-gray-100 text-primary border border-gray-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-lg group"
                              >
                                <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" /> Get {req.document_name}
                              </a>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Upload Center */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-black mb-6">Document Upload Center</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {kycDocuments.map((doc) => (
                        <div key={doc.id} className={`group relative p-6 rounded-[2.2rem] border transition-all duration-300 ${
                          booking[doc.id] 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-100 hover:border-accent shadow-sm'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${booking[doc.id] ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400 group-hover:bg-accent/10 group-hover:text-accent'}`}>
                              <doc.icon className="w-6 h-6" />
                            </div>
                            {booking[doc.id] ? (
                              <div className="flex space-x-2">
                                <button 
                                  onClick={async () => {
                                    const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(booking[doc.id], 60);
                                    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                                  }}
                                  className="p-2 bg-white text-green-600 rounded-xl shadow-sm hover:bg-green-100"
                                >
                                  <FileSearch className="w-4 h-4" />
                                </button>
                                <div className="p-2 bg-green-500 text-white rounded-xl">
                                  <FileCheck className="w-4 h-4" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end space-y-2">
                                <div className={`text-[10px] font-black uppercase tracking-widest ${doc.req ? 'text-red-400' : 'text-gray-300'} italic`}>
                                  {doc.req ? 'Required' : 'Optional'}
                                </div>
                                {doc.templateKey && booking.pgs?.[doc.templateKey] && (
                                  <a 
                                    href={booking.pgs[doc.templateKey]} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center text-[9px] font-black text-accent uppercase tracking-widest bg-accent/5 px-2 py-1 rounded-lg hover:bg-accent/10 transition-colors animate-pulse hover:animate-none"
                                  >
                                    <Download className="w-3 h-3 mr-1" /> Get Template
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-black text-primary text-sm">{doc.label}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">
                              {booking[doc.id] ? 'Successfully Uploaded' : 'Waiting for upload'}
                            </p>
                          </div>

                          <label className={`w-full flex items-center justify-center p-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all ${
                            booking[doc.id] 
                              ? 'bg-white/50 text-green-700 hover:bg-white' 
                              : 'bg-accent text-white shadow-lg hover:bg-blue-600'
                          }`}>
                            <Upload className="w-3.5 h-3.5 mr-2" />
                            {booking[doc.id] ? 'Update File' : 'Choose File'}
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => handleDocUpload(e.target.files[0], doc.id)}
                            />
                          </label>
                        </div>
                      ))}

                      {/* === NEW: Dynamic Document Upload Slots === */}
                      {docRequirements.map((req) => {
                        const uploaded = dynamicDocs.find(d => d.requirement_id === req.id);
                        return (
                          <div key={req.id} className={`group relative p-6 rounded-[2.2rem] border transition-all duration-300 ${
                            uploaded 
                              ? (uploaded.status === 'verified' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200') 
                              : 'bg-white border-gray-100 hover:border-accent shadow-sm'
                          }`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className={`p-3 rounded-2xl ${uploaded ? 'bg-accent/10 text-accent' : 'bg-gray-50 text-gray-400 group-hover:bg-accent/10 group-hover:text-accent'}`}>
                                <Shield className="w-6 h-6" />
                              </div>
                              {uploaded ? (
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => window.open(uploaded.uploaded_url, '_blank')}
                                    className="p-2 bg-white text-accent rounded-xl shadow-sm hover:bg-accent/5"
                                  >
                                    <FileSearch className="w-4 h-4" />
                                  </button>
                                  <div className={`p-2 rounded-xl text-white ${uploaded.status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                    {uploaded.status === 'verified' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end space-y-2">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-red-400 italic">
                                    Required
                                  </div>
                                  {req.template_url && (
                                    <a 
                                      href={req.template_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center text-[9px] font-black text-accent uppercase tracking-widest bg-accent/5 px-2 py-1 rounded-lg hover:bg-accent/10 transition-colors animate-pulse hover:animate-none"
                                    >
                                      <Download className="w-3 h-3 mr-1" /> Get Template
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="mb-4">
                              <h4 className="font-black text-primary text-sm">{req.document_name}</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">
                                {uploaded ? (uploaded.status === 'rejected' ? `Rejected: ${uploaded.rejection_reason}` : uploaded.status.toUpperCase()) : 'Waiting for upload'}
                              </p>
                            </div>

                            <label className={`w-full flex items-center justify-center p-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all ${
                              uploaded 
                                ? 'bg-white/50 text-accent hover:bg-white' 
                                : 'bg-accent text-white shadow-lg hover:bg-blue-600'
                            }`}>
                              <Upload className="w-3.5 h-3.5 mr-2" />
                              {uploaded ? 'Update File' : 'Choose File'}
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => handleDynamicDocUpload(e.target.files[0], req.id, req.document_name)}
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}
            {activeTab === 'kyc' && !booking && (
              <div className="text-center py-20">
                <ShieldCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400">No Booking Active</h3>
                <p className="text-gray-500">Documents will be available once you book a room.</p>
              </div>
            )}
            {isAdmin && (activeTab === 'admin' || activeTab === 'team' || activeTab === 'pgs' || activeTab === 'bills_admin' || activeTab === 'complaints_admin' || activeTab === 'queries_admin' || activeTab === 'revenue' || activeTab === 'users_admin' || activeTab === 'workers_admin') && (
              <AdminPanel section={activeTab} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../config/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Zap, 
  MessageSquare, 
  CreditCard, 
  User,
  Users,
  LayoutDashboard,
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
  FileSearch,
  Shield,
  Clock,
  CheckCircle2,
  X,
  Calendar
} from 'lucide-react';
import ElectricityBill from '../components/ElectricityBill';
import Complaints from '../components/Complaints';
import Payments from '../components/Payments';
import AdminPanel from '../components/AdminPanel';
import Profile from '../components/Profile';
import ServiceWorkerDashboard from './ServiceWorkerDashboard';
import { slugifyPG } from '../utils/slugify';
import { motion, AnimatePresence } from 'framer-motion';
import { generateRentReceiptPDF } from '../utils/pdfUtils';
import { toast } from 'react-hot-toast';
import { compressImage } from '../utils/imageUtils';
import { compressPDF } from '../utils/pdfUtils';

const Dashboard = () => {
  const { userData, currentUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin' || userData?.role === 'sub_admin';
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(requestedTab || (isAdmin ? 'admin' : 'overview'));
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbUserProfile, setDbUserProfile] = useState(null);
  const [roommateProfile, setRoommateProfile] = useState(null);
  const [docRequirements, setDocRequirements] = useState([]);
  const [dynamicDocs, setDynamicDocs] = useState([]);
  const [roommateRequests, setRoommateRequests] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [roommateForm, setRoommateForm] = useState({ full_name: '', email: '', phone_number: '' });
  const [roommateSubmitting, setRoommateSubmitting] = useState(false);
  const residentName = dbUserProfile?.full_name || dbUserProfile?.fullName || userData?.fullName || userData?.full_name || currentUser?.fullName || currentUser?.full_name || currentUser?.email || 'Resident';
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
      // Fetch fresh profile details directly from the database to always guarantee real user names
      try {
        const { data: dbUser, error: dbUserError } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.uid)
          .maybeSingle();
        if (!dbUserError && dbUser) {
          setDbUserProfile(dbUser);
        }
      } catch (profileError) {
        console.warn('Error fetching fresh DB user profile:', profileError);
      }

      let bookingData = null;

      const { data: primaryBookings, error: primaryBookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', currentUser.uid)
        .in('status', ['confirmed', 'pending'])
        .order('created_at', { ascending: false })
        .limit(1);

      const primaryBooking = primaryBookings?.[0];

      if (primaryBookingError) {
        console.error('primaryBookingError:', primaryBookingError);
        throw primaryBookingError;
      }

      if (primaryBooking) {
        bookingData = {
          ...(await enrichBookingRecord(primaryBooking)),
          occupant_role: primaryBooking.occupant_role || 'primary'
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

        if (roommateMatches?.[0]) {
          const request = roommateMatches[0];
          
          // Fetch the primary booking to get the amount, if needed
          const { data: primaryUserBooking } = await supabase
            .from('bookings')
            .select('amount')
            .eq('id', request.booking_id)
            .maybeSingle();

          // Check if roommate booking already exists
          let { data: roommateBookingsList } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', currentUser.uid)
            .eq('room_id', request.room_id)
            .order('created_at', { ascending: false })
            .limit(1);

          let newRoommateBooking = roommateBookingsList?.[0];

          if (!newRoommateBooking) {
            const { data: createdBooking, error: createError } = await supabase
              .from('bookings')
              .insert([{
                user_id: currentUser.uid,
                pg_id: request.pg_id,
                room_id: request.room_id,
                status: 'confirmed',
                occupant_role: 'approved_roommate',
                amount: primaryUserBooking?.amount || 0
              }])
              .select('*')
              .single();

            if (createError) throw createError;
            newRoommateBooking = createdBooking;
          }

          bookingData = {
            ...(await enrichBookingRecord(newRoommateBooking)),
            occupant_role: 'approved_roommate',
            occupant_record_id: request.id,
            occupant_display_name: request.roommate_full_name
          };
        }
      }

      if (bookingData) {
        setBooking(bookingData);
        // Fetch dynamic requirements, current uploads, recent complaints, and historical payments
        const [reqsRes, docsRes, complaintsRes, paymentsRes] = await Promise.all([
          supabase.from('pg_document_requirements').select('*').eq('pg_id', bookingData.pg_id),
          supabase.from('booking_documents').select('*').eq('booking_id', bookingData.id),
          supabase.from('complaints').select('*').eq('booking_id', bookingData.id).order('created_at', { ascending: false }).limit(3),
          supabase.from('payments').select('*').eq('booking_id', bookingData.id).order('created_at', { ascending: false }).limit(4)
        ]);
        setDocRequirements(reqsRes.error ? [] : (reqsRes.data || []));
        setDynamicDocs(docsRes.error ? [] : (docsRes.data || []));
        setRecentComplaints(complaintsRes.error ? [] : (complaintsRes.data || []));
        setRecentPayments(paymentsRes.error ? [] : (paymentsRes.data || []));

        const { data: roommateData, error: roommateListError } = await supabase
          .from('roommate_requests')
          .select('*')
          .eq('booking_id', bookingData.id)
          .order('created_at', { ascending: false });
        setRoommateRequests(roommateListError ? [] : (roommateData || []));

        // Fetch Roommate or Primary Resident profile details for UI display
        if (bookingData.occupant_role === 'approved_roommate') {
          try {
            const { data: primaryUser, error: primaryUserError } = await supabase
              .from('users')
              .select('*')
              .eq('id', bookingData.user_id)
              .maybeSingle();

            if (!primaryUserError && primaryUser) {
              setRoommateProfile({
                roommate_full_name: primaryUser.full_name || primaryUser.fullName,
                roommate_email: primaryUser.email,
                roommate_phone: primaryUser.phone_number || primaryUser.phoneNumber,
                status: 'approved',
                is_primary_holder: true,
                user: primaryUser,
                booking: bookingData
              });
            } else {
              setRoommateProfile(null);
            }
          } catch (primaryFetchError) {
            console.error('Error fetching primary resident details:', primaryFetchError);
            setRoommateProfile(null);
          }
        } else {
          const approved = (roommateData || []).filter(r => r.status === 'approved');
          if (approved.length > 0) {
            try {
              const { data: rmUser, error: rmUserError } = await supabase
                .from('users')
                .select('*')
                .eq('email', approved[0].roommate_email.trim().toLowerCase())
                .maybeSingle();

              if (!rmUserError && rmUser) {
                const { data: rmBooking } = await supabase
                  .from('bookings')
                  .select('*')
                  .eq('user_id', rmUser.id)
                  .maybeSingle();

                setRoommateProfile({
                  ...approved[0],
                  user: rmUser,
                  booking: rmBooking || null
                });
              } else {
                setRoommateProfile({
                  ...approved[0],
                  user: null,
                  booking: null
                });
              }
            } catch (fetchError) {
              console.error('Error fetching roommate details:', fetchError);
              setRoommateProfile({
                ...approved[0],
                user: null,
                booking: null
              });
            }
          } else {
            setRoommateProfile(null);
          }
        }
      } else {
        // No active booking found — show empty state
        setBooking(null);
        setRoommateProfile(null);
        setDocRequirements([]);
        setDynamicDocs([]);
        setRoommateRequests([]);
        setRecentComplaints([]);
        setRecentPayments([]);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingRecord = async (bookingId, updatePayload) => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { error } = await supabase.from('bookings').update(updatePayload).eq('id', bookingId);
      if (!error) return;

      const message = error.message || '';
      const missingColumn = message.match(/'([^']+)' column/)?.[1] || message.match(/column "([^"]+)"/)?.[1];
      
      if (!missingColumn || !(missingColumn in updatePayload)) {
        throw error;
      }

      console.warn(`Column '${missingColumn}' missing in database. Retrying update without it.`);
      toast.error(`Warning: Database missing column '${missingColumn}'. Linking document failed. Contact admin to resolve.`);
      delete updatePayload[missingColumn];
    }
  };

  const handleDocUpload = async (file, column) => {
    if (!file) return;
    
    const toastId = toast.loading(`Uploading ${column.replace(/_/g, ' ')}...`);
    
    try {
      let uploadFile = file;
      
      if (file.type.startsWith('image/')) {
        uploadFile = await compressImage(file, 0.9);
      }
      
      if (file.type === 'application/pdf') {
        uploadFile = await compressPDF(file, 1);
      }

      if (uploadFile.size > 1 * 1024 * 1024) {
        toast.error('File exceeds 1MB after compression. Please upload a smaller file.', { id: toastId });
        return;
      }

      const fileName = `${currentUser.uid}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, uploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      await updateBookingRecord(booking.id, { [column]: fileName });

      toast.success("Document uploaded successfully!", { id: toastId });
      fetchUserBooking();
    } catch (error) {
      console.error('Upload Error:', error);
      toast.error("Upload failed. Please try again.", { id: toastId });
    }
  };

  const handleDynamicDocUpload = async (file, reqId, reqName) => {
    if (!file) return;

    const toastId = toast.loading(`Uploading ${reqName}...`);
    try {
        let uploadFile = file;
        
        if (file.type.startsWith('image/')) {
          uploadFile = await compressImage(file, 0.9);
        }
        
        if (file.type === 'application/pdf') {
          uploadFile = await compressPDF(file, 1);
        }
        
        if (uploadFile.size > 1024 * 1024) {
          toast.error('File exceeds 1MB after compression.', { id: toastId });
          return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.uid}/dynamic_${reqId}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('kyc-documents')
          .upload(fileName, uploadFile);
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(fileName);

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
      return toast.error('A second occupant is already approved. Contact admin for additional space.');
    }

    setRoommateSubmitting(true);
    try {
      let existingUserId = null;
      try {
        const { data: userByEmail } = await supabase.from('users').select().eq('email', roommateForm.email.trim().toLowerCase()).maybeSingle();
        if (userByEmail) {
          existingUserId = userByEmail.id || userByEmail.uid;
        }
      } catch (e) {
        console.warn('Could not query users by email safely', e);
      }

      let payload = {
        booking_id: booking.id,
        pg_id: booking.pg_id,
        room_id: booking.room_id,
        requested_by_user_id: currentUser?.uid || currentUser?.id,
        roommate_full_name: roommateForm.full_name.trim(),
        roommate_email: roommateForm.email.trim().toLowerCase(),
        roommate_phone: roommateForm.phone_number.trim(),
        status: 'pending'
      };

      if (existingUserId) {
        payload.roommate_user_id = existingUserId;
      }

      for (let attempt = 0; attempt < 2; attempt++) {
        const { error, status } = await supabase.from('roommate_requests').insert([payload]);
        
        if (!error) break;

        const message = error.message || '';
        const missingColumn = message.match(/'([^']+)' column/)?.[1] || message.match(/column "([^"]+)"/)?.[1];
        
        if (missingColumn && missingColumn in payload) {
          delete payload[missingColumn];
          continue;
        }

        if (error) {
          throw error;
        }
      }

      toast.success('Roommate request sent for admin verification.');
      setRoommateForm({ full_name: '', email: '', phone_number: '' });
      fetchUserBooking();
    } catch (error) {
      console.error('Roommate Request Error:', error);
      toast.error(error.message || JSON.stringify(error) || 'Failed to send roommate request.');
    } finally {
      setRoommateSubmitting(false);
    }
  };

  const studentCategory = userData?.student_category || userData?.studentCategory || 'National';
  const isInternationalStudent = studentCategory.toLowerCase() === 'international';
  
  const displayBooking = booking;

  const approvedRoommates = roommateRequests.filter((request) => request.status === 'approved');
  const pendingRoommateRequest = roommateRequests.find((request) => request.status === 'pending');
  const currentOccupancy = displayBooking ? 1 + approvedRoommates.length : 0;
  const roomCapacity = displayBooking ? Math.min(3, Number(displayBooking.rooms?.total_seats || 3)) : 0;
  const canPrimaryResidentAddRoommate = Boolean(
    displayBooking &&
    displayBooking.occupant_role !== 'approved_roommate' &&
    !pendingRoommateRequest &&
    currentOccupancy < roomCapacity
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
    <div className="min-h-screen bg-background text-on-background py-10 transition-colors duration-300">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Tabs */}
          <div className="w-full lg:w-64 space-y-2 shrink-0">
            <div className="bg-surface-main border border-border-low rounded-xl p-4 space-y-1.5">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeTab === item.id 
                      ? 'bg-surface-container text-primary border border-border-low/20 shadow-sm' 
                      : 'text-text-secondary hover:bg-surface-container-low hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 opacity-70 ${activeTab === item.id ? 'rotate-90' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Core Content Box */}
          <div className="flex-grow">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-main border border-border-low rounded-xl p-6 lg:p-8 min-h-[500px]"
            >
              {/* Overview Subtab */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* No Booking Yet Banner */}
                  {!booking && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-extrabold text-text-primary">No Active Booking</h2>
                        <p className="text-text-secondary text-sm mt-2 max-w-sm mx-auto">You don't have an active room booking yet. Browse available PGs and secure your stay to unlock your resident dashboard.</p>
                      </div>
                      <button
                        onClick={() => navigate('/pgs')}
                        className="px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                      >
                        Browse & Book a PG
                      </button>
                    </div>
                  )}

                  {/* Dynamic Header - only shown when booking exists */}
                  {booking && (
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-low pb-6">
                    <div>
                      <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Welcome back, {residentFirstName}</h1>
                      <p className="text-text-secondary text-sm mt-1 font-semibold">
                        {displayBooking.rooms?.room_number ? `Room #${displayBooking.rooms.room_number}` : 'Room Pending'} • {displayBooking.pgs?.name || 'Property'}
                      </p>
                    </div>
                    {displayBooking && (
                      <div className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border font-mono uppercase tracking-wider select-none ${
                        displayBooking.status === 'confirmed'
                          ? 'bg-success/15 text-success border-success/20 animate-pulse'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {displayBooking.status === 'confirmed' ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0 animate-spin" />
                        )}
                        <span>
                          {displayBooking.status === 'confirmed' ? 'Residency: Verified Active' : 'Residency: Pending Approval'}
                        </span>
                      </div>
                    )}
                  </div>
                  )}

                  {displayBooking && (
                    <div className="space-y-8">
                      
                      {/* Booking Approval Banner */}
                      {displayBooking.status === 'confirmed' ? (
                        <div className="bg-success/5 border border-success/30 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="space-y-2">
                            <div className="inline-flex items-center space-x-1.5 bg-success text-on-primary px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Official Confirmation</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">Welcome Home, {residentFirstName}! 🏡</h3>
                            <p className="text-text-secondary text-sm font-medium">
                              Your residency at <span className="font-bold text-text-primary">{displayBooking.pgs?.name}</span> has been officially approved.
                            </p>
                          </div>
                          <button 
                            onClick={() => generateRentReceiptPDF(displayBooking, userData, displayBooking.pgs)}
                            className="px-4 py-2.5 bg-surface-main border border-border-low rounded-lg text-text-primary hover:bg-surface-container transition-colors text-xs font-bold flex items-center gap-2 cursor-pointer"
                          >
                            <Download className="w-4 h-4 text-primary" />
                            <span>Download Receipt</span>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl space-y-2">
                          <div className="inline-flex items-center space-x-1.5 bg-primary text-on-primary px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>Verification Pending</span>
                          </div>
                          <h3 className="text-lg font-bold text-text-primary">Securing Residency Details</h3>
                          <p className="text-text-secondary text-sm">
                            Our admins are verifying your room payment. Your utility panel will open here as soon as verification completes.
                          </p>
                        </div>
                      )}

                      {/* Status Widgets Bento Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Next Rent Due */}
                        <div className="bg-surface-main border border-border-low rounded-xl p-6 hover:border-outline transition-all duration-300 flex flex-col justify-between h-full shadow-sm">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="font-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest">Next Rent Due</span>
                              <Calendar className="w-5 h-5 text-primary shrink-0" />
                            </div>
                            <div className="mb-6">
                              <h2 className="text-3xl font-extrabold text-text-primary">₹{(displayBooking.rooms?.price_per_seat || '—').toLocaleString()}</h2>
                              <p className="text-xs font-semibold text-text-secondary mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping shrink-0"></span>
                                <span>Monthly Room Rent</span>
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveTab('payments')}
                            className="w-full py-3 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                          >
                            Pay Now
                          </button>
                        </div>

                        {/* Electricity Usage */}
                        <div className="bg-surface-main border border-border-low rounded-xl p-6 hover:border-outline transition-all duration-300 shadow-sm flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="font-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest">Current Electricity</span>
                              <Zap className="w-5 h-5 text-success shrink-0" />
                            </div>
                            <div className="mb-5">
                              <h2 className="text-3xl font-extrabold text-text-primary">—</h2>
                              <p className="text-[11px] font-semibold text-text-secondary mt-1">No bill generated yet this cycle</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                              <div className="bg-success/40 h-full" style={{ width: '0%' }}></div>
                            </div>
                            <div className="flex justify-between font-mono text-[9px] font-bold text-text-secondary uppercase tracking-wider">
                              <span>Current</span>
                              <span>Awaiting data</span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Complaints */}
                        <div className="bg-surface-main border border-border-low rounded-xl p-6 hover:border-outline transition-all duration-300 shadow-sm flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="font-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest">Recent Complaints</span>
                              <MessageSquare className="w-5 h-5 text-error shrink-0" />
                            </div>
                            <div className="space-y-4">
                              {recentComplaints.length > 0 ? (
                                recentComplaints.slice(0, 2).map((complaint) => (
                                  <div key={complaint.id} className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                      complaint.status === 'resolved' 
                                        ? 'bg-success' 
                                        : complaint.status === 'in_progress' 
                                          ? 'bg-amber-500' 
                                          : 'bg-primary'
                                    }`}></div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-text-primary leading-tight truncate">{complaint.title}</p>
                                      <p className="font-mono text-[9px] font-bold text-text-secondary uppercase mt-0.5 tracking-wider">
                                        {complaint.status} • {new Date(complaint.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="py-2 flex items-start gap-2.5 text-text-secondary">
                                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-text-primary leading-tight">All systems nominal</p>
                                    <p className="font-mono text-[9px] font-bold uppercase mt-0.5 tracking-wider">No active tickets</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveTab('complaints')}
                            className="w-full py-2 bg-surface-container border border-border-low text-text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer"
                          >
                            View All Tickets
                          </button>
                        </div>

                      </div>

                      {/* Transaction History Section */}
                      <section className="bg-surface-main border border-border-low rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-border-low flex items-center justify-between bg-surface-container/20">
                          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Recent Transactions</h3>
                          <button 
                            onClick={() => setActiveTab('payments')}
                            className="text-primary font-bold text-xs flex items-center gap-1.5 hover:underline cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span>Billing History</span>
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-surface-container/10">
                              <tr>
                                <th className="px-6 py-3 font-mono text-[9px] font-bold text-text-secondary uppercase tracking-widest">Invoice ID</th>
                                <th className="px-6 py-3 font-mono text-[9px] font-bold text-text-secondary uppercase tracking-widest">Category</th>
                                <th className="px-6 py-3 font-mono text-[9px] font-bold text-text-secondary uppercase tracking-widest">Date</th>
                                <th className="px-6 py-3 font-mono text-[9px] font-bold text-text-secondary uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-3 font-mono text-[9px] font-bold text-text-secondary uppercase tracking-widest">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-low/60 font-semibold text-xs text-text-primary">
                              {recentPayments.length > 0 ? (
                                recentPayments.map((p) => (
                                  <tr key={p.id} className="hover:bg-surface-container/10 transition-colors">
                                    <td className="px-6 py-4 font-mono text-text-primary">#INV-{p.id.substring(0, 4).toUpperCase()}</td>
                                    <td className="px-6 py-4 text-text-secondary">{p.type || 'Monthly Rent'}</td>
                                    <td className="px-6 py-4 text-text-secondary">{new Date(p.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-text-primary font-bold">₹{p.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                                        p.status === 'success' 
                                          ? 'bg-success/15 text-success border-success/20' 
                                          : 'bg-error/15 text-error border-error/20'
                                      }`}>
                                        {p.status === 'success' ? 'PAID' : 'FAILED'}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="5" className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2 text-text-secondary/50">
                                      <CreditCard className="w-8 h-8" />
                                      <p className="text-xs font-semibold uppercase tracking-wider">No transactions yet</p>
                                      <p className="text-[10px]">Your payment receipts will appear here once rent is paid.</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {/* Quick Stats & Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Room Details Grid */}
                        <div className="bg-surface-main border border-border-low rounded-xl p-6 shadow-sm">
                          <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-5 border-b border-border-low pb-3">Room Details</h4>
                          <div className="grid grid-cols-2 gap-6 text-xs font-semibold text-text-secondary">
                            <div>
                              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-text-secondary/60">Room Type</p>
                              <p className="text-text-primary font-bold mt-0.5">
                                {displayBooking.rooms?.total_seats == 1 ? 'Single Room' : displayBooking.rooms?.total_seats == 2 ? 'Twin Sharing' : 'Multi Sharing'} • AC
                              </p>
                            </div>
                            <div>
                              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-text-secondary/60">Check-in Date</p>
                              <p className="text-text-primary font-bold mt-0.5">
                                {new Date(displayBooking.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <div>
                              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-text-secondary/60">Notice Period</p>
                              <p className="text-text-primary font-bold mt-0.5">30 Days</p>
                            </div>
                            <div>
                              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-text-secondary/60">Security Deposit</p>
                              <p className="text-text-primary font-bold mt-0.5">₹{(displayBooking.pgs?.security_deposit || 29000).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* View Property Photos */}
                        <div 
                          onClick={() => {
                            if (displayBooking.pgs) {
                              navigate(`/pg/${slugifyPG(displayBooking.pgs.name, displayBooking.pgs.address, displayBooking.pgs.city)}--${displayBooking.pgs.id}`);
                            }
                          }}
                          className="bg-surface-main border border-border-low rounded-xl p-6 relative overflow-hidden flex items-center justify-center group cursor-zoom-in shadow-sm min-h-[175px]"
                        >
                          <img 
                            alt="Room Preview" 
                            className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700" 
                            src={displayBooking.pgs?.main_image || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80"}
                          />
                          <div className="text-center relative z-10 p-5 rounded-xl bg-surface-main/60 backdrop-blur-sm border border-border-low/40 shadow-sm max-w-[85%] select-none">
                            <ImageIcon className="w-8 h-8 text-primary mb-2 shrink-0 block mx-auto" />
                            <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">Tour Property</h4>
                            <p className="text-[10px] font-semibold text-text-secondary mt-0.5">View amenities, common spaces, and rooms</p>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* Specific Subtab Widgets */}
              {activeTab === 'bills' && <ElectricityBill booking={displayBooking} userData={userData} />}
              {activeTab === 'complaints' && <Complaints booking={displayBooking} userData={userData} />}
              {activeTab === 'payments' && <Payments booking={displayBooking} userData={userData} />}
              {activeTab === 'profile' && <Profile />}

              {/* Roommates request Subtab */}
              {activeTab === 'roommates' && displayBooking && (
                <div className="space-y-6">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-low pb-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Roommate Allocations</h2>
                      <p className="text-text-secondary text-sm mt-0.5">Invite your roommates or verify pending invitations.</p>
                    </div>
                    <div className="px-3.5 py-1 bg-surface-container border border-border-low rounded-lg text-xs font-bold font-mono text-text-primary uppercase shrink-0">
                      Room #{displayBooking.rooms?.room_number}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-surface-container-low border border-border-low p-4 rounded-xl">
                      <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Current Residents</span>
                      <span className="block text-2xl font-bold text-primary mt-1">{currentOccupancy}</span>
                    </div>
                    <div className="bg-surface-container-low border border-border-low p-4 rounded-xl">
                      <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Capacity Max</span>
                      <span className="block text-2xl font-bold text-primary mt-1">{roomCapacity || 1}</span>
                    </div>
                    <div className="bg-surface-container-low border border-border-low p-4 rounded-xl">
                      <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Occupant Role</span>
                      <span className="block text-sm font-bold text-primary mt-2 truncate">
                        {displayBooking.occupant_role === 'approved_roommate' ? 'Roommate' : 'Primary Holder'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Add Roommate form */}
                    <div className="bg-surface-main p-6 border border-border-low rounded-xl space-y-4 shadow-sm">
                      <h3 className="text-lg font-bold text-text-primary tracking-tight">
                        {roommateProfile ? 'Resident Occupant Details' : 'Invite Student Resident'}
                      </h3>
                      {roommateProfile ? (
                        <div className="p-5 bg-success/5 border border-success/30 rounded-xl space-y-4 shadow-sm animate-in fade-in duration-300">
                          <div className="flex items-center gap-3 border-b border-success/20 pb-3">
                            <div className="p-2 bg-success/15 text-success rounded-lg">
                              <ShieldCheck className="w-5 h-5 shrink-0" />
                            </div>
                            <div>
                              <h4 className="font-bold text-text-primary text-sm">
                                {roommateProfile.is_primary_holder ? 'Primary Resident (Main Tenant)' : 'Linked Roommate Profile'}
                              </h4>
                              <p className="text-[9px] font-bold text-success uppercase tracking-wider font-mono">Verified Active Occupant</p>
                            </div>
                          </div>
                          <div className="space-y-3 text-xs font-semibold text-text-secondary">
                            <div>
                              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-text-secondary/60">Full Name</p>
                              <p className="text-text-primary font-bold mt-0.5">{roommateProfile.roommate_full_name}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-text-secondary/60">Email Address</p>
                              <p className="text-text-primary font-bold mt-0.5">{roommateProfile.roommate_email}</p>
                            </div>
                            {roommateProfile.roommate_phone && (
                              <div>
                                <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-text-secondary/60">Phone Number</p>
                                <p className="text-text-primary font-bold mt-0.5">{roommateProfile.roommate_phone}</p>
                              </div>
                            )}
                            <div className="pt-2 border-t border-border-low/60 flex justify-between items-center text-[10px] font-bold uppercase">
                              <span className="text-text-secondary/60 font-mono">Resident Origin</span>
                              <span className="text-primary">{roommateProfile.user?.student_category || roommateProfile.user?.studentCategory || 'National'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                              <span className="text-text-secondary/60 font-mono">KYC Verification Status</span>
                              {roommateProfile.booking?.is_kyc_verified || roommateProfile.is_primary_holder ? (
                                <span className="text-success flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Verified Profile</span>
                              ) : (
                                <span className="text-amber-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Documents Auditing</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : canPrimaryResidentAddRoommate ? (
                        <form onSubmit={handleRoommateRequest} className="space-y-4">
                          <input
                            required
                            placeholder="Roommate Full Name"
                            value={roommateForm.full_name}
                            onChange={(e) => setRoommateForm({ ...roommateForm, full_name: e.target.value })}
                            className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-lg text-text-primary text-sm placeholder:text-text-secondary/50 focus:border-primary focus:outline-none transition-colors"
                          />
                          <input
                            required
                            type="email"
                            placeholder="Roommate Email Address"
                            value={roommateForm.email}
                            onChange={(e) => setRoommateForm({ ...roommateForm, email: e.target.value })}
                            className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-lg text-text-primary text-sm placeholder:text-text-secondary/50 focus:border-primary focus:outline-none transition-colors"
                          />
                          <input
                            placeholder="Roommate Phone Number (Optional)"
                            value={roommateForm.phone_number}
                            onChange={(e) => setRoommateForm({ ...roommateForm, phone_number: e.target.value })}
                            className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-lg text-text-primary text-sm placeholder:text-text-secondary/50 focus:border-primary focus:outline-none transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={roommateSubmitting}
                            className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {roommateSubmitting ? 'Transmitting...' : 'Send Roommate Request'}
                          </button>
                        </form>
                      ) : (
                        <div className="p-5 bg-surface-container-low border border-border-low rounded-xl text-xs font-semibold text-text-secondary leading-relaxed space-y-2">
                          <p className="text-primary font-bold">
                            {displayBooking.occupant_role === 'approved_roommate'
                              ? 'Only the primary resident holder can dispatch roommate invitations.'
                              : pendingRoommateRequest
                                ? 'An invitation request is currently pending admin verification.'
                                : approvedRoommates.length > 0
                                  ? 'A roommate is already approved. Contact admin for additional spots.'
                                  : 'This room capacity does not support another resident.'}
                          </p>
                          <p className="opacity-70 font-normal">Invited students should register using the exact email address to link profiles cleanly.</p>
                        </div>
                      )}
                    </div>

                    {/* Roommate invitations statuses */}
                    <div className="bg-surface-main p-6 border border-border-low rounded-xl space-y-4 shadow-sm">
                      <h3 className="text-lg font-bold text-text-primary tracking-tight">Request Status Directory</h3>
                      {roommateRequests.length > 0 ? (
                        <div className="space-y-3">
                          {roommateRequests.map((request) => (
                            <div key={request.id} className="p-4 bg-surface-container-low rounded-lg border border-border-low flex justify-between items-start gap-4">
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-text-primary truncate">{request.roommate_full_name}</div>
                                <div className="text-xs text-text-secondary truncate">{request.roommate_email}</div>
                                <div className="text-[10px] text-text-secondary/70 mt-1 font-mono">{request.roommate_phone || 'No phone'}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold shrink-0 ${
                                request.status === 'approved' ? 'bg-success/15 text-success' :
                                request.status === 'rejected' ? 'bg-error/15 text-error' :
                                'bg-primary/20 text-primary'
                              }`}>
                                {request.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-text-secondary opacity-50 border border-dashed border-border-low rounded-lg bg-surface-container-low">
                          <Users className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs font-semibold uppercase tracking-wider">No roommate invites found</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'roommates' && !displayBooking && (
                <div className="text-center py-16 bg-surface-container-low border border-dashed border-border-low rounded-xl space-y-2">
                  <Users className="w-10 h-10 text-outline mx-auto" />
                  <h3 className="text-base font-bold text-text-primary">No Active Stays</h3>
                  <p className="text-text-secondary text-xs">You can invite roommates once a stay booking is confirmed.</p>
                </div>
              )}

              {/* KYC Verification Hub */}
              {activeTab === 'kyc' && displayBooking && (
                <div className="space-y-6">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-low pb-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Verification Center</h2>
                      <p className="text-text-secondary text-sm mt-0.5">
                        {studentCategory} documents unlock once the admin confirms booking payments.
                      </p>
                    </div>
                    <div className={`flex items-center px-4.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border shrink-0 ${
                      displayBooking.is_kyc_verified 
                        ? 'bg-success/15 text-success border-success/30' 
                        : 'bg-primary/20 text-primary border-primary/30'
                    }`}>
                      {displayBooking.is_kyc_verified ? (
                        <><ShieldCheck className="w-4 h-4 mr-1.5" /> Verified Profile</>
                      ) : (
                        <><Clock className="w-4 h-4 mr-1.5" /> Auditing KYC</>
                      )}
                    </div>
                  </div>

                  {displayBooking.status !== 'confirmed' ? (
                    <div className="bg-primary/5 border border-primary/20 p-8 rounded-xl text-center space-y-2">
                      <Clock className="w-10 h-10 text-primary mx-auto mb-2 animate-pulse" />
                      <h3 className="text-lg font-bold text-text-primary">Admin confirmation pending</h3>
                      <p className="text-text-secondary text-sm max-w-md mx-auto leading-relaxed">
                        Your room is reserved. Document uploads will open here as soon as the admin marks your booking verified.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Guidelines Cards & Required templates download */}
                      <div className="lg:col-span-1 bg-surface-container-low border border-border-low p-6 rounded-xl space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
                            <span>⚠️</span>
                            <span>Upload Guidelines</span>
                          </h3>
                          <ul className="space-y-2.5 text-xs text-text-secondary font-semibold">
                            {[
                              "Scan clear, high-contrast copies",
                              "Files are optimized on upload",
                              "Max file size: 1MB per document",
                              "Self-attested copies preferred"
                            ].map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Templates Center */}
                        {displayBooking.pgs && (
                          <div className="pt-6 border-t border-border-low space-y-4">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-text-secondary">Required Official Templates</h4>
                            
                            <div className="space-y-3">
                              {/* Vidu Authorization (International only) */}
                              {isInternationalStudent && (
                                <div className="space-y-1.5">
                                  <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Vidu Authorization</p>
                                  {displayBooking.pgs?.owner_doc_url ? (
                                    <a 
                                      href={displayBooking.pgs.owner_doc_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="w-full flex items-center justify-center py-2.5 bg-primary text-on-primary rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all gap-1.5 shrink-0"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Get Vidu Form
                                    </a>
                                  ) : (
                                    <div className="p-3 bg-error/10 text-error rounded-lg text-[10px] font-semibold border border-error/20 italic">
                                      Vidu Form Not Loaded
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Police verification templates */}
                              <div className="space-y-1.5">
                                <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Police Verification</p>
                                {displayBooking.pgs?.police_verification_template_url ? (
                                  <a 
                                    href={displayBooking.pgs.police_verification_template_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center py-2.5 bg-primary text-on-primary rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all gap-1.5 shrink-0"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Get Police Form
                                  </a>
                                ) : (
                                  <div className="p-3 bg-surface-container border border-border-low rounded-lg text-[10px] font-semibold text-text-secondary italic">
                                    No police template loaded
                                  </div>
                                )}
                              </div>

                              {/* Dynamic custom templates */}
                              {docRequirements.map((req) => (
                                req.template_url && (
                                  <div key={req.id} className="space-y-1.5">
                                    <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">{req.document_name}</p>
                                    <a 
                                      href={req.template_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="w-full flex items-center justify-center py-2.5 bg-surface-container border border-border-low text-text-primary rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-surface-container-high transition-all gap-1.5 shrink-0"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Get {req.document_name}
                                    </a>
                                  </div>
                                )
                              ))}

                            </div>
                          </div>
                        )}
                      </div>

                      {/* Upload Center */}
                      <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-base text-text-primary">Official Upload Directory</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {kycDocuments.map((doc) => {
                            const isUploaded = Boolean(displayBooking[doc.id]);
                            return (
                              <div key={doc.id} className={`p-5 rounded-lg border transition-all duration-300 flex flex-col justify-between h-44 ${
                                isUploaded 
                                  ? 'bg-success/5 border-success/30' 
                                  : 'bg-surface-main border-border-low hover:border-outline shadow-sm'
                              }`}>
                                <div className="flex items-start justify-between">
                                  <div className={`p-2.5 rounded-lg ${isUploaded ? 'bg-success/10 text-success' : 'bg-surface-container-high text-outline'}`}>
                                    <doc.icon className="w-5 h-5 shrink-0" />
                                  </div>
                                  
                                  {isUploaded ? (
                                    <div className="flex gap-1.5">
                                      <button 
                                        onClick={async () => {
                                          const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(displayBooking[doc.id], 60);
                                          if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                                        }}
                                        className="p-1.5 bg-surface-main text-success rounded border border-success/20 hover:bg-success/10 shadow-sm shrink-0 cursor-pointer"
                                        title="View File"
                                      >
                                        <FileSearch className="w-3.5 h-3.5" />
                                      </button>
                                      <div className="p-1.5 bg-success text-on-primary rounded shrink-0">
                                        <FileCheck className="w-3.5 h-3.5" />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                      doc.req ? 'bg-error/15 text-error' : 'bg-surface-container-high text-text-secondary/60'
                                    }`}>
                                      {doc.req ? 'Required' : 'Optional'}
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <h4 className="font-bold text-sm text-text-primary truncate">{doc.label}</h4>
                                  <p className="text-[9px] text-text-secondary/80 font-mono tracking-wider uppercase mt-0.5">
                                    {isUploaded ? 'SUCCESSFULLY AUDITED' : 'WAITING FOR FILE'}
                                  </p>
                                </div>

                                {isUploaded ? (
                                  <div className={`w-full py-2 rounded text-[10px] font-bold uppercase tracking-wider text-center ${displayBooking.is_kyc_verified ? 'bg-success/10 text-success border border-success/20' : 'bg-surface-main border border-success/20 text-success'}`}>
                                    {displayBooking.is_kyc_verified ? 'KYC Verified' : 'Already Uploaded'}
                                  </div>
                                ) : (
                                  <label className="w-full flex items-center justify-center py-2 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors bg-primary text-on-primary hover:opacity-90">
                                    <Upload className="w-3 h-3 mr-1.5 shrink-0" />
                                    <span>Choose File</span>
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      onChange={(e) => handleDocUpload(e.target.files[0], doc.id)}
                                    />
                                  </label>
                                )}
                              </div>
                            );
                          })}

                          {/* Dynamic Custom Document Slots */}
                          {docRequirements.map((req) => {
                            const uploaded = dynamicDocs.find(d => d.requirement_id === req.id);
                            const isUploaded = Boolean(uploaded);
                            return (
                              <div key={req.id} className={`p-5 rounded-lg border transition-all duration-300 flex flex-col justify-between h-44 ${
                                isUploaded 
                                  ? (uploaded.status === 'verified' ? 'bg-success/5 border-success/30' : 'bg-primary/5 border-primary/30') 
                                  : 'bg-surface-main border-border-low hover:border-outline shadow-sm'
                              }`}>
                                <div className="flex items-start justify-between">
                                  <div className={`p-2.5 rounded-lg ${isUploaded ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-outline'}`}>
                                    <Shield className="w-5 h-5 shrink-0" />
                                  </div>
                                  
                                  {isUploaded ? (
                                    <div className="flex gap-1.5">
                                      <button 
                                        onClick={() => window.open(uploaded.uploaded_url, '_blank')}
                                        className="p-1.5 bg-surface-main text-primary rounded border border-primary/20 hover:bg-primary/15 shadow-sm shrink-0 cursor-pointer"
                                        title="View File"
                                      >
                                        <FileSearch className="w-3.5 h-3.5" />
                                      </button>
                                      <div className={`p-1.5 rounded text-on-primary shrink-0 ${uploaded.status === 'verified' ? 'bg-success' : 'bg-primary'}`}>
                                        {uploaded.status === 'verified' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-error/15 text-error">
                                      Required
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <h4 className="font-bold text-sm text-text-primary truncate">{req.document_name}</h4>
                                  <p className="text-[9px] text-text-secondary/80 font-mono tracking-wider uppercase mt-0.5">
                                    {isUploaded ? (uploaded.status === 'rejected' ? `REJECTED: ${uploaded.rejection_reason}` : uploaded.status.toUpperCase()) : 'WAITING FOR FILE'}
                                  </p>
                                </div>

                                {isUploaded && uploaded.status !== 'rejected' ? (
                                  <div className={`w-full py-2 rounded text-[10px] font-bold uppercase tracking-wider text-center ${uploaded.status === 'verified' ? 'bg-success/10 text-success border border-success/20' : 'bg-surface-main border border-success/20 text-success'}`}>
                                    {uploaded.status === 'verified' ? 'KYC Verified' : 'Already Uploaded'}
                                  </div>
                                ) : (
                                  <label className={`w-full flex items-center justify-center py-2 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                                    isUploaded 
                                      ? 'bg-error/10 border border-error/20 text-error hover:bg-error/20 shadow-sm' 
                                      : 'bg-primary text-on-primary hover:opacity-90'
                                  }`}>
                                    <Upload className="w-3 h-3 mr-1.5 shrink-0" />
                                    <span>{isUploaded ? 'Re-upload File' : 'Choose File'}</span>
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      onChange={(e) => handleDynamicDocUpload(e.target.files[0], req.id, req.document_name)}
                                    />
                                  </label>
                                )}
                              </div>
                            );
                          })}

                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {activeTab === 'kyc' && !displayBooking && (
                <div className="text-center py-16 bg-surface-container-low border border-dashed border-border-low rounded-xl space-y-2">
                  <ShieldCheck className="w-10 h-10 text-outline mx-auto" />
                  <h3 className="text-base font-bold text-text-primary">No Active Stays</h3>
                  <p className="text-text-secondary text-xs">KYC portals open once your stay is confirmed.</p>
                </div>
              )}

              {/* Admin Portal route links */}
              {isAdmin && (activeTab === 'admin' || activeTab === 'team' || activeTab === 'pgs' || activeTab === 'bills_admin' || activeTab === 'complaints_admin' || activeTab === 'queries_admin' || activeTab === 'revenue' || activeTab === 'users_admin' || activeTab === 'workers_admin') && (
                <AdminPanel section={activeTab} />
              )}

            </motion.div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;

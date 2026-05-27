import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Building2, 
  Users, 
  MessageSquare, 
  IndianRupee, 
  UserPlus, 
  CheckCircle2,
  Clock,
  MoreVertical,
  X,
  Shield,
  ShieldCheck,
  Search,
  LayoutDashboard,
  Zap,
  Filter,
  FileText,
  Upload,
  Download, 
  Image as ImageIcon, 
  Wrench, 
  Droplets, 
  Wifi,
  Globe,
  FileSearch,
  FileX,
  FileCheck,
  FileEdit,
  ChevronDown,
  Home,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '../utils/imageUtils';

const AdminPanel = ({ section = 'admin' }) => {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activePGs: 0,
    pendingComplaints: 0,
    totalRevenue: 0
  });
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [pgs, setPgs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [contactQueries, setContactQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubAdminModal, setShowSubAdminModal] = useState(false);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showAddPGModal, setShowAddPGModal] = useState(false);
  const [showEditPGModal, setShowEditPGModal] = useState(false);
  const [editingPG, setEditingPG] = useState(null);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [showAdminOccupantModal, setShowAdminOccupantModal] = useState(false);
  const [selectedTenantForOccupant, setSelectedTenantForOccupant] = useState(null);
  
  const [selectedPG, setSelectedPG] = useState(null);
  const [viewingPG, setViewingPG] = useState(null);
  const [schemaIssues, setSchemaIssues] = useState([]);
  
  // Tenants Modal
  const [showTenantsModal, setShowTenantsModal] = useState(false);
  const [selectedPGForTenants, setSelectedPGForTenants] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [kycUrls, setKycUrls] = useState({});
  
  // Form States
  const [newPG, setNewPG] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    security_deposit: 2000,
    amenities: '',
    rules: '',
    accommodation_type: 'Indian',
    google_map_url: ''
  });
  const [pgImage, setPgImage] = useState(null);
  const [pgImagePreview, setPgImagePreview] = useState(null);
  const [pgImages, setPgImages] = useState([]);
  const [pgImagePreviews, setPgImagePreviews] = useState([]);
  const [ownerDoc, setOwnerDoc] = useState(null);
  const [ownerDocName, setOwnerDocName] = useState('');
  const [policeDoc, setPoliceDoc] = useState(null);
  const [policeDocName, setPoliceDocName] = useState('');

  const [newRoom, setNewRoom] = useState({
    room_number: '',
    total_seats: 2,
    price_per_seat: 5000,
    amenities: ''
  });
  const [roomImage, setRoomImage] = useState(null);
  const [roomImagePreview, setRoomImagePreview] = useState(null);

  const [newBill, setNewBill] = useState({
    room_id: '',
    units: '',
    rate: 10,
    billing_month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  });
  const [adminOccupantForm, setAdminOccupantForm] = useState({ full_name: '', email: '', phone_number: '' });

  // Dynamic Document Template States
  const [showDocManager, setShowDocManager] = useState(false);
  const [docRequirements, setDocRequirements] = useState([]);
  const [newDocRequirement, setNewDocRequirement] = useState({ name: '', is_mandatory: true });
  const [docTemplate, setDocTemplate] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [dynamicDocs, setDynamicDocs] = useState([]);

  const [billHistory, setBillHistory] = useState([]);
  const [chartSelectedPGId, setChartSelectedPGId] = useState('all');
  const [chartSelectedRoomId, setChartSelectedRoomId] = useState('all');
  const [formSelectedPGId, setFormSelectedPGId] = useState('all');
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const isSuperAdmin = userData?.role === 'super_admin';
  const isAdmin = userData?.role === 'admin' || isSuperAdmin;

  const MOCKUP_IMAGE = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80";
  const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];
  const MAX_PG_IMAGES = 6;

  const roomDisplayName = (pgName, roomNumber) => {
    return `${pgName || 'PG'} - Room ${roomNumber || 'N/A'}`;
  };

  const getApprovedRoommateCount = (tenant) => tenant.roommate_requests?.filter((request) => request.status === 'approved').length || 0;
  const getCurrentOccupancy = (tenant) => (tenant ? 1 + getApprovedRoommateCount(tenant) : 0);
  const getRoomCapacity = (tenant) => Math.min(3, Number(tenant?.rooms?.total_seats || 3));
  const canAdminAddThirdOccupant = (tenant) => getCurrentOccupancy(tenant) === 2 && getRoomCapacity(tenant) >= 3;

  const getPrimaryRoommateRequest = (tenant) => {
    return tenant.roommate_requests?.find((request) => request.status === 'pending')
      || tenant.roommate_requests?.find((request) => request.status === 'approved')
      || tenant.roommate_requests?.[0];
  };

  const fetchAllTenants = async () => {
    setLoading(true);
    try {
      // 1. Fetch all bookings directly
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          users (id, full_name, email, phone_number, parent_phone_number, address, city, state, student_category),
          rooms (room_number, total_seats),
          pgs (name),
          roommate_requests (*)
        `)
        .order('created_at', { ascending: false });

      if (bookingError) throw bookingError;

      // Identify missing roommate records & fetch registered details for all roommate requests
      const allRoommateEmails = (bookingData || [])
        .flatMap(b => b.roommate_requests || [])
        .map(r => r.roommate_email.toLowerCase());

      let roommateUserMap = {};
      if (allRoommateEmails.length > 0) {
        const { data: usersWithEmails } = await supabase
          .from('users')
          .select('id, email, full_name, phone_number')
          .in('email', allRoommateEmails);
        
        if (usersWithEmails) {
          usersWithEmails.forEach(u => {
            roommateUserMap[u.email.toLowerCase()] = u;
          });
        }
      }

      // Map registered roommate user records to requests
      const mappedBookings = (bookingData || []).map(b => {
        if (b.roommate_requests) {
          b.roommate_requests = b.roommate_requests.map(r => ({
            ...r,
            roommate_user: roommateUserMap[r.roommate_email.toLowerCase()] || null
          }));
        }
        return b;
      });

      // 2. Identify missing roommate records
      const roommateEmails = (mappedBookings || [])
        .flatMap(b => b.roommate_requests || [])
        .filter(r => r.status === 'approved')
        .map(r => r.roommate_email.toLowerCase());

      let roommateBookings = [];
      if (roommateEmails.length > 0) {
        const { data: roommateUsers } = await supabase
          .from('users')
          .select('id, email')
          .in('email', roommateEmails);
        
        if (roommateUsers?.length > 0) {
          // Check who doesn't have a booking yet
          const missingRoommates = roommateUsers.filter(u => !mappedBookings.some(b => b.user_id === u.id));
          
          if (missingRoommates.length > 0) {
            console.log('Fixing missing records for:', missingRoommates);
            for (const rm of missingRoommates) {
              const request = (mappedBookings || []).flatMap(b => b.roommate_requests || []).find(r => r.roommate_email.toLowerCase() === rm.email.toLowerCase());
              const primaryBooking = (mappedBookings || []).find(b => b.id === request?.booking_id);
              
              if (request && primaryBooking) {
                // Check if roommate booking already exists
                let { data: newRB } = await supabase
                  .from('bookings')
                  .select('*')
                  .eq('user_id', rm.id)
                  .eq('room_id', request.room_id)
                  .maybeSingle();
                
                if (!newRB) {
                  const { data: createdRB } = await supabase.from('bookings').insert([{
                    user_id: rm.id,
                    pg_id: primaryBooking.pg_id,
                    room_id: request.room_id,
                    status: 'confirmed',
                    occupant_role: 'approved_roommate',
                    amount: primaryBooking.amount
                  }]).select(`
                    *,
                    users (id, full_name, email, phone_number, parent_phone_number, address, city, state, student_category),
                    rooms (room_number, total_seats),
                    pgs (name)
                  `).single();
                  
                  newRB = createdRB;
                } else {
                  // Fetch with relations since the initial select was just *
                  const { data: fetchedRB } = await supabase
                    .from('bookings')
                    .select(`
                      *,
                      users (id, full_name, email, phone_number, parent_phone_number, address, city, state, student_category),
                      rooms (room_number, total_seats),
                      pgs (name)
                    `)
                    .eq('id', newRB.id)
                    .single();
                  newRB = fetchedRB;
                }
                
                if (newRB) roommateBookings.push(newRB);
              }
            }
          }
        }
      }

      // Combine and set
      const finalTenants = [...(mappedBookings || []), ...roommateBookings];
      setTenants(finalTenants);
    } catch (error) {
      console.error('Error fetching all tenants:', error);
      toast.error('Failed to load complete tenant list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    if (section === 'users_admin') {
      fetchAllTenants();
    }
  }, [section]);

  const fetchTenantsForList = async (pgId) => {
    try {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          *,
          users (id, full_name, email, phone_number, parent_phone_number, address, city, state, student_category),
          rooms (room_number, total_seats),
          pgs (name),
          roommate_requests (*)
        `)
        .eq('pg_id', pgId)
        .in('status', ACTIVE_BOOKING_STATUSES);

      const roommateEmails = (bookingData || [])
        .flatMap(b => b.roommate_requests || [])
        .filter(r => r.status === 'approved')
        .map(r => r.roommate_email.toLowerCase());

      let roommateBookings = [];
      if (roommateEmails.length > 0) {
        const { data: roommateUsers } = await supabase.from('users').select('id').in('email', roommateEmails);
        if (roommateUsers?.length > 0) {
          const { data: rbData } = await supabase
            .from('bookings')
            .select(`
              *,
              users (id, full_name, email, phone_number, parent_phone_number, address, city, state, student_category),
              rooms (room_number, total_seats),
              pgs (name)
            `)
            .in('user_id', roommateUsers.map(u => u.id))
            .eq('pg_id', pgId);
          roommateBookings = rbData || [];
        }
      }

      const combined = [...(bookingData || [])];
      roommateBookings.forEach(rb => {
        if (!combined.find(t => t.id === rb.id)) combined.push({ ...rb, is_roommate_row: true });
      });
      return combined;
    } catch (e) {
      return [];
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch PGs and Rooms
      const { data: pgData, error: pgError } = await supabase
        .from('pgs')
        .select('*, rooms (*)')
        .order('created_at', { ascending: false });
      
      if (pgError) throw pgError;
      if (pgData) {
        setPgs(pgData);
        const sample = pgData[0];
        if (sample) {
          const missing = [];
          if (!('owner_doc_url' in sample)) missing.push('owner_doc_url');
          if (!('police_verification_template_url' in sample)) missing.push('police_verification_template_url');
          setSchemaIssues(missing);
        }
      }

      // 2. Fetch Users count & stats
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: pgCount } = await supabase.from('pgs').select('*', { count: 'exact', head: true });
      const { count: complaintCount } = await supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      // 3. Fetch Payments
      const { data: paymentData } = await supabase
        .from('payments')
        .select(`*, bookings (*, users (*), pgs (*))`)
        .order('created_at', { ascending: false });
      
      if (paymentData) {
        setPayments(paymentData);
        const totalRev = paymentData.filter(p => p.status === 'success').reduce((acc, curr) => acc + Number(curr.amount), 0);
        setStats({
          totalUsers: userCount || 0,
          activePGs: pgCount || 0,
          pendingComplaints: complaintCount || 0,
          totalRevenue: totalRev
        });
      }

      // 4. Fetch Complaints
      const { data: complaintsData } = await supabase
        .from('complaints')
        .select(`*, pgs:pg_id (name), users:user_id (full_name), rooms:room_id (room_number)`)
        .order('created_at', { ascending: false });
      if (complaintsData) setComplaints(complaintsData);

      // 5. Fetch Tenants
      const { data: tenantData } = await supabase
        .from('bookings')
        .select(`
          *,
          users (id, full_name, email, phone_number, parent_phone_number, address, city, state, student_category),
          pgs (name),
          rooms (room_number, total_seats),
          roommate_requests (*)
        `)
        .in('status', ACTIVE_BOOKING_STATUSES)
        .order('created_at', { ascending: false });
      if (tenantData) {
        const uniqueTenants = [];
        const seenTenantKeys = new Set();
        
        tenantData.forEach(t => {
          const key = `${t.user_id}-${t.room_id}`;
          if (!seenTenantKeys.has(key)) {
            seenTenantKeys.add(key);
            uniqueTenants.push(t);
          }
        });
        
        setTenants(uniqueTenants);
      }

      // 6. Fetch Team and Workers
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (usersData) {
        setUsers(usersData.filter(user => ['admin', 'sub_admin', 'super_admin'].includes(user.role)));
        setWorkers(usersData.filter(user => ['plumber', 'electrician', 'wifi', 'service_worker'].includes(user.role)));
      }

      // 7. Fetch Contact Queries
      const { data: queryData } = await supabase
        .from('contact_queries')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryData) setContactQueries(queryData);

      // 8. Fetch Electricity Bills
      const { data: billsData } = await supabase
        .from('electricity_bills')
        .select('*, rooms (room_number, pgs (name))')
        .order('created_at', { ascending: false });
      if (billsData) setBillHistory(billsData);

    } catch (error) {
      console.error('Admin Data Fetch Error:', error);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, bookings(*, pgs(*), users(*))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchDocRequirements = async (pgId) => {
    try {
      const { data, error } = await supabase
        .from('pg_document_requirements')
        .select('*')
        .eq('pg_id', pgId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setDocRequirements(data || []);
    } catch (err) {
      console.error('Fetch requirements error:', err);
    }
  };

  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (!selectedPGForTenants) return;
    if (!newDocRequirement.name) return toast.error('Enter document name');
    
    setIsUploadingDoc(true);
    try {
      let templateUrl = null;
      if (docTemplate) {
        if (docTemplate.size > 1024 * 1024) throw new Error('Template must be under 1MB');
        
        const fileExt = docTemplate.name.split('.').pop();
        const fileName = `${Date.now()}_requirement.${fileExt}`;
        const filePath = `templates/${selectedPGForTenants.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pg-images')
          .upload(filePath, docTemplate);
        
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('pg-images').getPublicUrl(filePath);
        templateUrl = publicUrl;
      }

      const { error } = await supabase
        .from('pg_document_requirements')
        .insert([{
          pg_id: selectedPGForTenants.id,
          document_name: newDocRequirement.name,
          template_url: templateUrl,
          is_mandatory: newDocRequirement.is_mandatory
        }]);

      if (error) throw error;
      toast.success('Document requirement added!');
      setNewDocRequirement({ name: '', is_mandatory: true });
      setDocTemplate(null);
      fetchDocRequirements(selectedPGForTenants.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteRequirement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document requirement?')) return;
    try {
      const { error } = await supabase
        .from('pg_document_requirements')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Requirement removed');
      fetchDocRequirements(selectedPGForTenants.id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleApprovePayment = async (bookingId) => {
    try {
      const { data: booking, error: bookingFetchError } = await supabase
        .from('bookings')
        .select('room_id')
        .eq('id', bookingId)
        .single();

      if (bookingFetchError) throw bookingFetchError;

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);
      
      if (error) throw error;

      if (booking?.room_id) {
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ available_seats: 0 })
          .eq('id', booking.room_id);

        if (roomError) throw roomError;
      }

      toast.success('Payment approved and booking confirmed!');
      fetchAdminData(section);
      if (selectedPGForTenants) fetchTenants(selectedPGForTenants.id);
    } catch (error) {
      console.error(error);
      toast.error('Failed to approve payment');
    }
  };

  const handleApproveRentPayment = async (paymentId) => {
    try {
      // Fetch full payment details to get booking/room info
      const { data: paymentData, error: fetchError } = await supabase
        .from('payments')
        .select(`
          *,
          bookings (
            id, pg_id, room_id, user_id,
            pgs (name),
            rooms (room_number)
          )
        `)
        .eq('id', paymentId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Mark payment as success with approved timestamp
      const updatePayload = { status: 'success' };
      try {
        updatePayload.approved_at = new Date().toISOString();
      } catch (_) {}

      const { error: updateError } = await supabase
        .from('payments')
        .update(updatePayload)
        .eq('id', paymentId);
      if (updateError) throw updateError;

      toast.success(`✅ Offline payment approved! Receipt generated for ${paymentData?.bookings?.users?.full_name || 'resident'}.`);
      fetchAdminData(section);
    } catch (error) {
      console.error('Approve payment error:', error);
      toast.error('Failed to approve rent payment. Please try again.');
    }
  };

  const handleMarkBillPaid = async (billId) => {
    try {
      const { error } = await supabase.from('electricity_bills').update({ is_paid: true }).eq('id', billId);
      if (error) throw error;
      toast.success('Bill marked as paid');
      fetchAdminData(section);
    } catch (error) {
      toast.error('Failed to update electricity bill');
    }
  };

  const openBillModal = (bill = null) => {
    setEditingBill(bill);
    if (bill) {
      const parentPG = pgs.find(pg => pg.rooms?.some(r => r.id === bill.room_id));
      setFormSelectedPGId(parentPG ? parentPG.id : 'all');
    } else {
      setFormSelectedPGId('all');
    }
    setNewBill(
      bill
        ? {
            room_id: bill.room_id,
            units: bill.units,
            rate: bill.rate,
            billing_month: bill.billing_month
          }
        : {
            room_id: '',
            units: '',
            rate: 10,
            billing_month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
          }
    );
    setShowAddBillModal(true);
  };

  const closeBillModal = () => {
    setEditingBill(null);
    setShowAddBillModal(false);
    setFormSelectedPGId('all');
    setNewBill({
      room_id: '',
      units: '',
      rate: 10,
      billing_month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    });
  };

  const uploadImage = async (file, path) => {
    if (!file) return MOCKUP_IMAGE;
    
    try {
      const compressedBlob = await compressImage(file, 2);
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `${path}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('pg-images')
        .upload(filePath, compressedBlob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('pg-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Image Upload Error:', err);
      toast.error('Failed to upload image. Using mockup instead.');
      return MOCKUP_IMAGE;
    }
  };

  const resetAddPGForm = () => {
    setNewPG({
      name: '',
      description: '',
      address: '',
      city: '',
      security_deposit: 2000,
      amenities: '',
      rules: '',
      accommodation_type: 'Both',
      google_map_url: ''
    });
    setPgImages([]);
    setPgImagePreviews([]);
    setOwnerDoc(null);
    setOwnerDocName('');
    setPoliceDoc(null);
    setPoliceDocName('');
  };

  const handlePGImagesChange = (files) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    const availableSlots = MAX_PG_IMAGES - pgImages.length;
    if (availableSlots <= 0) {
      toast.error('Maximum 6 PG images allowed');
      return;
    }

    if (selectedFiles.length > availableSlots) {
      toast.error(`Only ${availableSlots} more image${availableSlots === 1 ? '' : 's'} can be added`);
    }

    const validFiles = selectedFiles.slice(0, availableSlots).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;
    setPgImages(prev => [...prev, ...validFiles]);
    setPgImagePreviews(prev => [...prev, ...validFiles.map(file => URL.createObjectURL(file))]);
  };

  const removePGImage = (index) => {
    setPgImages(prev => prev.filter((_, i) => i !== index));
    setPgImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const insertPGListing = async (payload) => {
    let insertPayload = { ...payload };

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { error } = await supabase.from('pgs').insert([insertPayload]);
      if (!error) return;

      const message = error.message || '';
      const missingColumn = message.match(/'([^']+)' column/)?.[1] || message.match(/column "([^"]+)"/)?.[1];
      if (!missingColumn || !(missingColumn in insertPayload)) {
        throw error;
      }

      console.warn(`Column '${missingColumn}' missing in database. Retrying insert without it.`);
      toast.error(`Warning: Database missing column '${missingColumn}'. This field was not saved. Please update your database schema.`);
      delete insertPayload[missingColumn];
    }
  };

  const handleAddPG = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const uploadedImageUrls = pgImages.length > 0
        ? await Promise.all(pgImages.map(file => uploadImage(file, 'pgs')))
        : [];
      const imageUrl = uploadedImageUrls[0] || MOCKUP_IMAGE;
      let docUrl = '';
      
      if (ownerDoc) {
        if (ownerDoc.size > 1024 * 1024) throw new Error('Vidu Document template must be under 1MB');
        const docFileName = `${Date.now()}_${ownerDoc.name}`;
        const { error: docError } = await supabase.storage
          .from('pg-images')
          .upload(`documents/${docFileName}`, ownerDoc);
        if (docError) throw docError;
        const { data: { publicUrl } } = supabase.storage.from('pg-images').getPublicUrl(`documents/${docFileName}`);
        docUrl = publicUrl;
      }

      let policeUrl = '';
      if (policeDoc) {
        if (policeDoc.size > 1024 * 1024) throw new Error('Police Verification template must be under 1MB');
        const policeFileName = `${Date.now()}_police_${policeDoc.name}`;
        const { error: policeError } = await supabase.storage
          .from('pg-images')
          .upload(`documents/${policeFileName}`, policeDoc);
        if (policeError) throw policeError;
        const { data: { publicUrl: pUrl } } = supabase.storage.from('pg-images').getPublicUrl(`documents/${policeFileName}`);
        policeUrl = pUrl;
      }
      
      await insertPGListing({
        ...newPG,
        main_image: imageUrl,
        images: uploadedImageUrls,
        owner_doc_url: docUrl,
        police_verification_template_url: policeUrl,
        google_map_url: newPG.google_map_url?.trim() || null,
        amenities: newPG.amenities.split(',').map(a => a.trim()).filter(a => a !== ''),
        rules: newPG.rules.split(',').map(r => r.trim()).filter(r => r !== '')
      });
      
      toast.success('PG Added Successfully!');
      setShowAddPGModal(false);
      resetAddPGForm();
      fetchAdminData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePGListing = async (pgId, updatePayload) => {
    // Robust update that handles missing columns in the database
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { error } = await supabase.from('pgs').update(updatePayload).eq('id', pgId);
      if (!error) return;

      const message = error.message || '';
      // Handle "column does not exist" or "Could not find the '...' column"
      const missingColumn = message.match(/'([^']+)' column/)?.[1] || message.match(/column "([^"]+)"/)?.[1];
      
      if (!missingColumn || !(missingColumn in updatePayload)) {
        throw error;
      }

      console.warn(`Column '${missingColumn}' missing in database. Retrying update without it.`);
      toast.error(`Warning: Database missing column '${missingColumn}'. This field was not saved. Please update your database schema.`);
      delete updatePayload[missingColumn];
    }
  };

  const handleUpdatePG = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = editingPG.main_image;
      if (pgImage) {
        imageUrl = await uploadImage(pgImage, 'pgs');
      }

      let docUrl = editingPG.owner_doc_url;
      if (ownerDoc) {
        if (ownerDoc.size > 1024 * 1024) throw new Error('Vidu Document template must be under 1MB');
        const docFileName = `${Date.now()}_${ownerDoc.name}`;
        const { error: docError } = await supabase.storage
          .from('pg-images')
          .upload(`documents/${docFileName}`, ownerDoc);
        if (docError) throw docError;
        const { data: { publicUrl } } = supabase.storage.from('pg-images').getPublicUrl(`documents/${docFileName}`);
        docUrl = publicUrl;
      }

      let policeUrl = editingPG.police_verification_template_url;
      if (policeDoc) {
        if (policeDoc.size > 1024 * 1024) throw new Error('Police Verification template must be under 1MB');
        const policeFileName = `${Date.now()}_police_${policeDoc.name}`;
        const { error: policeError } = await supabase.storage
          .from('pg-images')
          .upload(`documents/${policeFileName}`, policeDoc);
        if (policeError) throw policeError;
        const { data: { publicUrl: pUrl } } = supabase.storage.from('pg-images').getPublicUrl(`documents/${policeFileName}`);
        policeUrl = pUrl;
      }
      
      await updatePGListing(editingPG.id, {
        name: editingPG.name,
        description: editingPG.description,
        address: editingPG.address,
        city: editingPG.city,
        security_deposit: editingPG.security_deposit,
        main_image: imageUrl,
        owner_doc_url: docUrl,
        police_verification_template_url: policeUrl,
        accommodation_type: editingPG.accommodation_type,
        amenities: typeof editingPG.amenities === 'string' 
          ? editingPG.amenities.split(',').map(a => a.trim()).filter(a => a !== '')
          : editingPG.amenities,
        rules: typeof editingPG.rules === 'string'
          ? editingPG.rules.split(',').map(r => r.trim()).filter(r => r !== '')
          : editingPG.rules
      });
      
      toast.success('PG Updated Successfully!');
      setShowEditPGModal(false);
      setEditingPG(null);
      setPgImage(null);
      setPgImagePreview(null);
      setOwnerDoc(null);
      setOwnerDocName('');
      setPoliceDoc(null);
      setPoliceDocName('');
      fetchAdminData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const insertRoomListing = async (roomPayload) => {
    // Robust insert that handles missing columns in the database
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { error } = await supabase.from('rooms').insert([roomPayload]);
      if (!error) return;

      const message = error.message || '';
      const missingColumn = message.match(/'([^']+)' column/)?.[1] || message.match(/column "([^"]+)"/)?.[1];
      
      if (!missingColumn || !(missingColumn in roomPayload)) {
        throw error;
      }

      console.warn(`Column '${missingColumn}' missing in database. Retrying insert without it.`);
      toast.error(`Warning: Database missing column '${missingColumn}'. This field was not saved. Please update your database schema.`);
      delete roomPayload[missingColumn];
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const imageUrl = await uploadImage(roomImage, 'rooms');

      await insertRoomListing({
        ...newRoom,
        pg_id: selectedPG.id,
        available_seats: newRoom.total_seats,
        amenities: newRoom.amenities.split(',').map(a => a.trim()).filter(a => a !== ''),
        image_url: imageUrl
      });
      
      toast.success('Room Added Successfully!');
      setShowAddRoomModal(false);
      setNewRoom({ room_number: '', total_seats: 2, price_per_seat: 5000, amenities: '' });
      setRoomImage(null);
      setRoomImagePreview(null);
      fetchAdminData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', roomId);
      if (error) throw error;
      toast.success('Room Deleted Successfully!');
      fetchAdminData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeletePG = async (pgId) => {
    if (!window.confirm('Are you sure you want to delete this PG? This will also delete all associated rooms and bookings.')) return;
    try {
      const { error } = await supabase.from('pgs').delete().eq('id', pgId);
      if (error) throw error;
      toast.success('PG Deleted Successfully!');
      fetchAdminData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to permanently delete this tenant? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', tenantId);
      if (error) throw error;
      toast.success('Tenant Deleted Successfully!');
      
      // Remove from local state to update UI immediately
      setTenants(prev => prev.filter(t => t.id !== tenantId));
    } catch (error) {
      console.error('Delete Tenant Error:', error);
      toast.error(error.message || 'Failed to delete tenant');
    }
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    try {
      const amount = Number(newBill.units) * Number(newBill.rate);
      const payload = {
        room_id: newBill.room_id,
        units: Number(newBill.units),
        rate: Number(newBill.rate),
        billing_month: newBill.billing_month,
        amount,
        is_paid: editingBill?.is_paid || false
      };

      const operation = editingBill
        ? supabase.from('electricity_bills').update(payload).eq('id', editingBill.id)
        : supabase.from('electricity_bills').insert([payload]);

      const { error } = await operation;
      if (error) throw error;
      toast.success(editingBill ? 'Electricity bill updated!' : 'Electricity bill added!');
      closeBillModal();
      fetchAdminData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail) return;
    const { data } = await supabase.from('users').select('*').ilike('email', `%${searchEmail}%`).limit(5);
    if (data) setSearchResults(data);
  };

  const handlePromoteUser = async (userId, role) => {
    try {
      const { error } = await supabase.from('users').update({ role }).eq('id', userId);
      if (error) throw error;
      toast.success(`User role updated to ${role.replace('_', ' ')}`);
      setShowSubAdminModal(false);
      setShowAddWorkerModal(false);
      setSearchResults([]);
      setSearchEmail('');
      await fetchAdminData();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error(error.message || 'Failed to update user role');
    }
  };

  const fetchTenants = async (pgId) => {
    setLoadingTenants(true);
    setTenants([]); // Clear old list to prevent UI confusion
    try {
      // 1. Fetch all bookings directly for this PG
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          users (id, full_name, email, phone_number, parent_phone_number, address, city, state, student_category),
          rooms (room_number, total_seats),
          pgs (name),
          roommate_requests (*)
        `)
        .eq('pg_id', pgId)
        .order('created_at', { ascending: false });

      if (bookingError) throw bookingError;

      // Identify missing roommate records & fetch registered details for all roommate requests
      const allRoommateEmails = (bookingData || [])
        .flatMap(b => b.roommate_requests || [])
        .map(r => r.roommate_email.toLowerCase());

      let roommateUserMap = {};
      if (allRoommateEmails.length > 0) {
        const { data: usersWithEmails } = await supabase
          .from('users')
          .select('id, email, full_name, phone_number')
          .in('email', allRoommateEmails);
        
        if (usersWithEmails) {
          usersWithEmails.forEach(u => {
            roommateUserMap[u.email.toLowerCase()] = u;
          });
        }
      }

      // Map registered roommate user records to requests
      const mappedBookings = (bookingData || []).map(b => {
        if (b.roommate_requests) {
          b.roommate_requests = b.roommate_requests.map(r => ({
            ...r,
            roommate_user: roommateUserMap[r.roommate_email.toLowerCase()] || null
          }));
        }
        return b;
      });

      // 2. Handle roommates missing booking records
      const roommateEmails = (mappedBookings || [])
        .flatMap(b => b.roommate_requests || [])
        .filter(r => r.status === 'approved')
        .map(r => r.roommate_email.toLowerCase());

      let roommateBookings = [];
      if (roommateEmails.length > 0) {
        const { data: roommateUsers } = await supabase
          .from('users')
          .select('id, email')
          .in('email', roommateEmails);
        
        if (roommateUsers?.length > 0) {
          const missingRoommates = roommateUsers.filter(u => !mappedBookings.some(b => b.user_id === u.id));
          if (missingRoommates.length > 0) {
            for (const rm of missingRoommates) {
              const request = (mappedBookings || []).flatMap(b => b.roommate_requests || []).find(r => r.roommate_email.toLowerCase() === rm.email.toLowerCase());
              const primaryBooking = (mappedBookings || []).find(b => b.id === request?.booking_id);
              if (request && primaryBooking) {
                const { data: newRB } = await supabase.from('bookings').upsert([{
                  user_id: rm.id,
                  pg_id: pgId,
                  room_id: request.room_id,
                  status: 'confirmed',
                  occupant_role: 'approved_roommate',
                  amount: primaryBooking.amount
                }], { onConflict: 'user_id, room_id' }).select(`
                  *,
                  users (id, full_name, email, phone_number, parent_phone_number, address, city, state, student_category),
                  rooms (room_number, total_seats),
                  pgs (name)
                `).single();
                if (newRB) roommateBookings.push(newRB);
              }
            }
          }
        }
      }

      setTenants([...(mappedBookings || []), ...roommateBookings]);
    } catch (error) {
      console.error('Fetch Tenants Error:', error);
      toast.error('Failed to fetch tenants');
    } finally {
      setLoadingTenants(false);
    }
  };


  const handleUpdateComplaintStatus = async (id, status) => {
    const { error } = await supabase.from('complaints').update({ status }).eq('id', id);
    if (!error) {
      toast.success(`Complaint marked as ${status.replace('_', ' ')}`);
      fetchAdminData();
    }
  };

  const handleViewKYC = async (tenant) => {
    setSelectedTenant(tenant);
    setKycUrls({});
    setDynamicDocs([]);
    setShowKYCModal(true);

    try {
      // 1. Fetch static KYC documents manually (to ensure clean URLs)
      const docs = [
        { key: 'userPhoto', url: tenant.user_photo_url },
        { key: 'universityId', url: tenant.university_id_url },
        { key: 'aadharPancard', url: tenant.aadhar_pancard_url || tenant.aadhar_front_url },
        { key: 'parentAadhar', url: tenant.parent_aadhar_url },
        { key: 'passport', url: tenant.passport_url },
        { key: 'viduDoc', url: tenant.vidu_doc_url },
        { key: 'policeVerification', url: tenant.police_verification_url }
      ];
      
      const signedDocs = await Promise.all(docs.filter(doc => doc.url).map(async (doc) => {
        if (/^https?:\/\//i.test(doc.url)) return [doc.key, doc.url];
        const { data } = await supabase.storage
          .from('kyc-documents')
          .createSignedUrl(doc.url, 300);
        return [doc.key, data?.signedUrl || doc.url];
      }));
      const newUrls = Object.fromEntries(signedDocs);
      setKycUrls(newUrls);

      // 2. Fetch dynamic documents from booking_documents
      const { data, error } = await supabase
        .from('booking_documents')
        .select('*')
        .eq('booking_id', tenant.id);
      
      if (error) throw error;
      setDynamicDocs(data || []);
    } catch (err) {
      console.error('KYC Fetch Error:', err);
      toast.error('Failed to load documents');
    }
  };

  const handleUpdateKYC = async (bookingId, status) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ is_kyc_verified: status })
        .eq('id', bookingId);

      if (error) throw error;
      toast.success(status ? 'KYC Verified' : 'KYC Verification Revoked');
      
      // Update local state
      setTenants(prev => prev.map(t => t.id === bookingId ? { ...t, is_kyc_verified: status } : t));
    } catch (error) {
      toast.error('Failed to update KYC status');
    }
  };

  const handleReviewRoommate = async (requestId, status) => {
    try {
      const tenant = tenants.find((item) => item.roommate_requests?.some((request) => request.id === requestId));
      const request = tenant?.roommate_requests?.find(r => r.id === requestId);
      
      if (status === 'approved' && tenant && getCurrentOccupancy(tenant) >= getRoomCapacity(tenant)) {
        return toast.error('This room has already reached its allowed occupancy.');
      }

      // 1. Update the request status
      const { error: updateError } = await supabase
        .from('roommate_requests')
        .update({
          status,
          verified_by: userData?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // 2. If approved, ensure the roommate has an official booking record for KYC
      if (status === 'approved' && request && tenant) {
        // Find the user by email
        const { data: roommateUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', request.roommate_email.toLowerCase())
          .maybeSingle();
        
        if (roommateUser) {
          // Create or update a booking record for this roommate
          const { error: bookingError } = await supabase
            .from('bookings')
            .upsert([{
              user_id: roommateUser.id,
              pg_id: tenant.pg_id,
              room_id: tenant.room_id,
              status: 'confirmed',
              occupant_role: 'approved_roommate',
              amount: tenant.amount // Shared rent info
            }], { onConflict: 'user_id, room_id' });
          
          if (bookingError) console.error('Error creating roommate booking:', bookingError);
        }
      }

      toast.success(status === 'approved' ? 'Roommate verified' : 'Roommate rejected');

      // Refresh data
      if (section === 'users_admin') {
        fetchAllTenants();
      } else if (selectedPGForTenants) {
        fetchTenants(selectedPGForTenants.id);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update roommate request');
    }
  };

  const handleAddAdminOccupant = async (e) => {
    e.preventDefault();
    if (!selectedTenantForOccupant) return;
    if (!adminOccupantForm.full_name.trim() || !adminOccupantForm.email.trim()) {
      return toast.error('Occupant name and email are required.');
    }

    try {
      if (!canAdminAddThirdOccupant(selectedTenantForOccupant)) {
        return toast.error('Admin can add the third occupant only after two occupants are already active in the room.');
      }

      const { error } = await supabase
        .from('roommate_requests')
        .insert([{
          booking_id: selectedTenantForOccupant.id,
          pg_id: selectedTenantForOccupant.pg_id,
          room_id: selectedTenantForOccupant.room_id,
          requested_by_user_id: userData?.id,
          roommate_full_name: adminOccupantForm.full_name.trim(),
          roommate_email: adminOccupantForm.email.trim().toLowerCase(),
          roommate_phone: adminOccupantForm.phone_number.trim(),
          status: 'approved',
          verified_by: userData?.id,
          verified_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Third occupant added successfully.');
      setAdminOccupantForm({ full_name: '', email: '', phone_number: '' });
      setShowAdminOccupantModal(false);
      setSelectedTenantForOccupant(null);
      fetchAdminData(section);
      if (selectedPGForTenants) fetchTenants(selectedPGForTenants.id);
    } catch (error) {
      toast.error(error.message || 'Failed to add the third occupant.');
    }
  };

  if (loading && !showAddPGModal && !showAddRoomModal) return <div className="flex items-center justify-center h-64"><Clock className="animate-spin w-8 h-8 text-accent" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center">
            {section === 'admin' && <LayoutDashboard className="w-8 h-8 mr-3 text-accent" />}
            {section === 'users_admin' && <Users className="w-8 h-8 mr-3 text-accent" />}
            {section === 'pgs' && <Building2 className="w-8 h-8 mr-3 text-accent" />}
            {section === 'revenue' && <IndianRupee className="w-8 h-8 mr-3 text-accent" />}
            {section === 'bills_admin' && <Zap className="w-8 h-8 mr-3 text-accent" />}
            {section === 'complaints_admin' && <MessageSquare className="w-8 h-8 mr-3 text-accent" />}
            {section === 'queries_admin' && <MessageSquare className="w-8 h-8 mr-3 text-accent" />}
            {section === 'team' && <ShieldCheck className="w-8 h-8 mr-3 text-accent" />}
            {section === 'admin' ? 'System Overview' : 
             section === 'users_admin' ? 'Tenant Management' :
             section === 'pgs' ? 'Property Management' : 
             section === 'revenue' ? 'Revenue & Payments' :
             section === 'bills_admin' ? 'Electricity Management' :
             section === 'complaints_admin' ? 'Complaint Management' :
             section === 'queries_admin' ? 'Contact Queries' : 'Team Management'}
          </h2>
          <p className="text-text-secondary">
            {section === 'admin' ? 'Real-time performance metrics and recent activities' : 
             section === 'pgs' ? 'Manage your PG inventory and room configurations' : 
             section === 'users_admin' ? 'Manage tenants and verify KYC documents' :
             section === 'revenue' ? 'Track all rent payments and transaction history' :
             section === 'bills_admin' ? 'Generate and track electricity bills for rooms' :
             section === 'complaints_admin' ? 'Review and resolve tenant complaints' :
             section === 'queries_admin' ? 'View and respond to contact messages from users' :
             'Control access levels and manage administrative staff'}
          </p>
        </div>
        <div className="flex space-x-3">
          {section === 'pgs' && (
            <button 
              onClick={() => {
                resetAddPGForm();
                setShowAddPGModal(true);
              }}
              className="bg-accent text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-100"
            >
              <Plus className="w-5 h-5" />
              <span>Add New PG</span>
            </button>
          )}
          {section === 'bills_admin' && (
            <button 
              onClick={() => openBillModal()}
              className="bg-accent text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-100"
            >
              <Zap className="w-5 h-5" />
              <span>Generate Bill</span>
            </button>
          )}
          {section === 'team' && isSuperAdmin && (
            <button 
              onClick={() => setShowSubAdminModal(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-gray-800 transition-all shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              <span>Promote Staff</span>
            </button>
          )}
        </div>
      </div>

      {section === 'admin' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, themeClass: 'bg-primary/10 text-primary border-primary/20' },
              { label: 'Active PGs', value: stats.activePGs, icon: Building2, themeClass: 'bg-success/10 text-success border-success/20' },
              { label: 'Pending Issues', value: stats.pendingComplaints, icon: MessageSquare, themeClass: 'bg-tertiary/10 text-tertiary border-tertiary/20' },
              { label: 'Total Revenue', value: `₹${(stats.totalRevenue/1000).toFixed(1)}K`, icon: IndianRupee, themeClass: 'bg-accent/10 text-accent border-accent/20' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-surface-main p-6 rounded-2xl border border-border-low shadow-sm hover:shadow-md transition-all duration-200">
                <div className={`p-3 w-12 h-12 rounded-xl mb-4 flex items-center justify-center border ${stat.themeClass}`}>
                  <stat.icon className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-text-secondary text-sm font-medium">{stat.label}</h4>
                <p className="text-3xl font-bold text-text-primary mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-surface-main rounded-2xl border border-border-low shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-low">
              <h3 className="text-xl font-bold text-text-primary">Recent Complaints</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-text-secondary text-xs uppercase tracking-wider font-bold border-b border-border-low">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Issue</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-low">
                  {complaints.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-primary">
                          {item.rooms?.room_number ? `Room ${item.rooms.room_number}` : 'No Room'} - {item.users?.full_name}
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5">{item.pgs?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{item.category}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          item.status === 'pending' 
                            ? 'bg-tertiary/10 text-tertiary border-tertiary/20' 
                            : 'bg-success/10 text-success border-success/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.status === 'pending' ? 'bg-tertiary animate-pulse' : 'bg-success'}`}></span>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'pending' && (
                          <button onClick={() => handleUpdateComplaintStatus(item.id, 'resolved')} className="text-accent hover:underline text-sm font-bold active:scale-95 transition-all">Resolve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {section === 'pgs' && !viewingPG && (() => {
        const occupied = tenants.reduce((acc, curr) => acc + (1 + (curr.roommate_requests?.filter(r => r.status === 'approved').length || 0)), 0);
        const total = pgs.reduce((acc, pg) => acc + (pg.rooms?.reduce((rAcc, r) => rAcc + Number(r.total_seats || 2), 0) || 0), 0);
        const avgOccupancy = total > 0 ? ((occupied / total) * 100).toFixed(1) : '94.8';

        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-main border border-border-low p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Properties</p>
                  <p className="text-3xl font-extrabold text-text-primary mt-1">{pgs.length}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-xl text-primary border border-primary/20">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-surface-main border border-border-low p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Avg. Occupancy</p>
                  <p className="text-3xl font-extrabold text-text-primary mt-1">{avgOccupancy}%</p>
                </div>
                <div className="bg-success/10 p-3 rounded-xl text-success border border-success/20">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-surface-main border border-border-low p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Rooms</p>
                  <p className="text-3xl font-extrabold text-text-primary mt-1">
                    {pgs.reduce((acc, pg) => acc + (pg.rooms?.length || 0), 0)}
                  </p>
                </div>
                <div className="bg-secondary-fixed/50 p-3 rounded-xl text-secondary border border-border-low">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-surface-main border border-border-low p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Active Queries</p>
                  <p className="text-3xl font-extrabold text-text-primary mt-1">{contactQueries.length}</p>
                </div>
                <div className="bg-tertiary/10 p-3 rounded-xl text-tertiary border border-tertiary/20">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* PG Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pgs.map((pg) => (
                <div key={pg.id} className="bg-surface-main rounded-2xl border border-border-low shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 group">
                  <div className="h-48 relative overflow-hidden">
                    <img src={pg.main_image || MOCKUP_IMAGE} alt={pg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 right-4 bg-surface-main/90 border border-border-low text-text-primary px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm">
                      {pg.city}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePG(pg.id); }}
                      className="absolute top-4 left-4 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 duration-200 shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingPG({
                          ...pg,
                          amenities: pg.amenities?.join(', ') || '',
                          rules: pg.rules?.join(', ') || ''
                        }); 
                        setShowEditPGModal(true); 
                      }}
                      className="absolute top-4 left-14 p-2 bg-primary-container/90 hover:bg-primary-container text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 duration-200 shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-text-primary mb-2 truncate" title={pg.name}>{pg.name}</h3>
                    <p className="text-text-secondary text-sm mb-4 line-clamp-2 min-h-[40px]">{pg.address}</p>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center text-text-secondary text-sm font-medium">
                        <LayoutDashboard className="w-4 h-4 mr-1.5 text-accent" />
                        <span>{pg.rooms?.length || 0} Rooms</span>
                      </div>
                      <div className="flex items-center text-text-secondary text-sm font-medium">
                        <Users className="w-4 h-4 mr-1.5 text-accent" />
                        <span>{pg.rooms?.reduce((acc, r) => acc + r.total_seats, 0) || 0} Capacity</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button 
                        onClick={() => setViewingPG(pg)}
                        className="py-3 bg-surface-container-low hover:bg-surface-container-high text-text-primary border border-border-low rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 active:scale-98"
                      >
                        <Search className="w-4 h-4 text-accent" />
                        <span>Manage Rooms</span>
                      </button>
                      <button 
                        onClick={() => { setSelectedPG(pg); setShowAddRoomModal(true); }}
                        className="py-3 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 active:scale-98"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Room</span>
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setSelectedPGForTenants(pg);
                        setShowTenantsModal(true);
                        fetchTenants(pg.id);
                      }}
                      className="w-full py-3 bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-white rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 active:scale-98"
                    >
                      <Users className="w-4 h-4" />
                      <span>View All Tenants</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bento Style Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <div className="lg:col-span-2 bg-surface-main border border-border-low p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-text-primary">Occupancy Trends</h4>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Last 6 Months</span>
                </div>
                <div className="h-48 flex items-end justify-between gap-4 px-4">
                  {[60, 75, 65, 85, 92, 88].map((height, idx) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full">
                      <div className="w-full bg-primary/20 hover:bg-primary rounded-t-lg transition-all duration-300 relative group" style={{ height: `${height}%` }}>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-high border border-border-low text-[10px] font-bold text-text-primary px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{height}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 px-4 text-xs font-medium text-text-secondary">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
              <div className="bg-surface-main border border-border-low p-6 rounded-2xl flex flex-col justify-between shadow-sm">
                <div>
                  <h4 className="text-lg font-bold text-text-primary mb-2">Revenue Snapshot</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">Estimated monthly collection across all properties based on current occupancy.</p>
                </div>
                <div className="my-6 text-center">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Projected Revenue</p>
                  <p className="text-3xl font-extrabold text-primary mt-1">₹{(stats.totalRevenue > 0 ? (stats.totalRevenue / 100000).toFixed(2) : '12.4')}L</p>
                </div>
                <button className="w-full border border-border-low py-3 rounded-xl text-xs font-bold text-text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 active:scale-98">
                  <LayoutDashboard className="w-4 h-4 text-accent" />
                  <span>Detailed Report</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {section === 'users_admin' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="font-label-caps text-[11px] text-text-secondary uppercase font-bold tracking-wider">Total Tenants</p>
              <p className="text-3xl font-extrabold text-text-primary mt-2">{tenants.length}</p>
              <div className="mt-3 flex items-center text-success gap-1 text-xs font-semibold">
                <Users className="w-4 h-4 text-success" />
                <span>Active Residents</span>
              </div>
            </div>

            <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="font-label-caps text-[11px] text-text-secondary uppercase font-bold tracking-wider">Occupancy Rate</p>
              <p className="text-3xl font-extrabold text-text-primary mt-2">
                {pgs.length > 0 ? (() => {
                  const occupied = tenants.reduce((acc, curr) => acc + (1 + (curr.roommate_requests?.filter(r => r.status === 'approved').length || 0)), 0);
                  const total = pgs.reduce((acc, pg) => acc + (pg.rooms?.reduce((rAcc, r) => rAcc + Number(r.total_seats || 2), 0) || 0), 0);
                  return total > 0 ? ((occupied / total) * 100).toFixed(1) : '94.8';
                })() : '94.8'}%
              </p>
              <div className="w-full bg-surface-container h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="font-label-caps text-[11px] text-text-secondary uppercase font-bold tracking-wider">Pending KYC</p>
              <p className="text-3xl font-extrabold text-text-primary mt-2">
                {tenants.filter(t => !t.is_kyc_verified).length}
              </p>
              <div className="mt-3 flex items-center text-error gap-1 text-xs font-semibold">
                <Clock className="w-4 h-4 text-error" />
                <span>{tenants.filter(t => !t.is_kyc_verified).length} Awaiting Review</span>
              </div>
            </div>

            <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="font-label-caps text-[11px] text-text-secondary uppercase font-bold tracking-wider">Unverified Rent</p>
              <p className="text-3xl font-extrabold text-text-primary mt-2">
                {tenants.filter(t => t.status === 'pending').length}
              </p>
              <div className="mt-3 flex items-center text-tertiary gap-1 text-xs font-semibold">
                <IndianRupee className="w-4 h-4 text-tertiary" />
                <span>Offline Bank Transfers</span>
              </div>
            </div>
          </div>

          {/* Management Section */}
          <div className="bg-surface-main rounded-2xl border border-border-low shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-low flex justify-between items-center bg-surface-main">
              <h3 className="text-xl font-bold text-text-primary">All Registered Tenants</h3>
              <button 
                onClick={() => {
                  if (pgs.length > 0) {
                    setSelectedPGForTenants(pgs[0]);
                    fetchDocRequirements(pgs[0].id);
                    setShowDocManager(true);
                  } else {
                    toast.error('No properties found to manage documents for.');
                  }
                }}
                className="px-6 py-2 bg-accent text-white rounded-xl font-bold text-sm hover:bg-opacity-95 transition-all duration-200 flex items-center space-x-2 active:scale-98"
              >
                <FileEdit className="w-4 h-4" />
                <span>Manage Document Requirements</span>
              </button>
            </div>
            <div className="overflow-x-auto bg-surface-main">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low text-text-secondary text-xs uppercase tracking-wider font-bold border-b border-border-low">
                  <tr>
                    <th className="px-6 py-4">Room & Property</th>
                    <th className="px-6 py-4">Tenant Name</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">KYC Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-low">
                  {tenants.map(tenant => (
                    <tr key={tenant.id} className="hover:bg-surface-container-low transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-primary flex items-center">
                          {roomDisplayName(tenant.pgs?.name, tenant.rooms?.room_number)}
                        </div>
                        <div className="text-xs text-text-secondary mt-1">{tenant.pgs?.name || 'N/A'}</div>
                        <div className="text-[10px] text-accent font-semibold mt-1 bg-accent/5 inline-block px-2 py-0.5 rounded border border-accent/10">
                          Occupancy: {getCurrentOccupancy(tenant)}/{getRoomCapacity(tenant)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-primary">{tenant.users?.full_name || 'N/A'}</div>
                        <div className="text-xs text-text-secondary mt-0.5">{tenant.users?.email}</div>
                        {tenant.roommate_requests && tenant.roommate_requests.length > 0 && (
                          <div className="mt-3 space-y-2 border-t border-border-low pt-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Roommate Invitations ({tenant.roommate_requests.length})</p>
                            {tenant.roommate_requests.map((req) => {
                              const isRegistered = !!req.roommate_user;
                              return (
                                <div key={req.id} className="p-2.5 rounded-xl bg-surface-container-low border border-border-low text-[11px] space-y-1.5 shadow-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-text-primary">{req.roommate_full_name}</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                        isRegistered 
                                          ? 'bg-success/10 text-success border-success/20' 
                                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse'
                                      }`}>
                                        {isRegistered ? 'Registered' : 'Not Registered'}
                                      </span>
                                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                        req.status === 'approved' ? 'bg-success/10 text-success border-success/20' :
                                        req.status === 'pending' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 'bg-error/10 text-error border-error/20'
                                      }`}>{req.status}</span>
                                    </div>
                                  </div>
                                  <div className="text-text-secondary text-[10px] font-medium leading-tight">
                                    <p><span className="font-semibold text-text-primary">Email:</span> {req.roommate_email}</p>
                                    {req.roommate_phone && (
                                      <p className="mt-0.5"><span className="font-semibold text-text-primary">Phone:</span> {req.roommate_phone}</p>
                                    )}
                                  </div>
                                  
                                  {req.status === 'pending' && (
                                    <div className="flex gap-2 mt-2 pt-2 border-t border-border-low/60">
                                      <button
                                        onClick={() => handleReviewRoommate(req.id, 'approved')}
                                        className="flex-1 bg-primary text-white hover:bg-opacity-95 font-bold text-[9px] py-1.5 rounded-lg transition-all active:scale-95 text-center shadow-sm"
                                      >
                                        Verify & Allocate Room
                                      </button>
                                      <button
                                        onClick={() => handleReviewRoommate(req.id, 'rejected')}
                                        className="bg-error/10 border border-error/20 hover:bg-error hover:text-white text-error font-bold text-[9px] px-2 py-1.5 rounded-lg transition-all active:scale-95 text-center"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {tenant.users?.phone_number || 'N/A'} <br />
                        <span className="text-xs text-text-secondary mt-0.5 inline-block">{tenant.users?.city}</span>
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        {tenant.status === 'pending' && (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-error/10 text-error border-error/20">
                              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-error"></span>
                              Unverified Payment
                            </span>
                          </div>
                        )}
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            tenant.is_kyc_verified ? 'bg-success/10 text-success border-success/20' : 'bg-tertiary/10 text-tertiary border-tertiary/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tenant.is_kyc_verified ? 'bg-success' : 'bg-tertiary animate-pulse'}`}></span>
                            {tenant.is_kyc_verified ? 'Verified' : 'Pending KYC'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          {tenant.status === 'pending' && (
                            <button 
                              onClick={() => handleApprovePayment(tenant.id)}
                              className="text-white font-bold text-xs bg-success px-4 py-2 rounded-lg hover:opacity-90 transition-colors shadow-sm active:scale-95 duration-150"
                            >
                              Approve Payment
                            </button>
                          )}
                          <button 
                            onClick={() => handleViewKYC(tenant)}
                            className="text-text-primary hover:text-accent font-bold text-xs bg-surface-container-low border border-border-low px-4 py-2 rounded-lg hover:bg-surface-container-high transition-colors active:scale-95 duration-150"
                          >
                            Review Docs
                          </button>
                          <button 
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="text-error hover:text-white font-bold text-xs bg-error/10 border border-error/20 px-4 py-2 rounded-lg hover:bg-error transition-colors active:scale-95 duration-150"
                          >
                            Delete Tenant
                          </button>
                        </div>
                        {canAdminAddThirdOccupant(tenant) && (
                          <button
                            onClick={() => {
                              setSelectedTenantForOccupant(tenant);
                              setAdminOccupantForm({ full_name: '', email: '', phone_number: '' });
                              setShowAdminOccupantModal(true);
                            }}
                            className="text-white font-bold text-xs bg-primary px-4 py-2 rounded-lg hover:opacity-95 transition-all shadow-sm mt-2 w-full"
                          >
                            Add 3rd Occupant
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-text-secondary font-medium border-2 border-dashed border-border-low">
                        No active tenants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bento Area (Modern Dashboard Patterns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
            <div className="md:col-span-2 bg-surface-main border border-border-low rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-label-caps text-xs font-bold uppercase tracking-widest text-text-secondary">Recent Onboarding</h3>
                </div>
                <div className="space-y-3">
                  {tenants.slice(0, 1).map((t) => (
                    <div key={t.id} className="flex items-center gap-4 p-4 bg-surface-container-low border border-border-low rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary select-none">
                        {t.users?.full_name?.substring(0, 2).toUpperCase() || 'JD'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-text-primary">{t.users?.full_name}</p>
                        <p className="text-xs text-text-secondary">Onboarded: {new Date(t.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${t.is_kyc_verified ? 'text-success' : 'text-tertiary'}`}>
                          {t.is_kyc_verified ? 'KYC Verified' : 'KYC Pending'}
                        </p>
                        <p className="text-[10px] text-text-secondary font-mono mt-0.5">#{t.id.substring(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                  ))}
                  {tenants.length === 0 && (
                    <div className="text-center py-6 text-text-secondary text-sm">No recent onboarding tenants.</div>
                  )}
                </div>
              </div>
              <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-3 select-none">
                <Clock className="w-4 h-4 text-primary animate-pulse" />
                <p className="text-xs text-text-secondary">
                  <span className="font-bold text-primary">{tenants.filter(t => !t.is_kyc_verified).length} more tenants</span> are waiting for document verification.
                </p>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="z-10 relative">
                <h3 className="text-xl font-bold mb-2 text-primary">Quick Support</h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  Need help with tenant management, lease agreements, or billing issues? Our technical support team is available 24/7.
                </p>
                <button className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-transform hover:opacity-90 shadow-sm w-full select-none cursor-pointer">
                  Contact Portfolio Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {section === 'pgs' && viewingPG && (
        <div className="space-y-6">
          <button 
            onClick={() => setViewingPG(null)}
            className="flex items-center text-text-secondary hover:text-accent font-bold transition-colors mb-4"
          >
            <MoreVertical className="w-5 h-5 mr-2 rotate-90" />
            Back to Properties
          </button>

          <div className="bg-surface-main rounded-3xl p-8 border border-border-low shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold">{viewingPG.name} - Rooms</h3>
                <p className="text-text-secondary">{viewingPG.address}</p>
              </div>
              <button 
                onClick={() => { setSelectedPG(viewingPG); setShowAddRoomModal(true); }}
                className="bg-accent text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-blue-600 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Add New Room</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pgs.find(p => p.id === viewingPG.id)?.rooms?.map((room) => (
                <div key={room.id} className="bg-surface-main rounded-2xl border border-border-low overflow-hidden relative group shadow-sm hover:shadow-md transition-all">
                  <div className="h-40 relative">
                    <img src={room.image_url || MOCKUP_IMAGE} alt={`Room ${room.room_number}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleDeleteRoom(room.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-lg font-bold">{roomDisplayName(viewingPG.name, room.room_number)}</h4>
                        <p className="text-sm text-text-secondary">{tenants.filter(t => t.room_id === room.id).length} / {room.total_seats} Occupied</p>
                      </div>
                      <div className="text-accent font-bold">₹{room.price_per_seat}</div>
                    </div>
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((a, i) => (
                          <span key={i} className="px-2 py-1 bg-surface-container-low text-[10px] font-bold text-text-secondary rounded-md border border-border-low uppercase tracking-wider">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!pgs.find(p => p.id === viewingPG.id)?.rooms || pgs.find(p => p.id === viewingPG.id).rooms.length === 0) && (
                <div className="col-span-full py-12 text-center text-text-secondary font-medium bg-surface-main rounded-2xl border-2 border-dashed border-border-low">
                  No rooms configured for this property yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {section === 'revenue' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Revenue</p>
              <p className="text-3xl font-extrabold text-text-primary mt-2">₹{(stats.totalRevenue).toLocaleString()}</p>
              <div className="mt-3 flex items-center text-success gap-1 text-xs font-semibold">
                <IndianRupee className="w-4 h-4 text-success" />
                <span>Verified Collections</span>
              </div>
            </div>

            <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Pending Offline</p>
              <p className="text-3xl font-extrabold text-text-primary mt-2">
                {payments.filter(p => p.status === 'pending').length}
              </p>
              <div className="mt-3 flex items-center text-tertiary gap-1 text-xs font-semibold">
                <Clock className="w-4 h-4 text-tertiary" />
                <span>Awaiting Bank Verification</span>
              </div>
            </div>

            <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Success Rate</p>
              <p className="text-3xl font-extrabold text-text-primary mt-2">
                {payments.length > 0 ? ((payments.filter(p => p.status === 'success').length / payments.length) * 100).toFixed(1) : '98.4'}%
              </p>
              <div className="w-full bg-surface-container h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-success h-full rounded-full" style={{ width: `${payments.length > 0 ? (payments.filter(p => p.status === 'success').length / payments.length) * 100 : 98.4}%` }}></div>
              </div>
            </div>

            <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Transactions</p>
              <p className="text-3xl font-extrabold text-text-primary mt-2">{payments.length}</p>
              <div className="mt-3 flex items-center text-primary gap-1 text-xs font-semibold">
                <LayoutDashboard className="w-4 h-4 text-primary" />
                <span>Receipt Records</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-main rounded-2xl border border-border-low shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-low flex justify-between items-center bg-surface-main">
              <div>
                <h3 className="text-xl font-bold text-text-primary">Transaction History</h3>
                {payments.filter(p => p.status === 'pending').length > 0 && (
                  <p className="text-xs text-amber-500 font-bold mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block"></span>
                    {payments.filter(p => p.status === 'pending').length} offline payment{payments.filter(p => p.status === 'pending').length > 1 ? 's' : ''} awaiting verification
                  </p>
                )}
              </div>
            </div>
            <div className="overflow-x-auto bg-surface-main">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low text-text-secondary text-xs uppercase tracking-wider font-bold border-b border-border-low">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Payment ID</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-low">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-surface-container-low transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-primary">{payment.bookings?.users?.full_name}</div>
                        <div className="text-xs text-text-secondary mt-0.5">{payment.bookings?.users?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-text-primary">{payment.bookings?.pgs?.name}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-accent">₹{payment.amount}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{new Date(payment.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          payment.status === 'success' ? 'bg-success/10 text-success border-success/20' : 
                          payment.status === 'pending' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 
                          'bg-error/10 text-error border-error/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            payment.status === 'success' ? 'bg-success' : 
                            payment.status === 'pending' ? 'bg-tertiary animate-pulse' : 'bg-error'
                          }`}></span>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono text-text-secondary">{payment.payment_id || 'N/A'}</div>
                        {(payment.payment_method === 'offline' || payment.payment_id?.startsWith('OFFLINE')) && (
                          <span className="mt-1 inline-block text-[9px] font-bold uppercase bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded tracking-wider">Offline</span>
                        )}
                        {payment.payment_notes && (
                          <div className="text-[9px] text-text-secondary/60 mt-1 italic max-w-[160px] truncate" title={payment.payment_notes}>{payment.payment_notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {payment.status === 'pending' && (payment.payment_method === 'offline' || payment.payment_id?.startsWith('OFFLINE')) && (
                          <button 
                            onClick={() => handleApproveRentPayment(payment.id)}
                            className="text-white font-bold text-xs bg-success px-4 py-2 rounded-lg hover:opacity-90 transition-colors shadow-sm active:scale-95 duration-150"
                          >
                            ✅ Approve & Generate Receipt
                          </button>
                        )}
                        {payment.status === 'success' && (
                          <span className="text-[10px] font-bold text-success uppercase tracking-wider">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-text-secondary font-medium">No payments found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {section === 'bills_admin' && (() => {
        const totalDue = billHistory.filter(b => !b.is_paid).reduce((acc, curr) => acc + Number(curr.amount), 0);
        const paidCount = billHistory.filter(b => b.is_paid).length;
        const totalBills = billHistory.length;
        const paidPercentage = totalBills > 0 ? ((paidCount / totalBills) * 100).toFixed(0) : '0';
        const totalUnits = billHistory.reduce((acc, curr) => acc + Number(curr.units), 0);
        const unpaidCount = billHistory.filter(b => !b.is_paid).length;

        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Due</p>
                <p className="text-3xl font-extrabold text-text-primary mt-2">₹{totalDue.toLocaleString()}</p>
                <div className="mt-3 flex items-center text-error gap-1 text-xs font-semibold">
                  <Clock className="w-4 h-4 text-error" />
                  <span>Overdue Invoices</span>
                </div>
              </div>

              <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Paid Invoices</p>
                <p className="text-3xl font-extrabold text-text-primary mt-2">{paidCount}/{totalBills}</p>
                <div className="w-full bg-surface-container h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-success h-full rounded-full" style={{ width: `${paidPercentage}%` }}></div>
                </div>
              </div>

              <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Electricity Usage</p>
                <p className="text-3xl font-extrabold text-text-primary mt-2">{totalUnits.toLocaleString()} kWh</p>
                <div className="mt-3 flex items-center text-secondary gap-1 text-xs font-semibold">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>Across all PG portfolios</span>
                </div>
              </div>

              <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Pending Alerts</p>
                <p className="text-3xl font-extrabold text-error mt-2">{unpaidCount} Bills</p>
                <div className="mt-3 flex items-center text-tertiary gap-1 text-xs font-semibold">
                  <Clock className="w-4 h-4 text-tertiary" />
                  <span>Awaiting Resident Action</span>
                </div>
              </div>
            </div>

            {/* Electricity Consumption Historical Analytics */}
            <div className="bg-surface-main rounded-2xl border border-border-low shadow-sm overflow-hidden p-6 space-y-6">
              {(() => {
                const parseMonthYear = (monthStr) => {
                  if (!monthStr) return new Date(0);
                  const parts = monthStr.split(' ');
                  if (parts.length === 2) {
                    const monthIndex = [
                      'january', 'february', 'march', 'april', 'may', 'june',
                      'july', 'august', 'september', 'october', 'november', 'december'
                    ].indexOf(parts[0].toLowerCase());
                    if (monthIndex !== -1) {
                      return new Date(Number(parts[1]), monthIndex, 1);
                    }
                  }
                  const d = Date.parse(monthStr);
                  return isNaN(d) ? new Date(0) : new Date(d);
                };

                const fBills = billHistory.filter(b => {
                  if (chartSelectedPGId !== 'all') {
                    const parentPG = pgs.find(pg => pg.rooms?.some(r => r.id === b.room_id));
                    if (!parentPG || parentPG.id !== chartSelectedPGId) return false;
                  }
                  if (chartSelectedRoomId !== 'all') {
                    if (b.room_id !== chartSelectedRoomId) return false;
                  }
                  return true;
                });

                const monthlyDataMap = {};
                fBills.forEach(b => {
                  const month = b.billing_month || 'Unknown';
                  if (!monthlyDataMap[month]) {
                    monthlyDataMap[month] = {
                      month,
                      units: 0,
                      amount: 0,
                      billCount: 0,
                      paidCount: 0
                    };
                  }
                  monthlyDataMap[month].units += Number(b.units || 0);
                  monthlyDataMap[month].amount += Number(b.amount || 0);
                  monthlyDataMap[month].billCount += 1;
                  if (b.is_paid) monthlyDataMap[month].paidCount += 1;
                });

                const chartData = Object.values(monthlyDataMap).sort((a, b) => {
                  return parseMonthYear(a.month) - parseMonthYear(b.month);
                });

                const totalFilteredUnits = chartData.reduce((sum, item) => sum + item.units, 0);
                const avgFilteredUnits = chartData.length > 0 ? (totalFilteredUnits / chartData.length).toFixed(1) : '0';
                const maxFilteredItem = chartData.reduce((max, item) => item.units > max.units ? item : max, { month: 'N/A', units: 0 });
                const totalFilteredAmount = chartData.reduce((sum, item) => sum + item.amount, 0);
                const totalFilteredBills = chartData.reduce((sum, item) => sum + item.billCount, 0);
                const totalFilteredPaid = chartData.reduce((sum, item) => sum + item.paidCount, 0);
                const filteredPaidPercentage = totalFilteredBills > 0 ? ((totalFilteredPaid / totalFilteredBills) * 100).toFixed(0) : '0';

                // Chart setup
                const maxUnitsVal = Math.max(...chartData.map(item => item.units), 50);
                const yAxisMax = Math.ceil(maxUnitsVal / 50) * 50;

                return (
                  <>
                    {/* Header with Filters */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border-low pb-6">
                      <div>
                        <h3 className="text-xl font-bold text-text-primary flex items-center">
                          <Activity className="w-5 h-5 mr-2 text-accent" />
                          <span>Electricity Consumption Analytics</span>
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">Analyze historical utility consumption across properties and rooms</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        {/* PG Filter */}
                        <div className="flex flex-col space-y-1 w-full sm:w-auto">
                          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Property (PG)</label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-3.5 h-3.5" />
                            <select
                              className="pl-9 pr-8 py-2 w-full sm:w-[180px] bg-surface-container-low border border-border-low rounded-xl outline-none text-xs font-bold text-text-primary focus:border-accent appearance-none"
                              value={chartSelectedPGId}
                              onChange={(e) => {
                                setChartSelectedPGId(e.target.value);
                                setChartSelectedRoomId('all');
                              }}
                            >
                              <option value="all">All Properties</option>
                              {pgs.map(pg => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary w-3.5 h-3.5 pointer-events-none" />
                          </div>
                        </div>

                        {/* Room Filter */}
                        <div className="flex flex-col space-y-1 w-full sm:w-auto">
                          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Room</label>
                          <div className="relative">
                            <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-3.5 h-3.5" />
                            <select
                              disabled={chartSelectedPGId === 'all'}
                              className="pl-9 pr-8 py-2 w-full sm:w-[150px] bg-surface-container-low border border-border-low rounded-xl outline-none text-xs font-bold text-text-primary focus:border-accent appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                              value={chartSelectedRoomId}
                              onChange={(e) => setChartSelectedRoomId(e.target.value)}
                            >
                              <option value="all">All Rooms</option>
                              {chartSelectedPGId !== 'all' && pgs.find(pg => pg.id === chartSelectedPGId)?.rooms?.map(room => (
                                <option key={room.id} value={room.id}>Room {room.room_number}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary w-3.5 h-3.5 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Summary Bento Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-surface-container-low/50 p-4 rounded-xl border border-border-low">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Average Consumption</span>
                        <div className="text-xl font-black text-text-primary mt-1">{avgFilteredUnits} <span className="text-xs font-semibold">kWh</span></div>
                        <span className="text-[9px] text-text-secondary mt-1 block">Mean monthly usage in interval</span>
                      </div>

                      <div className="bg-surface-container-low/50 p-4 rounded-xl border border-border-low">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Highest Peak</span>
                        <div className="text-xl font-black text-error mt-1">{maxFilteredItem.units > 0 ? `${maxFilteredItem.units} kWh` : '0 kWh'}</div>
                        <span className="text-[9px] text-text-secondary mt-1 block">Peak recorded in {maxFilteredItem.month}</span>
                      </div>

                      <div className="bg-surface-container-low/50 p-4 rounded-xl border border-border-low">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Total Invoice Value</span>
                        <div className="text-xl font-black text-accent mt-1">₹{totalFilteredAmount.toLocaleString()}</div>
                        <span className="text-[9px] text-text-secondary mt-1 block">Sum of all filtered invoices</span>
                      </div>

                      <div className="bg-surface-container-low/50 p-4 rounded-xl border border-border-low">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Payment Ratio</span>
                        <div className="text-xl font-black text-success mt-1">{filteredPaidPercentage}%</div>
                        <span className="text-[9px] text-text-secondary mt-1 block">{totalFilteredPaid} paid of {totalFilteredBills} bills</span>
                      </div>
                    </div>

                    {/* Main Chart Section */}
                    <div className="bg-surface-container-low/30 rounded-2xl border border-border-low p-6 relative">
                      {chartData.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center space-y-2">
                          <Zap className="w-10 h-10 text-text-secondary opacity-30 animate-pulse" />
                          <p className="text-sm font-semibold text-text-secondary">No historical electricity bills found matching these filters</p>
                          <p className="text-xs text-text-secondary/70">Create a bill for this PG/room using the panel below.</p>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* SVG Chart Container */}
                          <svg viewBox="0 0 600 240" className="w-full h-auto" style={{ overflow: 'visible' }}>
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-accent, #3b82f6)" stopOpacity="0.85" />
                                <stop offset="100%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0.25" />
                              </linearGradient>
                              <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="var(--color-accent, #3b82f6)" stopOpacity="0.4" />
                              </linearGradient>
                            </defs>

                            {/* Horizontal Gridlines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                              const y = 20 + (1 - ratio) * 180;
                              const val = Math.round(ratio * yAxisMax);
                              return (
                                <g key={index}>
                                  <line 
                                    x1="50" 
                                    y1={y} 
                                    x2="580" 
                                    y2={y} 
                                    stroke="var(--color-border-low, #e5e7eb)" 
                                    strokeDasharray="4 4" 
                                    strokeWidth="1"
                                  />
                                  <text 
                                    x="40" 
                                    y={y + 4} 
                                    textAnchor="end" 
                                    className="text-[9px] font-bold fill-text-secondary"
                                  >
                                    {val}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Bars */}
                            {chartData.map((item, index) => {
                              const barSpace = 530 / chartData.length;
                              const barWidth = Math.min(barSpace * 0.5, 40);
                              const x = 50 + index * barSpace + (barSpace - barWidth) / 2;
                              const barHeight = (item.units / yAxisMax) * 180;
                              const y = 200 - barHeight;

                              return (
                                <g key={item.month}>
                                  {/* Interaction Bar Area (translucent helper) */}
                                  <rect
                                    x={50 + index * barSpace}
                                    y="20"
                                    width={barSpace}
                                    height="180"
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredBarIndex(index)}
                                    onMouseLeave={() => setHoveredBarIndex(null)}
                                  />

                                  {/* Visual Bar */}
                                  <motion.rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={Math.max(barHeight, 4)}
                                    rx="4"
                                    ry="4"
                                    fill={hoveredBarIndex === index ? "url(#barGradientHover)" : "url(#barGradient)"}
                                    className="transition-all duration-200 cursor-pointer filter drop-shadow-sm hover:drop-shadow-lg"
                                    initial={{ height: 0, y: 200 }}
                                    animate={{ height: Math.max(barHeight, 4), y }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                  />

                                  {/* X-Axis label */}
                                  <text
                                    x={50 + index * barSpace + barSpace / 2}
                                    y="218"
                                    textAnchor="middle"
                                    className="text-[9px] font-bold fill-text-primary"
                                  >
                                    {item.month.split(' ')[0]}
                                  </text>
                                  <text
                                    x={50 + index * barSpace + barSpace / 2}
                                    y="228"
                                    textAnchor="middle"
                                    className="text-[8px] fill-text-secondary"
                                  >
                                    {item.month.split(' ')[1]}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>

                          {/* Hover Tooltip Overlay */}
                          {hoveredBarIndex !== null && chartData[hoveredBarIndex] && (() => {
                            const item = chartData[hoveredBarIndex];
                            const barSpace = 530 / chartData.length;
                            const xRatio = (50 + hoveredBarIndex * barSpace + barSpace / 2) / 600;
                            const leftPercent = `${xRatio * 100}%`;
                            const barHeight = (item.units / yAxisMax) * 180;
                            const bottomPx = `${40 + barHeight + 8}px`;

                            return (
                              <div 
                                className="absolute pointer-events-none bg-surface-main/95 dark:bg-black/90 backdrop-blur-md border border-border-low p-4 rounded-xl shadow-xl w-48 z-10 transition-all duration-200 animate-in fade-in zoom-in-95 duration-100"
                                style={{ 
                                  left: leftPercent,
                                  bottom: bottomPx,
                                  transform: 'translateX(-50%)'
                                }}
                              >
                                <div className="text-[10px] font-extrabold text-accent uppercase tracking-wider">{item.month}</div>
                                <div className="border-t border-border-low my-2"></div>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-text-secondary font-medium">Consumption:</span>
                                    <span className="font-extrabold text-text-primary">{item.units.toLocaleString()} kWh</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-text-secondary font-medium">Invoiced Cost:</span>
                                    <span className="font-extrabold text-text-primary">₹{item.amount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-text-secondary font-medium">Bills Created:</span>
                                    <span className="font-extrabold text-text-primary">{item.billCount}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-text-secondary font-medium">Collected:</span>
                                    <span className={`font-extrabold ${item.paidCount === item.billCount ? 'text-success' : 'text-tertiary'}`}>
                                      {item.paidCount}/{item.billCount}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="bg-surface-main rounded-2xl border border-border-low shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-text-primary">Electricity Bill Generation</h3>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
                    <select className="pl-10 pr-4 py-2 bg-surface-container-low border border-border-low rounded-xl outline-none text-sm appearance-none focus:border-accent">
                      <option>All PGs</option>
                      {pgs.map(pg => <option key={pg.id}>{pg.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-6 rounded-2xl border border-border-low">
                  <h4 className="font-bold text-text-primary mb-2 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-accent" />
                    <span>How it works</span>
                  </h4>
                  <p className="text-sm text-text-secondary leading-relaxed">Select a room from any PG and enter the consumed units. The bill will be automatically generated and visible to the tenant in their dashboard.</p>
                </div>
                <div className="bg-surface-container-low p-6 rounded-2xl border border-border-low">
                  <h4 className="font-bold text-text-primary mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-accent" />
                    <span>Tracking</span>
                  </h4>
                  <p className="text-sm text-text-secondary leading-relaxed">Once a bill is generated, tenants can pay it via the dashboard. You can track the status in the revenue section.</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-main rounded-2xl border border-border-low shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border-low">
                <h3 className="text-xl font-bold text-text-primary">Bill History</h3>
              </div>
              <div className="overflow-x-auto bg-surface-main">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low text-text-secondary text-xs uppercase tracking-wider font-bold border-b border-border-low">
                    <tr>
                      <th className="px-6 py-4">Property & Room</th>
                      <th className="px-6 py-4">Month</th>
                      <th className="px-6 py-4">Units</th>
                      <th className="px-6 py-4">Rate</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-low">
                    {billHistory.map((bill) => (
                      <tr key={bill.id} className="hover:bg-surface-container-low transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="font-bold text-text-primary">{bill.rooms?.pgs?.name}</div>
                          <div className="text-xs text-text-secondary mt-0.5">Room {bill.rooms?.room_number}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-text-primary">{bill.billing_month}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{bill.units} kWh</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">₹{bill.rate}/unit</td>
                        <td className="px-6 py-4 font-bold text-accent">₹{bill.amount}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            bill.is_paid ? 'bg-success/10 text-success border-success/20' : 'bg-tertiary/10 text-tertiary border-tertiary/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${bill.is_paid ? 'bg-success' : 'bg-tertiary animate-pulse'}`}></span>
                            {bill.is_paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={() => openBillModal(bill)}
                              className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all active:scale-95 duration-150"
                            >
                              Edit
                            </button>
                            {!bill.is_paid && (
                              <button 
                                onClick={() => handleMarkBillPaid(bill.id)}
                                className="bg-success/10 text-success border border-success/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-success hover:text-white transition-all active:scale-95 duration-150"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {billHistory.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-text-secondary font-medium">No bills generated yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {section === 'queries_admin' && (() => {
        const todayQueries = contactQueries.filter(q => new Date(q.created_at).toDateString() === new Date().toDateString()).length;

        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Inquiries</p>
                <p className="text-3xl font-extrabold text-text-primary mt-2">{contactQueries.length}</p>
                <div className="mt-3 flex items-center text-success gap-1 text-xs font-semibold">
                  <MessageSquare className="w-4 h-4 text-success" />
                  <span>Customer Touchpoints</span>
                </div>
              </div>

              <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Received Today</p>
                <p className="text-3xl font-extrabold text-primary mt-2">{todayQueries}</p>
                <div className="mt-3 flex items-center text-accent gap-1 text-xs font-semibold">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>Awaiting Review</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-main rounded-2xl border border-border-low shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border-low mb-6">
                <h3 className="text-xl font-bold text-text-primary">Contact Messages</h3>
                <p className="text-sm text-text-secondary mt-1">Queries submitted via the Contact Us page</p>
              </div>
              <div className="px-6 pb-6">
                {contactQueries.length === 0 ? (
                  <div className="text-center text-text-secondary py-12 bg-surface-container-low rounded-2xl border-2 border-dashed border-border-low">
                    No contact queries received yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {contactQueries.map((query) => (
                      <div key={query.id} className="bg-surface-main border border-border-low border-l-4 border-l-accent p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-lg text-primary">{query.name || 'Anonymous User'}</h4>
                            <a href={`mailto:${query.email}`} className="text-sm text-accent hover:underline flex items-center mt-1">
                              <MessageSquare className="w-3 h-3 mr-1" /> {query.email}
                            </a>
                          </div>
                          <div className="text-xs text-text-secondary font-medium bg-surface-container-low px-3 py-1 rounded-full border border-border-low">
                            {new Date(query.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-surface-container-low p-4 rounded-xl text-text-secondary text-sm italic border border-border-low relative">
                          <span className="absolute -top-3 left-4 text-3xl text-gray-300 font-serif">"</span>
                          {query.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {section === 'complaints_admin' && (() => {
        const openCount = complaints.filter(c => c.status === 'pending').length;
        const progressCount = complaints.filter(c => c.status === 'in_progress').length;
        const highCount = complaints.filter(c => c.urgency === 'high').length;
        const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Open Tickets</p>
                <p className="text-3xl font-extrabold text-text-primary mt-2">{openCount}</p>
                <div className="mt-3 flex items-center text-error gap-1 text-xs font-semibold">
                  <Clock className="w-4 h-4 text-error" />
                  <span>Awaiting Assignment</span>
                </div>
              </div>

              <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">In Progress</p>
                <p className="text-3xl font-extrabold text-primary mt-2">{progressCount}</p>
                <div className="mt-3 flex items-center text-primary gap-1 text-xs font-semibold">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Being Handled</span>
                </div>
              </div>

              <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">High Urgency</p>
                <p className="text-3xl font-extrabold text-error mt-2">{highCount}</p>
                <div className="mt-3 flex items-center text-error gap-1 text-xs font-semibold">
                  <Clock className="w-4 h-4 text-error" />
                  <span>Requires Immediate Attention</span>
                </div>
              </div>

              <div className="bg-surface-main p-6 border border-border-low rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Resolved Today</p>
                <p className="text-3xl font-extrabold text-success mt-2">{resolvedCount}</p>
                <div className="mt-3 flex items-center text-success gap-1 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Successfully Handled</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-main rounded-2xl border border-border-low shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border-low">
                <h3 className="text-xl font-bold text-text-primary">All Tenant Complaints</h3>
              </div>
              <div className="overflow-x-auto bg-surface-main">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low text-text-secondary text-xs uppercase tracking-wider font-bold border-b border-border-low">
                    <tr>
                      <th className="px-6 py-4">User / PG</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Urgency</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-low">
                    {complaints.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-low transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="font-bold text-text-primary">{item.users?.full_name}</div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            {item.pgs?.name} - Room {item.rooms?.room_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-text-primary">{item.category}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">{item.description}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            item.urgency === 'high' ? 'bg-error/10 text-error border-error/20' :
                            item.urgency === 'medium' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 'bg-success/10 text-success border-success/20'
                          }`}>{item.urgency}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            item.status === 'pending' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                            item.status === 'in_progress' ? 'bg-primary/10 text-primary border-primary/20 animate-pulse' : 'bg-success/10 text-success border-success/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              item.status === 'pending' ? 'bg-tertiary' :
                              item.status === 'in_progress' ? 'bg-primary' : 'bg-success'
                            }`}></span>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {item.status === 'pending' && (
                              <button onClick={() => handleUpdateComplaintStatus(item.id, 'in_progress')} className="p-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-lg active:scale-90 transition-all" title="Set In Progress"><Clock className="w-4 h-4" /></button>
                            )}
                            {item.status !== 'resolved' && (
                              <button onClick={() => handleUpdateComplaintStatus(item.id, 'resolved')} className="p-2 bg-success/10 text-success border border-success/20 hover:bg-success hover:text-white rounded-lg active:scale-90 transition-all" title="Resolve"><CheckCircle2 className="w-4 h-4" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {complaints.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-text-secondary font-medium">No complaints found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Urgency and Personnel Bento Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Personnel Status */}
              <div className="bg-surface-main border border-border-low rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text-primary mb-6">Active Personnel Status</h2>
                  <div className="space-y-4">
                    {workers.slice(0, 3).map((w, idx) => (
                      <div key={w.id || idx} className="flex items-center justify-between p-3 border border-border-low rounded-xl bg-surface-container-low/40">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center font-bold text-accent border border-accent/20">
                              {w.full_name?.substring(0, 2).toUpperCase() || 'SP'}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-surface-main rounded-full"></span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary">{w.full_name}</p>
                            <p className="text-xs text-text-secondary capitalize">{w.role.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-bold text-text-primary">Available</p>
                          <p className="text-success font-semibold mt-0.5 uppercase tracking-wider text-[10px]">On Call</p>
                        </div>
                      </div>
                    ))}
                    {workers.length === 0 && (
                      <div className="text-center py-6 text-text-secondary text-sm">No service workers registered yet.</div>
                    )}
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-border-low flex items-center justify-between text-xs text-text-secondary font-medium">
                  <span>Authorized Maintenance Staff</span>
                  <span className="text-[10px] text-accent bg-accent/5 px-2 py-0.5 rounded border border-accent/10 uppercase font-bold tracking-wider">Internal Team</span>
                </div>
              </div>

              {/* Urgency Distribution */}
              <div className="bg-surface-main border border-border-low rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text-primary mb-6">Urgency Distribution</h2>
                  {(() => {
                    const total = complaints.length;
                    const high = complaints.filter(c => c.urgency === 'high').length;
                    const medium = complaints.filter(c => c.urgency === 'medium').length;
                    const low = complaints.filter(c => c.urgency === 'low').length;
                    const highPct = total > 0 ? ((high / total) * 100).toFixed(1) : '33.3';
                    const medPct = total > 0 ? ((medium / total) * 100).toFixed(1) : '50.0';
                    const lowPct = total > 0 ? ((low / total) * 100).toFixed(1) : '16.7';
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-text-primary mb-1">
                            <span>High (Urgent)</span>
                            <span className="text-error">{highPct}%</span>
                          </div>
                          <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                            <div className="bg-error h-full rounded-full" style={{ width: `${highPct}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold text-text-primary mb-1">
                            <span>Medium (Normal)</span>
                            <span className="text-primary">{medPct}%</span>
                          </div>
                          <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${medPct}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold text-text-primary mb-1">
                            <span>Low (Scheduled)</span>
                            <span className="text-success">{lowPct}%</span>
                          </div>
                          <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                            <div className="bg-success h-full rounded-full" style={{ width: `${lowPct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="mt-6 pt-6 border-t border-border-low flex items-center justify-between text-xs text-text-secondary font-medium">
                  <span>Real-time Sync Active</span>
                  <span className="text-[10px] text-accent bg-accent/5 px-2 py-0.5 rounded border border-accent/10 uppercase font-bold tracking-wider">Live Pipeline</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {section === 'team' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-surface-main rounded-2xl border border-border-low shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-low flex justify-between items-center bg-surface-main">
              <h3 className="text-xl font-bold text-text-primary font-headline">Team Members</h3>
              <button 
                onClick={() => setShowSubAdminModal(true)} 
                className="flex items-center text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition-all duration-200 active:scale-95 shadow-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" /> 
                <span>Add Member</span>
              </button>
            </div>
            <div className="overflow-x-auto bg-surface-main">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low text-text-secondary text-xs uppercase tracking-wider font-bold border-b border-border-low">
                  <tr>
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-low">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-container-low transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-primary">{user.full_name}</div>
                        <div className="text-xs text-text-secondary mt-0.5">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          user.role === 'super_admin' ? 'bg-accent/10 text-accent border-accent/20' :
                          user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-container-low text-text-secondary border-border-low'
                        }`}>{user.role.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {isSuperAdmin && user.role !== 'super_admin' && (
                          <button 
                            onClick={() => handlePromoteUser(user.id, 'user')} 
                            className="text-error hover:underline text-sm font-bold active:scale-95 transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-text-secondary font-medium">No staff members assigned yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {section === 'workers_admin' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-surface-main rounded-2xl border border-border-low shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-low flex justify-between items-center bg-surface-main">
              <h3 className="text-xl font-bold flex items-center text-text-primary">
                <Wrench className="w-6 h-6 mr-3 text-accent" />
                <span>Service Workers</span>
              </h3>
              <button 
                onClick={() => setShowAddWorkerModal(true)} 
                className="flex items-center text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition-all duration-200 active:scale-95 shadow-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" /> 
                <span>Add Worker</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-surface-container-low/30 border-t border-border-low">
              {workers.length === 0 ? (
                <div className="col-span-full py-12 text-center text-text-secondary bg-surface-main border border-border-low rounded-2xl">
                  No service workers assigned yet. Click "Add Worker" to assign roles to users.
                </div>
              ) : workers.map((worker) => (
                <div key={worker.id} className="bg-surface-main p-6 rounded-2xl border border-border-low shadow-sm flex flex-col items-center hover:shadow-md transition-all duration-200 group">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 relative shadow-inner border border-accent/20 group-hover:scale-105 transition-transform">
                    {worker.role === 'plumber' && <Droplets className="w-8 h-8 text-primary" />}
                    {worker.role === 'electrician' && <Zap className="w-8 h-8 text-accent" />}
                    {worker.role === 'wifi' && <Wifi className="w-8 h-8 text-secondary" />}
                    {worker.role === 'service_worker' && <Wrench className="w-8 h-8 text-tertiary" />}
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-success border-2 border-surface-main rounded-full"></span>
                  </div>
                  <h4 className="font-bold text-lg text-text-primary text-center">{worker.full_name}</h4>
                  <p className="text-xs text-text-secondary mb-3 text-center">{worker.email}</p>
                  <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border ${
                    worker.role === 'plumber' ? 'bg-primary/10 text-primary border-primary/20' :
                    worker.role === 'electrician' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                    worker.role === 'wifi' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-surface-container-low text-text-secondary border-border-low'
                  }`}>
                    {worker.role.replace('_', ' ')}
                  </div>
                  <button 
                    onClick={() => handlePromoteUser(worker.id, 'user')} 
                    className="mt-auto text-xs text-error font-bold hover:underline transition-all active:scale-95"
                  >
                    Revoke Role
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAddBillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-surface-main rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">{editingBill ? 'Update Bill' : 'Generate Bill'}</h3>
                <button onClick={closeBillModal} className="p-2 hover:bg-surface-container-low rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddBill} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Select Property (PG)</label>
                  <select 
                    className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none text-sm font-semibold"
                    value={formSelectedPGId}
                    onChange={e => {
                      setFormSelectedPGId(e.target.value);
                      setNewBill(prev => ({...prev, room_id: ''}));
                    }}
                  >
                    <option value="all">All Properties</option>
                    {pgs.map(pg => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Select Room</label>
                  <select 
                    required 
                    className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none text-sm font-semibold" 
                    value={newBill.room_id} 
                    onChange={e => setNewBill(prev => ({...prev, room_id: e.target.value}))}
                  >
                    <option value="">Choose a room...</option>
                    {pgs
                      .filter(pg => formSelectedPGId === 'all' || pg.id === formSelectedPGId)
                      .map(pg => pg.rooms?.map(room => (
                        <option key={room.id} value={room.id}>{pg.name} - Room {room.room_number}</option>
                      )))
                    }
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Units Consumed</label>
                    <input required type="number" placeholder="0" className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none" value={newBill.units} onChange={e => setNewBill({...newBill, units: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Rate (₹/Unit)</label>
                    <input required type="number" placeholder="10" className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none" value={newBill.rate} onChange={e => setNewBill({...newBill, rate: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Billing Month</label>
                  <input required placeholder="March 2026" className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none" value={newBill.billing_month} onChange={e => setNewBill({...newBill, billing_month: e.target.value})} />
                </div>
                <div className="p-4 bg-surface-container-low rounded-2xl flex justify-between items-center">
                  <span className="text-sm font-bold text-text-secondary">Total Amount</span>
                  <span className="text-xl font-bold text-accent">₹{Number(newBill.units || 0) * Number(newBill.rate || 0)}</span>
                </div>
                <button type="submit" className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg">{editingBill ? 'Update Bill' : 'Generate & Post Bill'}</button>
              </form>
            </motion.div>
          </div>
        )}

        {showAdminOccupantModal && selectedTenantForOccupant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-surface-main rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold">Add Third Occupant</h3>
                  <p className="text-sm text-text-secondary mt-1">{roomDisplayName(selectedTenantForOccupant.pgs?.name || selectedPGForTenants?.name, selectedTenantForOccupant.rooms?.room_number)}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAdminOccupantModal(false);
                    setSelectedTenantForOccupant(null);
                  }}
                  className="p-2 hover:bg-surface-container-low rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddAdminOccupant} className="space-y-4">
                <input
                  required
                  placeholder="Student full name"
                  className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none"
                  value={adminOccupantForm.full_name}
                  onChange={(e) => setAdminOccupantForm({ ...adminOccupantForm, full_name: e.target.value })}
                />
                <input
                  required
                  type="email"
                  placeholder="Student email"
                  className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none"
                  value={adminOccupantForm.email}
                  onChange={(e) => setAdminOccupantForm({ ...adminOccupantForm, email: e.target.value })}
                />
                <input
                  placeholder="Student phone number"
                  className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none"
                  value={adminOccupantForm.phone_number}
                  onChange={(e) => setAdminOccupantForm({ ...adminOccupantForm, phone_number: e.target.value })}
                />
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-sm text-purple-800">
                  Admin-only flow: this creates the approved third occupant directly for the room. The student should sign up with the same email to access complaints and room details.
                </div>
                <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg">
                  Save Third Occupant
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddPGModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 12 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.96, y: 12 }} 
              className="bg-surface-main rounded-3xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border-low"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border-low flex items-center justify-between bg-surface-container/30">
                <h2 className="text-xl font-bold text-primary">Add New PG Property</h2>
                <button 
                  onClick={() => { resetAddPGForm(); setShowAddPGModal(false); }} 
                  className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary hover:text-text-primary" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                <form id="add-pg-form" onSubmit={handleAddPG} className="space-y-6">
                  {/* Identity Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">PG Name</label>
                      <input 
                        required 
                        placeholder="e.g. Royal Heights Residency" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={newPG.name} 
                        onChange={e => setNewPG({...newPG, name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">City</label>
                      <input 
                        required 
                        placeholder="e.g. Phagwara" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={newPG.city} 
                        onChange={e => setNewPG({...newPG, city: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Full Address</label>
                      <input 
                        required 
                        placeholder="Flat No, Building Name, Street, Area, PIN" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={newPG.address} 
                        onChange={e => setNewPG({...newPG, address: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Google Maps Link (Optional)</label>
                      <input 
                        placeholder="https://maps.app.goo.gl/..." 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={newPG.google_map_url} 
                        onChange={e => setNewPG({...newPG, google_map_url: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Description</label>
                    <textarea 
                      placeholder="Tell potential tenants about the luxury and comfort..." 
                      rows="3" 
                      className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary resize-none" 
                      value={newPG.description} 
                      onChange={e => setNewPG({...newPG, description: e.target.value})} 
                    />
                  </div>

                  {/* Tags / Lists */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">PG Amenities (comma separated)</label>
                      <input 
                        placeholder="WiFi, Laundry, Meals, Parking" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={newPG.amenities} 
                        onChange={e => setNewPG({...newPG, amenities: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">PG Rules (comma separated)</label>
                      <input 
                        placeholder="No smoking, No pets, Main gate closes at 11 PM" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={newPG.rules} 
                        onChange={e => setNewPG({...newPG, rules: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase block">Key Amenities Checklist</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'wifi', name: 'High-speed WiFi' },
                          { id: 'meals', name: 'Curated Meals' },
                          { id: 'ac', name: 'Air Conditioning' }
                        ].map((item) => {
                          const list = newPG.amenities ? newPG.amenities.split(',').map(a => a.trim().toLowerCase()) : [];
                          const isChecked = list.includes(item.name.toLowerCase());
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                const currentList = newPG.amenities ? newPG.amenities.split(',').map(a => a.trim()).filter(Boolean) : [];
                                const normalized = currentList.map(a => a.toLowerCase());
                                const idx = normalized.indexOf(item.name.toLowerCase());
                                if (idx > -1) {
                                  currentList.splice(idx, 1);
                                } else {
                                  currentList.push(item.name);
                                }
                                setNewPG({ ...newPG, amenities: currentList.join(', ') });
                              }}
                              className={`py-2 px-3 text-center rounded-xl text-xs font-bold transition-all border ${
                                isChecked 
                                  ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                                  : 'bg-surface-container-low text-text-secondary hover:bg-surface-container border-border-low'
                              }`}
                            >
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Image Grid Upload */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">PG Images</label>
                      <span className="text-[10px] font-black uppercase tracking-widest text-accent">{pgImages.length}/{MAX_PG_IMAGES} selected</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {pgImagePreviews.map((preview, index) => (
                        <div key={preview} className="relative aspect-square overflow-hidden rounded-xl border border-border-low bg-surface-container-low shadow-sm group">
                          <img src={preview} alt={`PG preview ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <button
                            type="button"
                            onClick={() => removePGImage(index)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {index === 0 && (
                            <span className="absolute left-1 bottom-1 bg-accent text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                      {pgImages.length < MAX_PG_IMAGES && (
                        <label className="relative aspect-square border-2 border-dashed border-border-low rounded-xl p-2 text-center hover:border-accent hover:bg-accent/5 transition-colors group bg-surface-container-low overflow-hidden flex flex-col items-center justify-center cursor-pointer shadow-sm">
                          <input 
                            type="file" 
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              handlePGImagesChange(e.target.files);
                              e.target.value = '';
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <Upload className="w-5 h-5 mb-1 text-text-secondary group-hover:text-accent transition-transform group-hover:-translate-y-0.5" />
                          <span className="text-[9px] font-bold text-text-secondary">Add Images</span>
                          <span className="text-[8px] text-text-secondary/70 mt-0.5 leading-none">Max 6</span>
                        </label>
                      )}
                      {Array.from({ length: Math.max(0, MAX_PG_IMAGES - pgImages.length - (pgImages.length < MAX_PG_IMAGES ? 1 : 0)) }).map((_, idx) => (
                        <div key={idx} className="aspect-square bg-surface-container border border-border-low/40 rounded-xl flex items-center justify-center text-text-secondary/20 shadow-inner">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financials & Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Accommodation Type</label>
                      <div className="relative">
                        <select 
                          className="w-full appearance-none bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary cursor-pointer pr-10"
                          value={newPG.accommodation_type}
                          onChange={e => setNewPG({...newPG, accommodation_type: e.target.value})}
                        >
                          <option value="Indian">Indian Residents Only</option>
                          <option value="International">International Residents Only</option>
                          <option value="Both">Both (Indian & International)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 pointer-events-none text-text-secondary w-4 h-4" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Security Deposit (₹)</label>
                      <input 
                        type="number" 
                        placeholder="2000" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={newPG.security_deposit} 
                        onChange={e => setNewPG({...newPG, security_deposit: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Document Templates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Vidu Document (Template)</label>
                      <div className="flex items-center gap-3 p-3 bg-surface-container-low border border-dashed border-border-low rounded-xl group hover:bg-surface-container-high cursor-pointer transition-colors relative shadow-sm">
                        <FileText className="w-5 h-5 text-accent" />
                        <span className="text-xs flex-1 text-text-primary font-medium truncate max-w-[150px]">
                          {ownerDocName || 'Vidu Template'}
                        </span>
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 1024 * 1024) {
                                toast.error('File size must be under 1MB');
                                return;
                              }
                              setOwnerDoc(file);
                              setOwnerDocName(file.name);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <button className="px-3 py-1 bg-surface-main text-[11px] font-bold rounded-full border border-border-low hover:bg-surface-container-high transition-all text-text-secondary hover:text-text-primary" type="button">Browse</button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Police Verification (Template)</label>
                      <div className="flex items-center gap-3 p-3 bg-surface-container-low border border-dashed border-border-low rounded-xl group hover:bg-surface-container-high cursor-pointer transition-colors relative shadow-sm">
                        <Shield className="w-5 h-5 text-accent" />
                        <span className="text-xs flex-1 text-text-primary font-medium truncate max-w-[150px]">
                          {policeDocName || 'Police Template'}
                        </span>
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 1024 * 1024) {
                                toast.error('File size must be under 1MB');
                                return;
                              }
                              setPoliceDoc(file);
                              setPoliceDocName(file.name);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <button className="px-3 py-1 bg-surface-main text-[11px] font-bold rounded-full border border-border-low hover:bg-surface-container-high transition-all text-text-secondary hover:text-text-primary" type="button">Browse</button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border-low bg-surface-container/10">
                <button 
                  type="submit" 
                  form="add-pg-form"
                  disabled={loading} 
                  className="w-full bg-accent text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-accent/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{loading ? 'Creating...' : 'Create PG Listing'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showEditPGModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 12 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.96, y: 12 }} 
              className="bg-surface-main rounded-3xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border-low"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border-low flex items-center justify-between bg-surface-container/30">
                <h2 className="text-xl font-bold text-primary">Edit PG Property</h2>
                <button 
                  onClick={() => { setShowEditPGModal(false); setEditingPG(null); }} 
                  className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary hover:text-text-primary" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                <form id="edit-pg-form" onSubmit={handleUpdatePG} className="space-y-6">
                  {/* Identity Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">PG Name</label>
                      <input 
                        required 
                        placeholder="PG Name" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={editingPG.name} 
                        onChange={e => setEditingPG({...editingPG, name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">City</label>
                      <input 
                        required 
                        placeholder="City" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={editingPG.city} 
                        onChange={e => setEditingPG({...editingPG, city: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Full Address</label>
                      <input 
                        required 
                        placeholder="Full Address" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={editingPG.address} 
                        onChange={e => setEditingPG({...editingPG, address: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Description</label>
                    <textarea 
                      placeholder="Description" 
                      rows="3" 
                      className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary resize-none" 
                      value={editingPG.description} 
                      onChange={e => setEditingPG({...editingPG, description: e.target.value})} 
                    />
                  </div>

                  {/* Tags / Lists */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">PG Amenities (comma separated)</label>
                      <input 
                        placeholder="WiFi, Laundry, Meals, Parking" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={editingPG.amenities} 
                        onChange={e => setEditingPG({...editingPG, amenities: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">PG Rules (comma separated)</label>
                      <input 
                        placeholder="No smoking, No pets, Main gate closes at 11 PM" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={editingPG.rules} 
                        onChange={e => setEditingPG({...editingPG, rules: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase block">Key Amenities Checklist</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'wifi', name: 'High-speed WiFi' },
                          { id: 'meals', name: 'Curated Meals' },
                          { id: 'ac', name: 'Air Conditioning' }
                        ].map((item) => {
                          const list = editingPG.amenities 
                            ? (typeof editingPG.amenities === 'string' 
                                ? editingPG.amenities.split(',').map(a => a.trim().toLowerCase()) 
                                : editingPG.amenities.map(a => a.toLowerCase())) 
                            : [];
                          const isChecked = list.includes(item.name.toLowerCase());
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                const currentList = editingPG.amenities 
                                  ? (typeof editingPG.amenities === 'string' 
                                      ? editingPG.amenities.split(',').map(a => a.trim()).filter(Boolean) 
                                      : [...editingPG.amenities]) 
                                  : [];
                                const normalized = currentList.map(a => a.toLowerCase());
                                const idx = normalized.indexOf(item.name.toLowerCase());
                                if (idx > -1) {
                                  currentList.splice(idx, 1);
                                } else {
                                  currentList.push(item.name);
                                }
                                setEditingPG({ ...editingPG, amenities: currentList.join(', ') });
                              }}
                              className={`py-2 px-3 text-center rounded-xl text-xs font-bold transition-all border ${
                                isChecked 
                                  ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                                  : 'bg-surface-container-low text-text-secondary hover:bg-surface-container border-border-low'
                              }`}
                            >
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Image Grid Upload */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">PG Cover Image (Leave blank to keep current)</label>
                    <div className="relative border border-dashed border-border-low rounded-xl p-4 bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer min-h-[140px] flex items-center justify-center overflow-hidden shadow-sm group">
                      {pgImagePreview || editingPG.main_image ? (
                        <div className="relative w-full flex items-center justify-center p-2">
                          <img src={pgImagePreview || editingPG.main_image} alt="Preview" className="max-h-28 rounded-lg object-cover shadow-sm group-hover:scale-[1.02] transition-transform" />
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPgImage(null); setPgImagePreview(null); }}
                            className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setPgImage(file);
                                setPgImagePreview(URL.createObjectURL(file));
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="flex flex-col items-center">
                            <Upload className="w-6 h-6 mb-1.5 text-text-secondary group-hover:text-accent transition-transform group-hover:-translate-y-0.5" />
                            <span className="text-xs font-bold text-text-secondary">Select New Cover Image</span>
                            <span className="text-[10px] text-text-secondary/70 mt-0.5 leading-none">Max 2MB, auto-compressed</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financials & Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Accommodation Type</label>
                      <div className="relative">
                        <select 
                          className="w-full appearance-none bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary cursor-pointer pr-10"
                          value={editingPG.accommodation_type}
                          onChange={e => setEditingPG({...editingPG, accommodation_type: e.target.value})}
                        >
                          <option value="Indian">Indian Residents Only</option>
                          <option value="International">International Residents Only</option>
                          <option value="Both">Both (Indian & International)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 pointer-events-none text-text-secondary w-4 h-4" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Security Deposit (₹)</label>
                      <input 
                        type="number" 
                        placeholder="2000" 
                        className="w-full bg-surface-container-low border-b-2 border-border-low p-3 focus:outline-none focus:border-accent text-sm transition-all rounded-t-xl text-text-primary placeholder:text-text-secondary" 
                        value={editingPG.security_deposit} 
                        onChange={e => setEditingPG({...editingPG, security_deposit: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Document Templates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Vidu Document (Template)</label>
                      <div className="flex items-center gap-3 p-3 bg-surface-container-low border border-dashed border-border-low rounded-xl group hover:bg-surface-container-high cursor-pointer transition-colors relative shadow-sm">
                        <FileText className="w-5 h-5 text-accent" />
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-xs text-text-primary font-medium truncate max-w-[150px]">
                            {ownerDocName || (editingPG.owner_doc_url ? 'Template Uploaded' : 'Upload Template')}
                          </span>
                          {editingPG.owner_doc_url && (
                            <a href={editingPG.owner_doc_url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-accent hover:underline w-fit">View Current Doc</a>
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 1024 * 1024) {
                                toast.error('File size must be under 1MB');
                                return;
                              }
                              setOwnerDoc(file);
                              setOwnerDocName(file.name);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <button className="px-3 py-1 bg-surface-main text-[11px] font-bold rounded-full border border-border-low hover:bg-surface-container-high transition-all text-text-secondary hover:text-text-primary" type="button">Browse</button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">Police Verification (Template)</label>
                      <div className="flex items-center gap-3 p-3 bg-surface-container-low border border-dashed border-border-low rounded-xl group hover:bg-surface-container-high cursor-pointer transition-colors relative shadow-sm">
                        <Shield className="w-5 h-5 text-accent" />
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-xs text-text-primary font-medium truncate max-w-[150px]">
                            {policeDocName || (editingPG.police_verification_template_url ? 'Format Uploaded' : 'Upload Format')}
                          </span>
                          {editingPG.police_verification_template_url && (
                            <a href={editingPG.police_verification_template_url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-accent hover:underline w-fit">View Current Format</a>
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 1024 * 1024) {
                                toast.error('File size must be under 1MB');
                                return;
                              }
                              setPoliceDoc(file);
                              setPoliceDocName(file.name);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <button className="px-3 py-1 bg-surface-main text-[11px] font-bold rounded-full border border-border-low hover:bg-surface-container-high transition-all text-text-secondary hover:text-text-primary" type="button">Browse</button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border-low bg-surface-container/10">
                <button 
                  type="submit" 
                  form="edit-pg-form"
                  disabled={loading} 
                  className="w-full bg-accent text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-accent/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{loading ? 'Updating...' : 'Update PG Listing'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-surface-main rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold">New Room</h3>
                  <p className="text-sm text-text-secondary">Adding to {selectedPG?.name}</p>
                </div>
                <button onClick={() => setShowAddRoomModal(false)} className="p-2 hover:bg-surface-container-low rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <input required placeholder={`${selectedPG?.name || 'PG'} - Room number (e.g. 101)`} className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none" value={newRoom.room_number} onChange={e => setNewRoom({...newRoom, room_number: e.target.value})} />
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Monthly Room Rent (₹)</label>
                    <input required type="number" placeholder="5000" className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none" value={newRoom.price_per_seat} onChange={e => setNewRoom({...newRoom, price_per_seat: Number(e.target.value), total_seats: 2})} />
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 text-xs font-bold">
                  Room listing is sold out after one booking. The booked student can add one roommate, and admin approval allows two students in the same room.
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Amenities (comma separated)</label>
                  <input placeholder="AC, Wi-Fi, Attached Bathroom" className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none" value={newRoom.amenities} onChange={e => setNewRoom({...newRoom, amenities: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase">Room Image</label>
                  <div className="relative border-2 border-dashed border-border-low rounded-xl p-6 text-center hover:border-accent transition-colors group bg-surface-container-low overflow-hidden min-h-[120px] flex items-center justify-center">
                    {roomImagePreview ? (
                      <div className="relative w-full h-full group">
                        <img src={roomImagePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg object-cover" />
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setRoomImage(null); setRoomImagePreview(null); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setRoomImage(file);
                              setRoomImagePreview(URL.createObjectURL(file));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-text-secondary group-hover:text-accent" />
                          <span className="text-sm font-medium text-text-secondary">Select room image (Max 2MB)</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showSubAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-surface-main rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Promote User</h3>
                <button onClick={() => {setShowSubAdminModal(false); setSearchResults([]); setSearchEmail('');}} className="p-2 hover:bg-surface-container-low rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input placeholder="Search Email..." className="flex-grow px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />
                  <button onClick={handleSearchUser} className="bg-accent text-white px-6 rounded-xl font-bold">Find</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map(u => (
                    <div key={u.id} className="p-3 bg-surface-container-low rounded-xl flex justify-between items-center">
                      <div className="text-sm font-bold">{u.email}</div>
                      <div className="flex space-x-1">
                        <button onClick={() => handlePromoteUser(u.id, 'admin')} className="p-2 bg-purple-100 text-purple-600 rounded-lg" title="Admin"><Shield className="w-4 h-4" /></button>
                        <button onClick={() => handlePromoteUser(u.id, 'sub_admin')} className="p-2 bg-blue-100 text-blue-600 rounded-lg" title="Sub Admin"><ShieldCheck className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showAddWorkerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-surface-main rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Assign Worker Category</h3>
                <button onClick={() => {setShowAddWorkerModal(false); setSearchResults([]); setSearchEmail('');}} className="p-2 hover:bg-surface-container-low rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input placeholder="Search Email..." className="flex-grow px-4 py-3 bg-surface-container-low border border-border-low rounded-xl outline-none" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />
                  <button onClick={handleSearchUser} className="bg-accent text-white px-6 rounded-xl font-bold">Find</button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {searchResults.map(u => (
                    <div key={u.id} className="p-4 bg-surface-container-low rounded-xl flex flex-col space-y-3">
                      <div className="text-sm font-bold flex flex-col">
                        <span className="text-[#342d55]">{u.full_name}</span>
                        <span className="text-text-secondary text-[10px]">{u.email}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handlePromoteUser(u.id, 'plumber')} className="flex items-center text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-bold"><Droplets className="w-3 h-3 mr-1" /> Plumber</button>
                        <button onClick={() => handlePromoteUser(u.id, 'electrician')} className="flex items-center text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-bold"><Zap className="w-3 h-3 mr-1" /> Electrician</button>
                        <button onClick={() => handlePromoteUser(u.id, 'wifi')} className="flex items-center text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-bold"><Wifi className="w-3 h-3 mr-1" /> Wifi</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tenants List Modal */}
        {showTenantsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-surface-main rounded-3xl p-8 max-w-6xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold flex items-center">
                    <Users className="w-6 h-6 mr-2 text-accent" />
                    Tenants List
                  </h3>
                  <p className="text-text-secondary">Managing tenants for {selectedPGForTenants?.name}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowTenantsModal(false);
                    setTenants([]);
                  }} 
                  className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-auto">
                {loadingTenants ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Clock className="w-12 h-12 text-accent animate-spin mb-4" />
                    <p className="text-text-secondary font-medium">Fetching tenant data...</p>
                  </div>
                ) : tenants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container-low text-text-secondary text-xs uppercase tracking-wider font-bold sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-4">Tenant Details</th>
                          <th className="px-6 py-4">Room #</th>
                          <th className="px-6 py-4">Monthly Rent</th>
                          <th className="px-6 py-4">Booking Status</th>
                          <th className="px-6 py-4">KYC Status</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tenants.map((tenant) => (
                          <tr key={tenant.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                                  {tenant.users?.full_name?.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-primary">{tenant.users?.full_name}</div>
                                  <div className="text-xs text-text-secondary">{tenant.users?.email}</div>
                                  <div className="text-[10px] text-text-secondary font-mono mt-0.5">{tenant.users?.phone_number || 'No Phone'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-accent">{roomDisplayName(selectedPGForTenants?.name, tenant.rooms?.room_number)}</div>
                              <div className="text-xs text-text-secondary uppercase tracking-tighter">{tenant.type} STAY</div>
                              <div className="text-[10px] text-text-secondary mt-1">
                                Occupancy: {getCurrentOccupancy(tenant)}/{getRoomCapacity(tenant)}
                              </div>
                              {getPrimaryRoommateRequest(tenant) && (
                                <div className="mt-2 text-[10px] font-bold text-indigo-600">
                                  Roommate: {getPrimaryRoommateRequest(tenant).roommate_full_name} ({getPrimaryRoommateRequest(tenant).status})
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium">{tenant.contract_months} Months</div>
                              <div className="text-[10px] text-text-secondary">Booked: {new Date(tenant.created_at).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className={`w-fit px-2 py-1 rounded-full text-[10px] font-bold uppercase mb-1 ${
                                  tenant.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>{tenant.status}</span>
                                <div className="text-[10px] font-bold text-primary">₹{tenant.paid_amount} / ₹{tenant.amount}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {tenant.is_kyc_verified ? (
                                  <span className="flex items-center text-green-600 text-[10px] font-bold uppercase">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                                  </span>
                                ) : (
                                  <span className="flex items-center text-yellow-600 text-[10px] font-bold uppercase">
                                    <Clock className="w-3 h-3 mr-1" /> Pending
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col space-y-2">
                                <button 
                                  onClick={() => handleViewKYC(tenant)}
                                  className="px-4 py-2 bg-surface-main border border-accent/20 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/5 transition-all flex items-center justify-center space-x-2"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Review KYC</span>
                                </button>
                                {tenant.status === 'pending' && (
                                  <button 
                                    onClick={() => handleApprovePayment(tenant.id)}
                                    className="px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-accent/20 flex items-center justify-center space-x-2"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Confirm Payment</span>
                                  </button>
                                )}
                                {getPrimaryRoommateRequest(tenant)?.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleReviewRoommate(getPrimaryRoommateRequest(tenant).id, 'approved')}
                                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2"
                                    >
                                      <Users className="w-3 h-3" />
                                      <span>Verify Roommate</span>
                                    </button>
                                    <button
                                      onClick={() => handleReviewRoommate(getPrimaryRoommateRequest(tenant).id, 'rejected')}
                                      className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                                    >
                                      Reject Roommate
                                    </button>
                                  </>
                                )}
                                {canAdminAddThirdOccupant(tenant) && (
                                  <button
                                    onClick={() => {
                                      setSelectedTenantForOccupant(tenant);
                                      setAdminOccupantForm({ full_name: '', email: '', phone_number: '' });
                                      setShowAdminOccupantModal(true);
                                    }}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center justify-center space-x-2"
                                  >
                                    <Users className="w-3 h-3" />
                                    <span>Add 3rd Occupant</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-surface-container-low rounded-3xl border-2 border-dashed border-border-low">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-text-secondary font-medium">No active bookings found for this property.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* KYC Review Modal */}
        {showKYCModal && selectedTenant && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }} 
              className="bg-surface-main rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold">KYC Documents Review</h3>
                  <p className="text-text-secondary">Tenant: {selectedTenant.users?.full_name}</p>
                </div>
                <button onClick={() => setShowKYCModal(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* User Photo */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-secondary uppercase flex items-center">
                    <ImageIcon className="w-3 h-3 mr-2" /> Tenant Photo
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-surface-container-low overflow-hidden border border-border-low group relative">
                    {selectedTenant.user_photo_url ? (
                      kycUrls.userPhoto ? (
                        <>
                          <img src={kycUrls.userPhoto} alt="Tenant" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={kycUrls.userPhoto} download target="_blank" rel="noopener noreferrer" className="bg-surface-main text-text-primary px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span className="text-xs">No photo uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ID Card */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-secondary uppercase flex items-center">
                    <FileText className="w-3 h-3 mr-2" /> University ID / Office ID
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-surface-container-low overflow-hidden border border-border-low group relative">
                    {selectedTenant.university_id_url ? (
                      kycUrls.universityId ? (
                        <>
                          <img src={kycUrls.universityId} alt="ID Card" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={kycUrls.universityId} download target="_blank" rel="noopener noreferrer" className="bg-surface-main text-text-primary px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                        <FileText className="w-8 h-8 mb-2" />
                        <span className="text-xs">No ID card uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Aadhaar Card */}
                {selectedTenant.users?.student_category?.toLowerCase() !== 'international' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-secondary uppercase flex items-center">
                    <Shield className="w-3 h-3 mr-2" /> Student Aadhaar Card
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-surface-container-low overflow-hidden border border-border-low group relative">
                    {(selectedTenant.aadhar_pancard_url || selectedTenant.aadhar_front_url) ? (
                      kycUrls.aadharPancard ? (
                        <>
                          <img src={kycUrls.aadharPancard} alt="Student Aadhaar" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={kycUrls.aadharPancard} download target="_blank" rel="noopener noreferrer" className="bg-surface-main text-text-primary px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                        <Shield className="w-8 h-8 mb-2" />
                        <span className="text-xs">No document uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Aadhar Card Back */}
                {false && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-secondary uppercase flex items-center">
                    <Shield className="w-3 h-3 mr-2" /> Aadhar Card (Back)
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-surface-container-low overflow-hidden border border-border-low group relative">
                    {selectedTenant.aadhar_back_url ? (
                      kycUrls.aadharBack ? (
                        <>
                          <img src={kycUrls.aadharBack} alt="Aadhar Back" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={kycUrls.aadharBack} download target="_blank" rel="noopener noreferrer" className="bg-surface-main text-text-primary px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                        <Shield className="w-8 h-8 mb-2" />
                        <span className="text-xs">No document uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Parent Aadhar */}
                {selectedTenant.users?.student_category !== 'International' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-secondary uppercase flex items-center">
                    <Shield className="w-3 h-3 mr-2" /> Parent/Guardian Aadhar
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-surface-container-low overflow-hidden border border-border-low group relative">
                    {selectedTenant.parent_aadhar_url ? (
                      kycUrls.parentAadhar ? (
                        <>
                          <img src={kycUrls.parentAadhar} alt="Parent Aadhar" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={kycUrls.parentAadhar} download target="_blank" rel="noopener noreferrer" className="bg-surface-main text-text-primary px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                        <Shield className="w-8 h-8 mb-2" />
                        <span className="text-xs">No document uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Passport (International Only) */}
                {selectedTenant.users?.student_category?.toLowerCase() === 'international' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-secondary uppercase flex items-center">
                      <Globe className="w-3 h-3 mr-2" /> Global Passport
                    </label>
                    <div className="aspect-[4/3] rounded-2xl bg-surface-container-low overflow-hidden border border-border-low group relative">
                      {selectedTenant.passport_url ? (
                        kycUrls.passport ? (
                          <>
                            <img src={kycUrls.passport} alt="Passport" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={kycUrls.passport} download target="_blank" rel="noopener noreferrer" className="bg-surface-main text-text-primary px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                            <Clock className="w-8 h-8 mb-2 animate-spin" />
                            <span className="text-xs">Loading...</span>
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                          <Globe className="w-8 h-8 mb-2" />
                          <span className="text-xs">No passport uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Visa / Permit (International Only) */}
                {false && selectedTenant.users?.student_category === 'International' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-secondary uppercase flex items-center">
                      <Shield className="w-3 h-3 mr-2" /> Visa / Residence Permit
                    </label>
                    <div className="aspect-[4/3] rounded-2xl bg-surface-container-low overflow-hidden border border-border-low group relative">
                      {selectedTenant.visa_url ? (
                        kycUrls.visa ? (
                          <>
                            <img src={kycUrls.visa} alt="Visa" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={kycUrls.visa} download target="_blank" rel="noopener noreferrer" className="bg-surface-main text-text-primary px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                            <Clock className="w-8 h-8 mb-2 animate-spin" />
                            <span className="text-xs">Loading...</span>
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                          <Shield className="w-8 h-8 mb-2" />
                          <span className="text-xs">No visa uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vidu Doc */}
                {selectedTenant.users?.student_category?.toLowerCase() === 'international' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-secondary uppercase flex items-center">
                    <FileText className="w-3 h-3 mr-2" /> Vidu Authorization Form
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-surface-container-low overflow-hidden border border-border-low group relative">
                    {selectedTenant.vidu_doc_url ? (
                      kycUrls.viduDoc ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-accent/5">
                          <FileText className="w-12 h-12 text-accent mb-4" />
                          <div className="flex flex-col space-y-2">
                            <a href={kycUrls.viduDoc} target="_blank" rel="noopener noreferrer" className="bg-accent text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-accent/20 text-center text-xs">
                              View Vidu Document
                            </a>
                            <a href={kycUrls.viduDoc} download className="bg-surface-main text-accent border border-accent/20 px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform shadow-sm text-center text-xs">
                              Download
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                        <FileX className="w-8 h-8 mb-2" />
                        <span className="text-xs">No Vidu doc uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Police Verification */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-secondary uppercase flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-2" /> Police Verification Doc
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-surface-container-low overflow-hidden border border-border-low group relative">
                    {selectedTenant.police_verification_url ? (
                      kycUrls.policeVerification ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-green-50">
                          <ShieldCheck className="w-12 h-12 text-green-600 mb-4" />
                          <div className="flex flex-col space-y-2">
                            <a href={kycUrls.policeVerification} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-green-600/20 text-center text-xs">
                              View Verification
                            </a>
                            <a href={kycUrls.policeVerification} download className="bg-surface-main text-green-600 border border-green-200 px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform shadow-sm text-center text-xs">
                              Download
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                        <FileX className="w-8 h-8 mb-2" />
                        <span className="text-xs">No verification doc</span>
                      </div>
                    )}
                  </div>
                </div>
                </div>

              <div className="bg-surface-container-low rounded-2xl p-6 mb-8">
                <h4 className="font-bold text-primary mb-4">Tenant Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] text-text-secondary uppercase font-bold">Full Name</div>
                    <div className="text-sm font-medium">{selectedTenant.users?.full_name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-secondary uppercase font-bold">Email</div>
                    <div className="text-sm font-medium">{selectedTenant.users?.email}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-secondary uppercase font-bold">Phone</div>
                    <div className="text-sm font-medium">{selectedTenant.users?.phone_number || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-secondary uppercase font-bold">Student Type</div>
                    <div className="text-sm font-medium">{selectedTenant.users?.student_category || 'National'}</div>
                  </div>
                  {selectedTenant.users?.student_category?.toLowerCase() !== 'international' && (
                    <div>
                      <div className="text-[10px] text-text-secondary uppercase font-bold">Parent / Guardian Phone</div>
                      <div className="text-sm font-medium">{selectedTenant.users?.parent_phone_number || 'N/A'}</div>
                    </div>
                  )}
                  <div className="col-span-full">
                    <div className="text-[10px] text-text-secondary uppercase font-bold">Address</div>
                    <div className="text-sm font-medium">
                      {selectedTenant.users?.address}, {selectedTenant.users?.city}, {selectedTenant.users?.state}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                {selectedTenant.is_kyc_verified ? (
                  <button 
                    onClick={() => handleUpdateKYC(selectedTenant.id, false)}
                    className="flex-grow py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all"
                  >
                    Revoke Verification
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpdateKYC(selectedTenant.id, true)}
                    className="flex-grow py-4 bg-green-50 text-green-600 rounded-2xl font-bold hover:bg-green-600 hover:text-white transition-all flex items-center justify-center"
                  >
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Approve & Verify KYC
                  </button>
                )}
                <button 
                  onClick={() => setShowKYCModal(false)}
                  className="px-8 py-4 bg-surface-container-low text-text-secondary rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;


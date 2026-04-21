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
  FileEdit
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

  useEffect(() => {
    fetchAdminData();
  }, [section]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (['pgs', 'bills_admin', 'users_admin', 'workers_admin', 'team'].includes(section)) {
        const { data: pgData, error: pgError } = await supabase
          .from('pgs')
          .select('*, rooms (*)')
          .order('created_at', { ascending: false });
        
        if (pgError) throw pgError;
        if (pgData) {
          setPgs(pgData);
          
          // Check for missing columns in first record
          const sample = pgData[0];
          if (sample) {
            const missing = [];
            if (!('owner_doc_url' in sample)) missing.push('owner_doc_url');
            if (!('police_verification_template_url' in sample)) missing.push('police_verification_template_url');
            setSchemaIssues(missing);
          }
        }
      }

      if (section === 'admin' || section === 'revenue') {
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: pgCount } = await supabase.from('pgs').select('*', { count: 'exact', head: true });
        const { count: complaintCount } = await supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        
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

        const { data: complaintsData } = await supabase
          .from('complaints')
          .select(`*, pgs:pg_id (name), users:user_id (full_name), rooms:room_id (room_number)`)
          .order('created_at', { ascending: false })
          .limit(5);
        if (complaintsData) setComplaints(complaintsData);
      }

      if (section === 'users_admin') {
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
        if (tenantData) setTenants(tenantData);
      }

      if (section === 'team' || section === 'workers_admin') {
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        if (usersData) {
          setUsers(usersData.filter(user => ['admin', 'sub_admin', 'super_admin'].includes(user.role)));
          setWorkers(usersData.filter(user => ['plumber', 'electrician', 'wifi', 'service_worker'].includes(user.role)));
        }
      }

      if (section === 'queries_admin') {
        const { data: queryData } = await supabase
          .from('contact_queries')
          .select('*')
          .order('created_at', { ascending: false });
        if (queryData) setContactQueries(queryData);
      }

      if (section === 'bills_admin') {
        const { data: billsData } = await supabase
          .from('electricity_bills')
          .select('*, rooms (room_number, pgs (name))')
          .order('created_at', { ascending: false });
        if (billsData) setBillHistory(billsData);
      }
    } catch (error) {
      console.error('Admin Data Fetch Error:', error);
      toast.error('Failed to fetch data');
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
      const { error } = await supabase
        .from('payments')
        .update({ status: 'success' })
        .eq('id', paymentId);
      if (error) throw error;
      toast.success('Rent offline payment approved!');
      fetchAdminData(section);
    } catch (error) {
      toast.error('Failed to approve rent payment');
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
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (!error) {
      toast.success(`User promoted to ${role.replace('_', ' ')}`);
      setShowSubAdminModal(false);
      fetchAdminData();
    } else {
      toast.error('Failed to update user role');
    }
  };

  const fetchTenants = async (pgId) => {
    setLoadingTenants(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users (id, full_name, email, phone_number, parent_phone_number, address, city, state, student_category),
          rooms (room_number, total_seats),
          roommate_requests (*)
        `)
        .eq('pg_id', pgId)
        .in('status', ACTIVE_BOOKING_STATUSES)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Fetch Tenants Error:', error);
      toast.error('Failed to fetch tenants');
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
        { key: 'viduDoc', url: tenant.vidu_doc_url }
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
      if (status === 'approved' && tenant && getCurrentOccupancy(tenant) >= getRoomCapacity(tenant)) {
        return toast.error('This room has already reached its allowed occupancy.');
      }

      const { error } = await supabase
        .from('roommate_requests')
        .update({
          status,
          verified_by: userData?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      toast.success(status === 'approved' ? 'Roommate verified' : 'Roommate rejected');

      setTenants(prev => prev.map(tenant => ({
        ...tenant,
        roommate_requests: tenant.roommate_requests?.map(request => (
          request.id === requestId ? { ...request, status } : request
        ))
      })));
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
          <p className="text-gray-500">
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
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
              { label: 'Active PGs', value: stats.activePGs, icon: Building2, color: 'green' },
              { label: 'Pending Issues', value: stats.pendingComplaints, icon: MessageSquare, color: 'yellow' },
              { label: 'Total Revenue', value: `₹${(stats.totalRevenue/1000).toFixed(1)}K`, icon: IndianRupee, color: 'purple' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`p-3 w-12 h-12 rounded-2xl mb-4 flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <h4 className="text-gray-500 text-sm font-medium">{stat.label}</h4>
                <p className="text-3xl font-bold text-primary mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">Recent Complaints</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Issue</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {complaints.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-primary">
                          {item.rooms?.room_number ? `Room ${item.rooms.room_number}` : 'No Room'} - {item.users?.full_name}
                        </div>
                        <div className="text-xs text-gray-400">{item.pgs?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>{item.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'pending' && (
                          <button onClick={() => handleUpdateComplaintStatus(item.id, 'resolved')} className="text-accent hover:underline text-sm font-bold">Resolve</button>
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

      {section === 'pgs' && !viewingPG && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pgs.map((pg) => (
            <div key={pg.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
              <div className="h-48 relative overflow-hidden">
                <img src={pg.main_image || MOCKUP_IMAGE} alt={pg.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-accent shadow-sm">
                  {pg.city}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeletePG(pg.id); }}
                  className="absolute top-4 left-4 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                  className="absolute top-4 left-14 p-2 bg-blue-500/80 hover:bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-primary mb-2">{pg.name}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{pg.address}</p>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center text-gray-400 text-sm">
                    <LayoutDashboard className="w-4 h-4 mr-1" />
                    <span>{pg.rooms?.length || 0} Rooms</span>
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{pg.rooms?.reduce((acc, r) => acc + r.total_seats, 0) || 0} Capacity</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button 
                    onClick={() => setViewingPG(pg)}
                    className="py-3 bg-gray-50 text-accent rounded-xl font-bold text-sm hover:bg-accent hover:text-white transition-all flex items-center justify-center space-x-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Manage Rooms</span>
                  </button>
                  <button 
                    onClick={() => { setSelectedPG(pg); setShowAddRoomModal(true); }}
                    className="py-3 bg-blue-50 text-accent rounded-xl font-bold text-sm hover:bg-accent hover:text-white transition-all flex items-center justify-center space-x-2"
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
                  className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>View All Tenants</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'users_admin' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-xl font-bold">All Registered Tenants</h3>
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
              className="px-6 py-2 bg-accent text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all flex items-center space-x-2"
            >
              <FileEdit className="w-4 h-4" />
              <span>Manage Document Requirements</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Room & Property</th>
                  <th className="px-6 py-4">Tenant Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">KYC Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary flex items-center">
                        {roomDisplayName(tenant.pgs?.name, tenant.rooms?.room_number)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{tenant.pgs?.name || 'N/A'}</div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        Occupancy: {getCurrentOccupancy(tenant)}/{getRoomCapacity(tenant)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{tenant.users?.full_name}</div>
                      <div className="text-xs text-gray-400">{tenant.users?.email}</div>
                      {getPrimaryRoommateRequest(tenant) && (
                        <div className="mt-2 text-[10px] font-bold text-indigo-600">
                          Roommate: {getPrimaryRoommateRequest(tenant).roommate_full_name} ({getPrimaryRoommateRequest(tenant).status})
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tenant.users?.phone_number || 'N/A'} <br />
                      <span className="text-xs text-gray-400">{tenant.users?.city}</span>
                    </td>
                    <td className="px-6 py-4">
                      {tenant.status === 'pending' && (
                        <div className="mb-2">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                            Offline Payment Unverified
                          </span>
                        </div>
                      )}
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        tenant.is_kyc_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tenant.is_kyc_verified ? 'Verified' : 'Pending KYC'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex flex-col space-y-2">
                      {tenant.status === 'pending' && (
                        <button 
                          onClick={() => handleApprovePayment(tenant.id)}
                          className="text-white font-bold text-xs bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                        >
                          Approve Payment
                        </button>
                      )}
                      <button 
                        onClick={() => handleViewKYC(tenant)}
                        className="text-accent hover:underline font-bold text-xs bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Review Docs
                      </button>
                      {getPrimaryRoommateRequest(tenant)?.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReviewRoommate(getPrimaryRoommateRequest(tenant).id, 'approved')}
                            className="text-white font-bold text-xs bg-indigo-500 px-3 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                          >
                            Verify Roommate
                          </button>
                          <button
                            onClick={() => handleReviewRoommate(getPrimaryRoommateRequest(tenant).id, 'rejected')}
                            className="text-red-600 font-bold text-xs bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {canAdminAddThirdOccupant(tenant) && (
                        <button
                          onClick={() => {
                            setSelectedTenantForOccupant(tenant);
                            setAdminOccupantForm({ full_name: '', email: '', phone_number: '' });
                            setShowAdminOccupantModal(true);
                          }}
                          className="text-white font-bold text-xs bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                        >
                          Add 3rd Occupant
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500 font-medium border-2 border-dashed border-gray-100">
                      No active tenants found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === 'pgs' && viewingPG && (
        <div className="space-y-6">
          <button 
            onClick={() => setViewingPG(null)}
            className="flex items-center text-gray-500 hover:text-accent font-bold transition-colors mb-4"
          >
            <MoreVertical className="w-5 h-5 mr-2 rotate-90" />
            Back to Properties
          </button>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold">{viewingPG.name} - Rooms</h3>
                <p className="text-gray-500">{viewingPG.address}</p>
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
                <div key={room.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden relative group shadow-sm hover:shadow-md transition-all">
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
                        <p className="text-sm text-gray-500">{room.available_seats} / {room.total_seats} Seats Available</p>
                      </div>
                      <div className="text-accent font-bold">₹{room.price_per_seat}</div>
                    </div>
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((a, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-md border border-gray-100 uppercase tracking-wider">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!pgs.find(p => p.id === viewingPG.id)?.rooms || pgs.find(p => p.id === viewingPG.id).rooms.length === 0) && (
                <div className="col-span-full py-12 text-center text-gray-400 font-medium bg-white rounded-2xl border-2 border-dashed border-gray-100">
                  No rooms configured for this property yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {section === 'revenue' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-xl font-bold">Transaction History</h3>
            <div className="flex space-x-2">
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-bold">
                Total Revenue: ₹{stats.totalRevenue}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider font-bold">
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
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary">{payment.bookings?.users?.full_name}</div>
                      <div className="text-xs text-gray-400">{payment.bookings?.users?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{payment.bookings?.pgs?.name}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">₹{payment.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        payment.status === 'success' ? 'bg-green-100 text-green-700' : 
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{payment.status}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">{payment.payment_id || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {payment.status === 'pending' && payment.payment_id === 'OFFLINE_PENDING' && (
                        <button 
                          onClick={() => handleApproveRentPayment(payment.id)}
                          className="text-white font-bold text-xs bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                        >
                          Approve Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === 'bills_admin' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Electricity Bill Generation</h3>
              <div className="flex space-x-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm appearance-none">
                    <option>All PGs</option>
                    {pgs.map(pg => <option key={pg.id}>{pg.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  How it works
                </h4>
                <p className="text-sm text-blue-800 opacity-80">Select a room from any PG and enter the consumed units. The bill will be automatically generated and visible to the tenant in their dashboard.</p>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                <h4 className="font-bold text-green-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Tracking
                </h4>
                <p className="text-sm text-green-800 opacity-80">Once a bill is generated, tenants can pay it via the dashboard. You can track the status in the revenue section.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">Bill History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider font-bold">
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
                <tbody className="divide-y divide-gray-100">
                  {billHistory.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-primary">{bill.rooms?.pgs?.name}</div>
                        <div className="text-xs text-gray-400">Room {bill.rooms?.room_number}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{bill.billing_month}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{bill.units} kWh</td>
                      <td className="px-6 py-4 text-sm text-gray-600">₹{bill.rate}/unit</td>
                      <td className="px-6 py-4 font-bold text-primary">₹{bill.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          bill.is_paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{bill.is_paid ? 'Paid' : 'Unpaid'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => openBillModal(bill)}
                            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all border border-blue-200"
                          >
                            Edit
                          </button>
                          {!bill.is_paid && (
                            <button 
                              onClick={() => handleMarkBillPaid(bill.id)}
                              className="bg-green-50 text-green-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-100 transition-all border border-green-200"
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
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-400 font-medium">No bills generated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {section === 'queries_admin' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 mb-6">
            <h3 className="text-xl font-bold">Contact Messages</h3>
            <p className="text-sm text-gray-500 mt-1">Queries submitted via the Contact Us page</p>
          </div>
          <div className="px-6 pb-6">
            {contactQueries.length === 0 ? (
              <div className="text-center text-gray-400 py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                No contact queries received yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {contactQueries.map((query) => (
                  <div key={query.id} className="bg-white border border-gray-100 border-l-4 border-l-accent p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-primary">{query.name || 'Anonymous User'}</h4>
                        <a href={`mailto:${query.email}`} className="text-sm text-accent hover:underline flex items-center mt-1">
                          <MessageSquare className="w-3 h-3 mr-1" /> {query.email}
                        </a>
                      </div>
                      <div className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        {new Date(query.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-gray-600 text-sm italic border border-gray-100 relative">
                      <span className="absolute -top-3 left-4 text-3xl text-gray-300 font-serif">"</span>
                      {query.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {section === 'complaints_admin' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold">All Tenant Complaints</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">User / PG</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Urgency</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary">{item.users?.full_name}</div>
                      <div className="text-xs text-gray-400">
                        {item.pgs?.name} - Room {item.rooms?.room_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        item.urgency === 'high' ? 'bg-red-100 text-red-700' :
                        item.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>{item.urgency}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>{item.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {item.status === 'pending' && (
                          <button onClick={() => handleUpdateComplaintStatus(item.id, 'in_progress')} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><Clock className="w-4 h-4" /></button>
                        )}
                        {item.status !== 'resolved' && (
                          <button onClick={() => handleUpdateComplaintStatus(item.id, 'resolved')} className="p-2 hover:bg-green-50 text-green-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === 'team' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-xl font-bold">Team Management</h3>
            <button onClick={() => setShowSubAdminModal(true)} className="flex items-center text-sm font-bold bg-[#f1ebff] text-[#4a4bd7] px-4 py-2 rounded-xl hover:bg-[#e6deff] transition-colors">
              <UserPlus className="w-4 h-4 mr-2" /> Add Member
            </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-primary">{user.full_name}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>{user.role.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {isSuperAdmin && user.role !== 'super_admin' && (
                      <button onClick={() => handlePromoteUser(user.id, 'user')} className="text-red-500 hover:underline text-sm font-bold">Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section === 'workers_admin' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center">
              <Wrench className="w-6 h-6 mr-3 text-accent" />
              Service Workers
            </h3>
            <button onClick={() => setShowAddWorkerModal(true)} className="flex items-center text-sm font-bold bg-[#f1ebff] text-[#4a4bd7] px-4 py-2 rounded-xl hover:bg-[#e6deff] transition-colors">
              <UserPlus className="w-4 h-4 mr-2" /> Add Worker
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50/50">
            {workers.length === 0 ? (
               <div className="col-span-full py-10 text-center text-gray-400">No service workers assigned yet. Click "Add Worker" to assign roles to users.</div>
            ) : workers.map((worker) => (
              <div key={worker.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 relative">
                   {worker.role === 'plumber' && <Droplets className="w-8 h-8" />}
                   {worker.role === 'electrician' && <Zap className="w-8 h-8" />}
                   {worker.role === 'wifi' && <Wifi className="w-8 h-8" />}
                   {worker.role === 'service_worker' && <Wrench className="w-8 h-8" />}
                </div>
                <h4 className="font-bold text-lg text-primary text-center">{worker.full_name}</h4>
                <p className="text-xs text-gray-400 mb-3 text-center">{worker.email}</p>
                <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 ${
                  worker.role === 'plumber' ? 'bg-blue-100 text-blue-700' :
                  worker.role === 'electrician' ? 'bg-yellow-100 text-yellow-700' :
                  worker.role === 'wifi' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {worker.role}
                </div>
                <button onClick={() => handlePromoteUser(worker.id, 'user')} className="mt-auto text-xs text-red-500 font-bold hover:underline transition-all">
                  Revoke Role
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAddBillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">{editingBill ? 'Update Bill' : 'Generate Bill'}</h3>
                <button onClick={closeBillModal} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddBill} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Room</label>
                  <select required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newBill.room_id} onChange={e => setNewBill({...newBill, room_id: e.target.value})}>
                    <option value="">Choose a room...</option>
                    {pgs.map(pg => pg.rooms?.map(room => (
                      <option key={room.id} value={room.id}>{pg.name} - Room {room.room_number}</option>
                    )))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Units Consumed</label>
                    <input required type="number" placeholder="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newBill.units} onChange={e => setNewBill({...newBill, units: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Rate (₹/Unit)</label>
                    <input required type="number" placeholder="10" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newBill.rate} onChange={e => setNewBill({...newBill, rate: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Billing Month</label>
                  <input required placeholder="March 2026" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newBill.billing_month} onChange={e => setNewBill({...newBill, billing_month: e.target.value})} />
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500">Total Amount</span>
                  <span className="text-xl font-bold text-accent">₹{Number(newBill.units || 0) * Number(newBill.rate || 0)}</span>
                </div>
                <button type="submit" className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg">{editingBill ? 'Update Bill' : 'Generate & Post Bill'}</button>
              </form>
            </motion.div>
          </div>
        )}

        {showAdminOccupantModal && selectedTenantForOccupant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold">Add Third Occupant</h3>
                  <p className="text-sm text-gray-500 mt-1">{roomDisplayName(selectedTenantForOccupant.pgs?.name || selectedPGForTenants?.name, selectedTenantForOccupant.rooms?.room_number)}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAdminOccupantModal(false);
                    setSelectedTenantForOccupant(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddAdminOccupant} className="space-y-4">
                <input
                  required
                  placeholder="Student full name"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  value={adminOccupantForm.full_name}
                  onChange={(e) => setAdminOccupantForm({ ...adminOccupantForm, full_name: e.target.value })}
                />
                <input
                  required
                  type="email"
                  placeholder="Student email"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  value={adminOccupantForm.email}
                  onChange={(e) => setAdminOccupantForm({ ...adminOccupantForm, email: e.target.value })}
                />
                <input
                  placeholder="Student phone number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
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
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-sm">
            <div className="min-h-full flex items-start justify-center px-4 py-6 sm:py-8">
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} className="bg-white rounded-3xl p-5 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[calc(100dvh-3rem)] overflow-y-auto">
              <div className="flex justify-between items-start gap-4 mb-6">
                <h3 className="text-2xl font-bold">Add New PG Property</h3>
                <button onClick={() => { resetAddPGForm(); setShowAddPGModal(false); }} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddPG} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required placeholder="PG Name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.name} onChange={e => setNewPG({...newPG, name: e.target.value})} />
                  <input required placeholder="City" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.city} onChange={e => setNewPG({...newPG, city: e.target.value})} />
                </div>
                <input required placeholder="Full Address" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.address} onChange={e => setNewPG({...newPG, address: e.target.value})} />
                <input placeholder="Google Maps link (optional)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.google_map_url} onChange={e => setNewPG({...newPG, google_map_url: e.target.value})} />
                <textarea placeholder="Description" rows="3" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.description} onChange={e => setNewPG({...newPG, description: e.target.value})} />
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase">PG Amenities (comma separated)</label>
                  <input placeholder="WiFi, Laundry, Meals, Parking" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.amenities} onChange={e => setNewPG({...newPG, amenities: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase">PG Rules (comma separated)</label>
                  <input placeholder="No smoking, No pets, Main gate closes at 11 PM" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.rules} onChange={e => setNewPG({...newPG, rules: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-xs font-bold text-gray-400 uppercase">PG Images</label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">{pgImages.length}/{MAX_PG_IMAGES} selected</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {pgImagePreviews.map((preview, index) => (
                      <div key={preview} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                        <img src={preview} alt={`PG preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePGImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute left-2 bottom-2 bg-white/90 text-accent px-2 py-1 rounded-full text-[9px] font-black uppercase">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                    {pgImages.length < MAX_PG_IMAGES && (
                      <label className="relative aspect-[4/3] border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-accent transition-colors group bg-gray-50 overflow-hidden flex flex-col items-center justify-center cursor-pointer">
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
                        <Upload className="w-7 h-7 mb-2 text-gray-400 group-hover:text-accent" />
                        <span className="text-xs font-bold text-gray-600">Add Images</span>
                        <span className="text-[10px] text-gray-400 mt-1">Max 6, auto-compressed</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Accommodation Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      value={newPG.accommodation_type}
                      onChange={e => setNewPG({...newPG, accommodation_type: e.target.value})}
                    >
                      <option value="Indian">Indian Students</option>
                      <option value="International">International Students</option>
                      <option value="Both">Both (Indian & International)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Security Deposit (₹)</label>
                    <input type="number" placeholder="2000" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.security_deposit} onChange={e => setNewPG({...newPG, security_deposit: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Vidu Document (Template)</label>
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center justify-between group hover:border-accent transition-colors">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">
                          {ownerDocName || 'Vidu Template'}
                        </span>
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
                      <button type="button" className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-[10px] font-bold">Browse</button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Police Verification (Template)</label>
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center justify-between group hover:border-accent transition-colors">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">
                          {policeDocName || 'Police Template'}
                        </span>
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
                      <button type="button" className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-[10px] font-bold">Browse</button>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create PG Listing'}
                </button>
              </form>
            </motion.div>
            </div>
          </div>
        )}

        {showEditPGModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Edit PG Property</h3>
                <button onClick={() => { setShowEditPGModal(false); setEditingPG(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleUpdatePG} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="PG Name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={editingPG.name} onChange={e => setEditingPG({...editingPG, name: e.target.value})} />
                  <input required placeholder="City" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={editingPG.city} onChange={e => setEditingPG({...editingPG, city: e.target.value})} />
                </div>
                <input required placeholder="Full Address" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={editingPG.address} onChange={e => setEditingPG({...editingPG, address: e.target.value})} />
                <textarea placeholder="Description" rows="3" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={editingPG.description} onChange={e => setEditingPG({...editingPG, description: e.target.value})} />
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase">PG Amenities (comma separated)</label>
                  <input placeholder="WiFi, Laundry, Meals, Parking" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={editingPG.amenities} onChange={e => setEditingPG({...editingPG, amenities: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase">PG Rules (comma separated)</label>
                  <input placeholder="No smoking, No pets, Main gate closes at 11 PM" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={editingPG.rules} onChange={e => setEditingPG({...editingPG, rules: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase">PG Image (Leave blank to keep current)</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-accent transition-colors group bg-gray-50 overflow-hidden min-h-[120px] flex items-center justify-center">
                    {pgImagePreview || editingPG.main_image ? (
                      <div className="relative w-full h-full group">
                        <img src={pgImagePreview || editingPG.main_image} alt="Preview" className="max-h-32 mx-auto rounded-lg object-cover" />
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPgImage(null); setPgImagePreview(null); }}
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
                              setPgImage(file);
                              setPgImagePreview(URL.createObjectURL(file));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-accent" />
                          <span className="text-sm font-medium text-gray-600">Select new image (Max 2MB)</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Accommodation Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      value={editingPG.accommodation_type}
                      onChange={e => setEditingPG({...editingPG, accommodation_type: e.target.value})}
                    >
                      <option value="Indian">Indian Students</option>
                      <option value="International">International Students</option>
                      <option value="Both">Both (Indian & International)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Security Deposit (₹)</label>
                    <input type="number" placeholder="2000" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={editingPG.security_deposit} onChange={e => setEditingPG({...editingPG, security_deposit: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Vidu Document (Template)</label>
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center justify-between group hover:border-accent transition-colors">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-gray-600 truncate max-w-[120px]">
                            {ownerDocName || (editingPG.owner_doc_url ? 'Template Uploaded' : 'Upload Template')}
                          </span>
                          {editingPG.owner_doc_url && (
                            <a href={editingPG.owner_doc_url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-accent hover:underline">View Current Doc</a>
                          )}
                        </div>
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
                      <button type="button" className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-[10px] font-bold">Browse</button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Police Verification (Template)</label>
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center justify-between group hover:border-accent transition-colors">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-gray-600 truncate max-w-[120px]">
                            {policeDocName || (editingPG.police_verification_template_url ? 'Format Uploaded' : 'Upload Format')}
                          </span>
                          {editingPG.police_verification_template_url && (
                            <a href={editingPG.police_verification_template_url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-accent hover:underline">View Current Format</a>
                          )}
                        </div>
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
                      <button type="button" className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-[10px] font-bold">Browse</button>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50">
                  {loading ? 'Updating...' : 'Update PG Listing'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold">New Room</h3>
                  <p className="text-sm text-gray-500">Adding to {selectedPG?.name}</p>
                </div>
                <button onClick={() => setShowAddRoomModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <input required placeholder={`${selectedPG?.name || 'PG'} - Room number (e.g. 101)`} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newRoom.room_number} onChange={e => setNewRoom({...newRoom, room_number: e.target.value})} />
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Monthly Room Rent (₹)</label>
                    <input required type="number" placeholder="5000" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newRoom.price_per_seat} onChange={e => setNewRoom({...newRoom, price_per_seat: Number(e.target.value), total_seats: 2})} />
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 text-xs font-bold">
                  Room listing is sold out after one booking. The booked student can add one roommate, and admin approval allows two students in the same room.
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amenities (comma separated)</label>
                  <input placeholder="AC, Wi-Fi, Attached Bathroom" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newRoom.amenities} onChange={e => setNewRoom({...newRoom, amenities: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Room Image</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-accent transition-colors group bg-gray-50 overflow-hidden min-h-[120px] flex items-center justify-center">
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
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-accent" />
                          <span className="text-sm font-medium text-gray-600">Select room image (Max 2MB)</span>
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
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Promote User</h3>
                <button onClick={() => setShowSubAdminModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input placeholder="Search Email..." className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />
                  <button onClick={handleSearchUser} className="bg-accent text-white px-6 rounded-xl font-bold">Find</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map(u => (
                    <div key={u.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
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
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Assign Worker Category</h3>
                <button onClick={() => {setShowAddWorkerModal(false); setSearchResults([]); setSearchEmail('');}} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input placeholder="Search Email..." className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />
                  <button onClick={handleSearchUser} className="bg-accent text-white px-6 rounded-xl font-bold">Find</button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {searchResults.map(u => (
                    <div key={u.id} className="p-4 bg-gray-50 rounded-xl flex flex-col space-y-3">
                      <div className="text-sm font-bold flex flex-col">
                        <span className="text-[#342d55]">{u.full_name}</span>
                        <span className="text-gray-400 text-[10px]">{u.email}</span>
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
              className="bg-white rounded-3xl p-8 max-w-6xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold flex items-center">
                    <Users className="w-6 h-6 mr-2 text-accent" />
                    Tenants List
                  </h3>
                  <p className="text-gray-500">Managing tenants for {selectedPGForTenants?.name}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowTenantsModal(false);
                    setTenants([]);
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-auto">
                {loadingTenants ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Clock className="w-12 h-12 text-accent animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Fetching tenant data...</p>
                  </div>
                ) : tenants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider font-bold sticky top-0 z-10">
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
                          <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                                  {tenant.users?.full_name?.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-primary">{tenant.users?.full_name}</div>
                                  <div className="text-xs text-gray-400">{tenant.users?.email}</div>
                                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">{tenant.users?.phone_number || 'No Phone'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-accent">{roomDisplayName(selectedPGForTenants?.name, tenant.rooms?.room_number)}</div>
                              <div className="text-xs text-gray-400 uppercase tracking-tighter">{tenant.type} STAY</div>
                              <div className="text-[10px] text-gray-400 mt-1">
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
                              <div className="text-[10px] text-gray-400">Booked: {new Date(tenant.created_at).toLocaleDateString()}</div>
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
                                  className="px-4 py-2 bg-white border border-accent/20 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/5 transition-all flex items-center justify-center space-x-2"
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
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No active bookings found for this property.</p>
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
              className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold">KYC Documents Review</h3>
                  <p className="text-gray-500">Tenant: {selectedTenant.users?.full_name}</p>
                </div>
                <button onClick={() => setShowKYCModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* User Photo */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center">
                    <ImageIcon className="w-3 h-3 mr-2" /> Tenant Photo
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group relative">
                    {selectedTenant.user_photo_url ? (
                      kycUrls.userPhoto ? (
                        <>
                          <img src={kycUrls.userPhoto} alt="Tenant" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={kycUrls.userPhoto} download target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span className="text-xs">No photo uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ID Card */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center">
                    <FileText className="w-3 h-3 mr-2" /> University ID / Office ID
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group relative">
                    {selectedTenant.university_id_url ? (
                      kycUrls.universityId ? (
                        <>
                          <img src={kycUrls.universityId} alt="ID Card" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={kycUrls.universityId} download target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <FileText className="w-8 h-8 mb-2" />
                        <span className="text-xs">No ID card uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Aadhaar (National Only) */}
                {selectedTenant.users?.student_category !== 'International' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center">
                    <Shield className="w-3 h-3 mr-2" /> Student Aadhaar Card
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group relative">
                    {(selectedTenant.aadhar_pancard_url || selectedTenant.aadhar_front_url) ? (
                      kycUrls.aadharPancard ? (
                        <>
                          <img src={kycUrls.aadharPancard} alt="Student Aadhaar" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={kycUrls.aadharPancard} download target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
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
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center">
                    <Shield className="w-3 h-3 mr-2" /> Aadhar Card (Back)
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group relative">
                    {selectedTenant.aadhar_back_url ? (
                      kycUrls.aadharBack ? (
                        <>
                          <img src={kycUrls.aadharBack} alt="Aadhar Back" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={kycUrls.aadharBack} download target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
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
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center">
                    <Shield className="w-3 h-3 mr-2" /> Parent/Guardian Aadhar
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group relative">
                    {selectedTenant.parent_aadhar_url ? (
                      kycUrls.parentAadhar ? (
                        <>
                          <img src={kycUrls.parentAadhar} alt="Parent Aadhar" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={kycUrls.parentAadhar} download target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Shield className="w-8 h-8 mb-2" />
                        <span className="text-xs">No document uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Passport (International Only) */}
                {selectedTenant.users?.student_category === 'International' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center">
                      <Globe className="w-3 h-3 mr-2" /> Global Passport
                    </label>
                    <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group relative">
                      {selectedTenant.passport_url ? (
                        kycUrls.passport ? (
                          <>
                            <img src={kycUrls.passport} alt="Passport" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={kycUrls.passport} download target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <Clock className="w-8 h-8 mb-2 animate-spin" />
                            <span className="text-xs">Loading...</span>
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
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
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center">
                      <Shield className="w-3 h-3 mr-2" /> Visa / Residence Permit
                    </label>
                    <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group relative">
                      {selectedTenant.visa_url ? (
                        kycUrls.visa ? (
                          <>
                            <img src={kycUrls.visa} alt="Visa" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={kycUrls.visa} download target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform">
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <Clock className="w-8 h-8 mb-2 animate-spin" />
                            <span className="text-xs">Loading...</span>
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Shield className="w-8 h-8 mb-2" />
                          <span className="text-xs">No visa uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vidu Doc */}
                {selectedTenant.users?.student_category === 'International' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center">
                    <FileText className="w-3 h-3 mr-2" /> Vidu Authorization Form
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group relative">
                    {selectedTenant.vidu_doc_url ? (
                      kycUrls.viduDoc ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-accent/5">
                          <FileText className="w-12 h-12 text-accent mb-4" />
                          <a href={kycUrls.viduDoc} target="_blank" rel="noopener noreferrer" className="bg-accent text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-accent/20">
                            View Vidu Document
                          </a>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <FileX className="w-8 h-8 mb-2" />
                        <span className="text-xs">No Vidu doc uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Police Verification */}
                {false && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-2" /> Police Verification Doc
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group relative">
                    {selectedTenant.police_verification_url ? (
                      kycUrls.policeVerification ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-green-50">
                          <ShieldCheck className="w-12 h-12 text-green-600 mb-4" />
                          <a href={kycUrls.policeVerification} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-green-600/20">
                            View Verification
                          </a>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Clock className="w-8 h-8 mb-2 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <FileX className="w-8 h-8 mb-2" />
                        <span className="text-xs">No verification doc</span>
                      </div>
                    )}
                  </div>
                </div>
                )}
                </div>

              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <h4 className="font-bold text-primary mb-4">Tenant Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Full Name</div>
                    <div className="text-sm font-medium">{selectedTenant.users?.full_name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Email</div>
                    <div className="text-sm font-medium">{selectedTenant.users?.email}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Phone</div>
                    <div className="text-sm font-medium">{selectedTenant.users?.phone_number || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Student Type</div>
                    <div className="text-sm font-medium">{selectedTenant.users?.student_category || 'National'}</div>
                  </div>
                  {selectedTenant.users?.student_category !== 'International' && (
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Parent / Guardian Phone</div>
                      <div className="text-sm font-medium">{selectedTenant.users?.parent_phone_number || 'N/A'}</div>
                    </div>
                  )}
                  <div className="col-span-full">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Address</div>
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
                  className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
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


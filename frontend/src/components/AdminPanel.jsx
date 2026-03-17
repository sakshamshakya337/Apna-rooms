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
  Image as ImageIcon
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
  const [pgs, setPgs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [contactQueries, setContactQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubAdminModal, setShowSubAdminModal] = useState(false);
  const [showAddPGModal, setShowAddPGModal] = useState(false);
  const [showEditPGModal, setShowEditPGModal] = useState(false);
  const [editingPG, setEditingPG] = useState(null);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  
  const [selectedPG, setSelectedPG] = useState(null);
  const [viewingPG, setViewingPG] = useState(null);
  
  // Tenants Modal
  const [showTenantsModal, setShowTenantsModal] = useState(false);
  const [selectedPGForTenants, setSelectedPGForTenants] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  
  // Form States
  const [newPG, setNewPG] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    security_deposit: 2000,
    amenities: '',
    rules: ''
  });
  const [pgImage, setPgImage] = useState(null);
  const [pgImagePreview, setPgImagePreview] = useState(null);

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

  const [billHistory, setBillHistory] = useState([]);

  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const isSuperAdmin = userData?.role === 'super_admin';
  const isAdmin = userData?.role === 'admin' || isSuperAdmin;

  const MOCKUP_IMAGE = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80";

  useEffect(() => {
    fetchAdminData();
  }, [section]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
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
          .select(`*, pgs:pg_id (name), users:user_id (full_name)`)
          .order('created_at', { ascending: false })
          .limit(5);
        if (complaintsData) setComplaints(complaintsData);
      }

      const { data: pgsData, error: pgsError } = await supabase
        .from('pgs')
        .select(`*, rooms (*)`)
        .order('created_at', { ascending: false });
      
      if (pgsError) throw pgsError;
      if (pgsData) setPgs(pgsData);

      if (section === 'team') {
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .in('role', ['admin', 'sub_admin', 'super_admin'])
          .order('role', { ascending: false });
        if (usersData) setUsers(usersData);
      }

      if (section === 'complaints_admin') {
        const { data: complaintsData } = await supabase
          .from('complaints')
          .select(`*, pgs:pg_id (name), users:user_id (full_name)`)
          .order('created_at', { ascending: false });
        if (complaintsData) setComplaints(complaintsData);
      }

      if (section === 'bills_admin') {
        const { data: billsData, error: billsError } = await supabase
          .from('electricity_bills')
          .select(`*, rooms (room_number, pgs (name))`)
          .order('created_at', { ascending: false });
        if (billsError) throw billsError;
        if (billsData) setBillHistory(billsData);
      }

      if (section === 'queries_admin') {
        const { data: queriesData } = await supabase
          .from('contact_queries')
          .select('*')
          .order('created_at', { ascending: false });
        if (queriesData) setContactQueries(queriesData);
      }
    } catch (error) {
      console.error('Admin Data Fetch Error:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
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

  const handleAddPG = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const imageUrl = await uploadImage(pgImage, 'pgs');
      
      const { error } = await supabase.from('pgs').insert([{
        ...newPG,
        main_image: imageUrl,
        amenities: newPG.amenities.split(',').map(a => a.trim()).filter(a => a !== ''),
        rules: newPG.rules.split(',').map(r => r.trim()).filter(r => r !== '')
      }]);
      
      if (error) throw error;
      toast.success('PG Added Successfully!');
      setShowAddPGModal(false);
      setNewPG({ name: '', description: '', address: '', city: '', security_deposit: 2000, amenities: '', rules: '' });
      setPgImage(null);
      setPgImagePreview(null);
      fetchAdminData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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
      
      const { error } = await supabase.from('pgs').update({
        name: editingPG.name,
        description: editingPG.description,
        address: editingPG.address,
        city: editingPG.city,
        security_deposit: editingPG.security_deposit,
        main_image: imageUrl,
        amenities: typeof editingPG.amenities === 'string' 
          ? editingPG.amenities.split(',').map(a => a.trim()).filter(a => a !== '')
          : editingPG.amenities,
        rules: typeof editingPG.rules === 'string'
          ? editingPG.rules.split(',').map(r => r.trim()).filter(r => r !== '')
          : editingPG.rules
      }).eq('id', editingPG.id);
      
      if (error) throw error;
      toast.success('PG Updated Successfully!');
      setShowEditPGModal(false);
      setEditingPG(null);
      setPgImage(null);
      setPgImagePreview(null);
      fetchAdminData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const imageUrl = await uploadImage(roomImage, 'rooms');

      const { error } = await supabase.from('rooms').insert([{
        ...newRoom,
        pg_id: selectedPG.id,
        available_seats: newRoom.total_seats,
        amenities: newRoom.amenities.split(',').map(a => a.trim()).filter(a => a !== ''),
        image_url: imageUrl
      }]);
      if (error) throw error;
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
      const { error } = await supabase.from('electricity_bills').insert([{
        ...newBill,
        amount: amount,
        is_paid: false
      }]);
      if (error) throw error;
      toast.success('Electricity Bill Added!');
      setShowAddBillModal(false);
      setNewBill({ room_id: '', units: '', rate: 10, billing_month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) });
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
          users (id, full_name, email, phone_number, address, city, state),
          rooms (room_number)
        `)
        .eq('pg_id', pgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Fetch Tenants Error:', error);
      toast.error('Failed to fetch tenants');
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleVerifyKYC = async (bookingId, status) => {
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

  const handleUpdateComplaintStatus = async (id, status) => {
    const { error } = await supabase.from('complaints').update({ status }).eq('id', id);
    if (!error) {
      toast.success(`Complaint marked as ${status.replace('_', ' ')}`);
      fetchAdminData();
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
            {section === 'pgs' && <Building2 className="w-8 h-8 mr-3 text-accent" />}
            {section === 'revenue' && <IndianRupee className="w-8 h-8 mr-3 text-accent" />}
            {section === 'bills_admin' && <Zap className="w-8 h-8 mr-3 text-accent" />}
            {section === 'complaints_admin' && <MessageSquare className="w-8 h-8 mr-3 text-accent" />}
            {section === 'queries_admin' && <MessageSquare className="w-8 h-8 mr-3 text-accent" />}
            {section === 'team' && <ShieldCheck className="w-8 h-8 mr-3 text-accent" />}
            {section === 'admin' ? 'System Overview' : 
             section === 'pgs' ? 'Property Management' : 
             section === 'revenue' ? 'Revenue & Payments' :
             section === 'bills_admin' ? 'Electricity Management' :
             section === 'complaints_admin' ? 'Complaint Management' :
             section === 'queries_admin' ? 'Contact Queries' : 'Team Management'}
          </h2>
          <p className="text-gray-500">
            {section === 'admin' ? 'Real-time performance metrics and recent activities' : 
             section === 'pgs' ? 'Manage your PG inventory and room configurations' : 
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
              onClick={() => setShowAddPGModal(true)}
              className="bg-accent text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-100"
            >
              <Plus className="w-5 h-5" />
              <span>Add New PG</span>
            </button>
          )}
          {section === 'bills_admin' && (
            <button 
              onClick={() => setShowAddBillModal(true)}
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
                        <div className="font-bold text-primary">{item.users?.full_name}</div>
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
                        <h4 className="text-lg font-bold">Room {room.room_number}</h4>
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
                    </tr>
                  ))}
                  {billHistory.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium">No bills generated yet.</td>
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
                      <div className="text-xs text-gray-400">{item.pgs?.name}</div>
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
                      <button className="text-red-500 hover:underline text-sm font-bold">Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAddBillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Generate Bill</h3>
                <button onClick={() => setShowAddBillModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
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
                <button type="submit" className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg">Generate & Post Bill</button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddPGModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Add New PG Property</h3>
                <button onClick={() => setShowAddPGModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddPG} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="PG Name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.name} onChange={e => setNewPG({...newPG, name: e.target.value})} />
                  <input required placeholder="City" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.city} onChange={e => setNewPG({...newPG, city: e.target.value})} />
                </div>
                <input required placeholder="Full Address" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.address} onChange={e => setNewPG({...newPG, address: e.target.value})} />
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
                  <label className="block text-xs font-bold text-gray-400 uppercase">PG Image</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-accent transition-colors group bg-gray-50 overflow-hidden min-h-[120px] flex items-center justify-center">
                    {pgImagePreview ? (
                      <div className="relative w-full h-full group">
                        <img src={pgImagePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg object-cover" />
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
                          <span className="text-sm font-medium text-gray-600">Select or drop image (Max 2MB)</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Deposit (₹)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPG.security_deposit} onChange={e => setNewPG({...newPG, security_deposit: e.target.value})} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create PG Listing'}
                </button>
              </form>
            </motion.div>
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
                  <input type="number" placeholder="Deposit (₹)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={editingPG.security_deposit} onChange={e => setEditingPG({...editingPG, security_deposit: e.target.value})} />
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
                <input required placeholder="Room Number (e.g. 101)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newRoom.room_number} onChange={e => setNewRoom({...newRoom, room_number: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Total Seats</label>
                    <input required type="number" placeholder="2" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newRoom.total_seats} onChange={e => setNewRoom({...newRoom, total_seats: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Price Per Seat (₹)</label>
                    <input required type="number" placeholder="5000" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newRoom.price_per_seat} onChange={e => setNewRoom({...newRoom, price_per_seat: Number(e.target.value)})} />
                  </div>
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
                        <button onClick={() => handlePromoteUser(u.id, 'admin')} className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Shield className="w-4 h-4" /></button>
                        <button onClick={() => handlePromoteUser(u.id, 'sub_admin')} className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ShieldCheck className="w-4 h-4" /></button>
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
                          <th className="px-6 py-4">Room</th>
                          <th className="px-6 py-4">Contract</th>
                          <th className="px-6 py-4">Payment Status</th>
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
                              <div className="font-bold text-accent">Room {tenant.rooms?.room_number}</div>
                              <div className="text-xs text-gray-400 uppercase tracking-tighter">{tenant.type} STAY</div>
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
                              <button 
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setShowKYCModal(true);
                                }}
                                className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all flex items-center space-x-2"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Review KYC</span>
                              </button>
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
                      <img src={selectedTenant.user_photo_url} alt="Tenant" className="w-full h-full object-cover" />
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
                      <img src={selectedTenant.university_id_url} alt="ID Card" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <FileText className="w-8 h-8 mb-2" />
                        <span className="text-xs">No ID card uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Aadhar Front */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center">
                    <Shield className="w-3 h-3 mr-2" /> Aadhar Card (Front)
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group relative">
                    {selectedTenant.aadhar_front_url ? (
                      <img src={selectedTenant.aadhar_front_url} alt="Aadhar Front" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Shield className="w-8 h-8 mb-2" />
                        <span className="text-xs">No document uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Aadhar Back */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center">
                    <Shield className="w-3 h-3 mr-2" /> Aadhar Card (Back)
                  </label>
                  <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group relative">
                    {selectedTenant.aadhar_back_url ? (
                      <img src={selectedTenant.aadhar_back_url} alt="Aadhar Back" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Shield className="w-8 h-8 mb-2" />
                        <span className="text-xs">No document uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
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
                    onClick={() => handleVerifyKYC(selectedTenant.id, false)}
                    className="flex-grow py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all"
                  >
                    Revoke Verification
                  </button>
                ) : (
                  <button 
                    onClick={() => handleVerifyKYC(selectedTenant.id, true)}
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

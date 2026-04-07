import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { LogOut, Wrench, Clock, CheckCircle2, AlertCircle, Droplets, Zap, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ServiceWorkerDashboard = () => {
  const { userData, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derive worker's specialty from their role (e.g. 'plumber', 'electrician', 'wifi' or 'service_worker' with metadata)
  // For simplicity, if their role is strictly 'plumber', we map it to 'Plumbing'
  const getCategoryFromRole = (role) => {
    switch (role?.toLowerCase()) {
      case 'plumber': return 'Plumbing';
      case 'electrician': return 'Electrical';
      case 'wifi': return 'Internet/WiFi';
      default: return null; // Can view all if not strictly categorized
    }
  };

  const workerCategory = getCategoryFromRole(userData?.role);

  useEffect(() => {
    fetchAssignedComplaints();
  }, [userData]);

  const fetchAssignedComplaints = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('complaints')
        .select(`
          *,
          rooms:room_id (room_number),
          pgs:pg_id (name)
        `)
        .order('created_at', { ascending: false });
        
      if (workerCategory) {
        query = query.eq('category', workerCategory);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
      fetchAssignedComplaints();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update task');
    }
  };

  const getUrgencySettings = (urgency) => {
    switch (urgency) {
      case 'high': return { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' };
      case 'medium': return { color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' };
      case 'low': return { color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200' };
      default: return { color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-200' };
    }
  };

  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'Plumbing': return <Droplets className="w-5 h-5" />;
      case 'Electrical': return <Zap className="w-5 h-5" />;
      case 'Internet/WiFi': return <Wifi className="w-5 h-5" />;
      default: return <Wrench className="w-5 h-5" />;
    }
  };

  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-[#fdf8ff] font-['Manrope'] text-[#342d55] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#e7c9ff] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#61c2ff] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-[#ffffff]/60 backdrop-blur-3xl p-6 rounded-[2rem] border border-[#ffffff]/50 shadow-[0_20px_40px_rgba(52,45,85,0.06)] mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4a4bd7] to-[#842cd3] flex items-center justify-center text-white font-bold text-xl">
              {userData?.full_name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#342d55]">Worker Dashboard</h1>
              <p className="text-[#615985] text-sm">{userData?.full_name} • {workerCategory || 'General Support'}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center text-[#ac3149] bg-[#fff7f7] hover:bg-[#f76a80] hover:text-white px-4 py-2 rounded-xl transition-all font-bold text-sm">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Pending Assignments', value: pendingCount, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-[#fffaeb]', border: 'border-yellow-100' },
            { label: 'In Progress', value: inProgressCount, icon: Clock, color: 'text-[#4a4bd7]', bg: 'bg-[#f1ebff]', border: 'border-[#ded4ff]' },
            { label: 'Completed Tasks', value: resolvedCount, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' }
          ].map((stat, i) => (
            <div key={i} className={`p-6 rounded-[2rem] border ${stat.bg} ${stat.border} shadow-sm`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.color} bg-white/50 backdrop-blur-sm`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[#342d55]">{stat.value}</span>
              </div>
              <h3 className="font-bold text-[#615985]">{stat.label}</h3>
            </div>
          ))}
        </div>

        {/* Task List */}
        <div>
          <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] mb-6 flex items-center">
            <Wrench className="w-6 h-6 mr-3 text-[#4a4bd7]" />
            Active Tasks
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-[#e6deff] border-t-[#4a4bd7] rounded-full animate-spin"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-20 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/50 shadow-sm">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[#615985]">All caught up!</h3>
              <p className="text-[#a099b4]">There are no pending service requests for you at this moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complaints.map((task) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={task.id} 
                  className={`bg-white/70 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/50 shadow-[0_20px_40px_rgba(52,45,85,0.04)] hover:shadow-[0_20px_40px_rgba(52,45,85,0.08)] transition-all flex flex-col ${task.status === 'resolved' ? 'opacity-60' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getUrgencySettings(task.urgency).bg} ${getUrgencySettings(task.urgency).color}`}>
                      {getCategoryIcon(task.category)}
                      <span className="ml-2">{task.urgency} Priority</span>
                    </span>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                      task.status === 'pending' ? 'bg-[#fffaeb] text-yellow-700' :
                      task.status === 'in_progress' ? 'bg-[#f1ebff] text-[#4a4bd7]' : 'bg-green-50 text-green-700'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#4a4bd7] mb-1">
                      {task.rooms?.room_number ? `Room ${task.rooms.room_number}` : 'Unknown Room'}
                    </h3>
                    <p className="text-sm font-medium text-[#7d75a2]">{task.pgs?.name}</p>
                  </div>

                  <div className="bg-[#fcfaff] p-4 rounded-xl border border-[#f1ebff] flex-grow mb-6 relative">
                    <span className="absolute -top-3 left-4 text-3xl text-[#e6deff] font-serif">"</span>
                    <p className="text-[#615985] text-sm relative z-10 pt-2">{task.description}</p>
                  </div>

                  <div className="flex space-x-2 mt-auto">
                    {task.status === 'pending' && (
                      <button 
                        onClick={() => updateComplaintStatus(task.id, 'in_progress')}
                        className="flex-grow bg-[#f1ebff] text-[#4a4bd7] hover:bg-[#e6deff] py-3 rounded-xl font-bold text-sm transition-colors"
                      >
                        Start Work
                      </button>
                    )}
                    {task.status !== 'resolved' && (
                      <button 
                         onClick={() => updateComplaintStatus(task.id, 'resolved')}
                         className="flex-grow bg-gradient-to-r from-[#4a4bd7] to-[#842cd3] text-white shadow-lg shadow-[#4a4bd7]/30 hover:shadow-[#4a4bd7]/50 py-3 rounded-xl font-bold text-sm transition-all"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {task.status === 'resolved' && (
                      <div className="flex-grow text-center text-green-600 font-bold bg-green-50 py-3 rounded-xl cursor-default">
                        Completed
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkerDashboard;

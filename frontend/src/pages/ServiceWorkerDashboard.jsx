import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../config/supabase';
import { LogOut, Wrench, Clock, CheckCircle2, AlertCircle, Droplets, Zap, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ServiceWorkerDashboard = () => {
  const { userData, logout } = useAuth();
  const { theme } = useTheme();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCategoryFromRole = (role) => {
    switch (role?.toLowerCase()) {
      case 'plumber': return 'Plumbing';
      case 'electrician': return 'Electrical';
      case 'wifi': return 'Internet/WiFi';
      default: return null; 
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
      case 'high': return { color: 'text-error', bg: 'bg-error/10 border-error/20' };
      case 'medium': return { color: 'text-primary', bg: 'bg-primary/10 border-primary/20' };
      case 'low': return { color: 'text-success', bg: 'bg-success/15 border-success/35' };
      default: return { color: 'text-text-secondary', bg: 'bg-surface-container border-border-low' };
    }
  };

  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'Plumbing': return <Droplets className="w-4 h-4 shrink-0" />;
      case 'Electrical': return <Zap className="w-4 h-4 shrink-0" />;
      case 'Internet/WiFi': return <Wifi className="w-4 h-4 shrink-0" />;
      default: return <Wrench className="w-4 h-4 shrink-0" />;
    }
  };

  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-background text-on-background py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Panel */}
        <div className="flex justify-between items-center bg-surface-main border border-border-low p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-lg shrink-0 uppercase">
              {userData?.full_name?.charAt(0) || 'W'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">Service Worker Portal</h1>
              <p className="text-text-secondary text-xs font-semibold mt-0.5">{userData?.full_name} • {workerCategory || 'General Support Specialist'}</p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center gap-1.5 px-4 py-2 bg-error-container text-on-error-container font-bold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" /> 
            <span>Logout</span>
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-main border border-border-low p-5 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Pending Jobs</span>
              <span className="block text-2xl font-bold text-primary">{pendingCount}</span>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <AlertCircle className="w-5 h-5 shrink-0" />
            </div>
          </div>
          
          <div className="bg-surface-main border border-border-low p-5 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">In Progress</span>
              <span className="block text-2xl font-bold text-primary">{inProgressCount}</span>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <Clock className="w-5 h-5 shrink-0" />
            </div>
          </div>

          <div className="bg-surface-main border border-border-low p-5 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Completed Tasks</span>
              <span className="block text-2xl font-bold text-success">{resolvedCount}</span>
            </div>
            <div className="p-2.5 bg-success/15 rounded-lg text-success border border-success/20">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            </div>
          </div>
        </div>

        {/* Active Tasks Queue */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary shrink-0" />
            <span>Active Assignments Queue</span>
          </h2>

          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-text-secondary">Syncing active queue tasks...</div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low border border-dashed border-border-low rounded-xl space-y-2">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
              <h3 className="text-base font-bold text-text-primary">All Caught Up!</h3>
              <p className="text-text-secondary text-xs">There are no pending service tickets in your specialty at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complaints.map((task) => {
                const isResolved = task.status === 'resolved';
                const urgency = getUrgencySettings(task.urgency);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={task.id} 
                    className={`bg-surface-main border border-border-low p-5 rounded-xl flex flex-col justify-between h-72 shadow-sm ${
                      isResolved ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${urgency.bg} ${urgency.color}`}>
                        {getCategoryIcon(task.category)}
                        <span>{task.urgency} Urgency</span>
                      </span>
                      
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${
                        task.status === 'pending' ? 'bg-primary/20 text-primary border-primary/30' :
                        task.status === 'in_progress' ? 'bg-primary/10 text-primary border-primary/20' :
                        'bg-success/15 text-success border-success/35'
                      }`}>
                        {task.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="my-3">
                      <h3 className="font-bold text-lg text-text-primary">
                        {task.rooms?.room_number ? `Room #${task.rooms.room_number}` : 'Common Area'}
                      </h3>
                      <p className="text-text-secondary text-xs font-semibold mt-0.5">{task.pgs?.name || 'Apna Rooms Stay'}</p>
                    </div>

                    <div className="bg-surface-container-low border border-border-low p-3.5 rounded-lg flex-grow overflow-y-auto mb-4 min-h-[70px]">
                      <p className="text-text-secondary text-xs font-semibold leading-relaxed">
                        "{task.description}"
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {task.status === 'pending' && (
                        <button 
                          onClick={() => updateComplaintStatus(task.id, 'in_progress')}
                          className="flex-1 bg-surface-container border border-border-low hover:bg-surface-container-high py-2 rounded-lg text-xs font-bold text-text-primary uppercase tracking-wider cursor-pointer"
                        >
                          Start Job
                        </button>
                      )}
                      {task.status !== 'resolved' && (
                        <button 
                          onClick={() => updateComplaintStatus(task.id, 'resolved')}
                          className="flex-1 bg-primary text-on-primary py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                        >
                          Mark Complete
                        </button>
                      )}
                      {isResolved && (
                        <div className="flex-1 text-center text-success font-bold bg-success/10 py-2 rounded-lg text-xs cursor-default">
                          Task Complete
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ServiceWorkerDashboard;

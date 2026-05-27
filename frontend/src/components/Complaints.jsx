import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Clock, AlertCircle, Droplets, Zap as ZapIcon, Wifi } from 'lucide-react';
import { toast } from 'react-hot-toast';

const serviceTypes = [
  { id: 'Plumbing', label: 'Plumbing Service', icon: Droplets },
  { id: 'Electrical', label: 'Electrical Work', icon: ZapIcon },
  { id: 'Internet/WiFi', label: 'Internet/WiFi SLA', icon: Wifi }
];

const Complaints = ({ booking }) => {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    category: 'Plumbing',
    description: '',
    urgency: 'medium'
  });

  useEffect(() => {
    if (!booking) {
      setLoading(false);
      return;
    }
    if (booking?.room_id) {
      fetchComplaints();
    } else {
      setLoading(false);
    }
  }, [booking]);

  const fetchComplaints = async () => {
    if (!booking?.room_id) return;
    try {
      const { data } = await supabase
        .from('complaints')
        .select('*, pgs:pg_id (name), rooms:room_id (room_number)')
        .eq('room_id', booking.room_id)
        .order('created_at', { ascending: false });
      
      if (data) setComplaints(data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking?.room_id) {
      toast.error('Active stay required to register tickets.');
      return;
    }

    try {
      const { error } = await supabase
        .from('complaints')
        .insert([{
          ...newComplaint,
          user_id: currentUser?.uid || booking.user_id,
          room_id: booking.room_id,
          pg_id: booking.pg_id,
          status: 'pending'
        }]);
      
      if (error) throw error;
      
      toast.success('Service Request registered successfully!');
      setIsModalOpen(false);
      setNewComplaint({
        category: 'Plumbing',
        description: '',
        urgency: 'medium'
      });
      fetchComplaints();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to register request.');
    }
  };

  const openServiceModal = (category) => {
    setNewComplaint(prev => ({ ...prev, category }));
    setIsModalOpen(true);
  };

  const getStatusStyle = (status) => {
    if (!status) return 'bg-surface-container text-text-secondary border-border-low';
    switch (status) {
      case 'pending': return 'bg-primary/10 text-primary border-primary/20';
      case 'in_progress': return 'bg-primary/20 text-primary border-primary/30';
      case 'resolved': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-surface-container text-text-secondary border-border-low';
    }
  };

  return (
    <div className="space-y-6">
      {!booking ? (
        <div className="text-center py-16 bg-surface-container-low border border-dashed border-border-low rounded-xl space-y-3">
          <AlertCircle className="w-10 h-10 text-outline mx-auto" />
          <h3 className="text-base font-bold text-text-primary">No Active Stay</h3>
          <p className="text-text-secondary text-xs">You need a confirmed stay to request utility maintenance.</p>
        </div>
      ) : (
        <>
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-gradient-to-br from-primary to-primary-container rounded-xl text-on-primary shadow-sm gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Utility & Service Support</h2>
              <p className="text-primary-fixed-dim/90 text-xs font-semibold mt-0.5">
                {booking?.pgs?.name} - Room #{booking?.rooms?.room_number}
              </p>
            </div>
            <div className="px-3.5 py-1.5 bg-surface-main text-primary rounded-lg text-xs font-bold font-mono tracking-wider shrink-0">
              SLA GUARANTEED
            </div>
          </div>

          {/* Quick Request Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-text-primary tracking-tight">Quick Action Request</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {serviceTypes.map((service) => (
                <div 
                  key={service.id} 
                  onClick={() => openServiceModal(service.id)}
                  className="cursor-pointer p-5 bg-surface-container-low border border-border-low rounded-xl hover:border-outline transition-colors flex items-center gap-4 group"
                >
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                    <service.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-text-primary">{service.label}</h4>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-0.5">Tap to request</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tickets List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary tracking-tight">Recent Utility Tickets</h3>
              <button 
                onClick={() => openServiceModal('Other')}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-border-low rounded-lg text-text-primary font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                + Custom Issue
              </button>
            </div>
            
            <div className="space-y-4">
              {complaints.length > 0 ? (
                complaints.map((item) => (
                  <div key={item.id} className="bg-surface-main p-5 rounded-lg border border-border-low flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${getStatusStyle(item.status)}`}>
                          {item.status?.replace('_', ' ') || 'UNKNOWN'}
                        </span>
                        <span className="text-[10px] font-semibold text-text-secondary font-mono">#{item.id?.slice(0, 8) || 'N/A'}</span>
                      </div>
                      <h4 className="font-bold text-text-primary text-base">{item.category}</h4>
                      <p className="text-text-secondary text-xs font-medium leading-relaxed max-w-xl">{item.description}</p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                      <span className="text-[9px] font-bold text-text-secondary/70 uppercase tracking-wider font-mono">
                        {item.pgs?.name || booking?.pgs?.name} - Room {item.rooms?.room_number || booking?.rooms?.room_number}
                      </span>
                      <div className="px-3 py-1 bg-surface-container-low border border-border-low rounded-lg flex items-center text-text-secondary">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        <span className="text-[10px] font-bold font-mono">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-surface-container-low border border-dashed border-border-low rounded-lg space-y-2">
                  <MessageSquare className="w-8 h-8 text-outline mx-auto" />
                  <h3 className="text-sm font-bold text-text-primary">No active tickets</h3>
                  <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Everything is operational in your room.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-main border border-border-low rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-text-primary tracking-tight">Request Service</h3>
              <p className="text-text-secondary text-xs mt-1">Our support staff will resolve tickets under 4hr SLA.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 block">Service Area</label>
                <select 
                  className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 px-3 text-text-primary text-sm font-semibold focus:border-primary focus:outline-none transition-colors cursor-pointer"
                  value={newComplaint.category}
                  onChange={(e) => setNewComplaint({...newComplaint, category: e.target.value})}
                >
                  <option className="bg-surface-main">Plumbing</option>
                  <option className="bg-surface-main">Electrical</option>
                  <option className="bg-surface-main">Internet/WiFi</option>
                  <option className="bg-surface-main">Furniture</option>
                  <option className="bg-surface-main">Cleaning</option>
                  <option className="bg-surface-main">Other</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 block">Urgency Status</label>
                <div className="flex bg-surface-container-low p-1 rounded-lg border border-border-low gap-1">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewComplaint({...newComplaint, urgency: level})}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold capitalize transition-colors ${
                        newComplaint.urgency === level 
                          ? 'bg-primary text-on-primary shadow-sm' 
                          : 'text-text-secondary hover:bg-surface-container'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1 block">Description of issue</label>
                <textarea 
                  required
                  rows="4"
                  className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 px-3 text-text-primary text-sm placeholder:text-text-secondary/50 focus:border-primary focus:outline-none transition-colors resize-none"
                  placeholder="Describe the issue in detail (e.g. WiFi router red light flashing)..."
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-surface-container border border-border-low rounded-lg text-text-primary font-bold text-xs uppercase tracking-wider hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;

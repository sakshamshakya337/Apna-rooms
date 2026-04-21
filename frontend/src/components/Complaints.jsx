import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Clock, AlertCircle, Plus, Droplets, Zap as ZapIcon, Wifi } from 'lucide-react';
import { toast } from 'react-hot-toast';

const serviceTypes = [
  { id: 'Plumbing', label: 'Plumber', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
  { id: 'Electrical', label: 'Electrician', icon: ZapIcon, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-100' },
  { id: 'Internet/WiFi', label: 'Wifi', icon: Wifi, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' }
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
    if (booking?.room_id) {
      fetchComplaints();
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
      toast.error('You must have an active booking to register a complaint.');
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
    if (!status) return 'bg-gray-100 text-gray-700';
    switch (status) {
      case 'pending': return 'bg-[#f7f1ff] text-[#7614c4] border-[#e7c9ff]';
      case 'in_progress': return 'bg-[#fdf8ff] text-[#4a4bd7] border-[#babbff]';
      case 'resolved': return 'bg-[#f5f9ff] text-[#006592] border-[#61c2ff]';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-10 font-['Manrope']">
      {!booking ? (
        <div className="text-center py-20 bg-[#fdf8ff] rounded-[2rem] border border-[#f1ebff] shadow-sm">
          <AlertCircle className="w-12 h-12 text-[#b5acdc] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#615985] font-['Plus_Jakarta_Sans']">No Active Booking</h3>
          <p className="text-[#a099b4]">You need to book a room before you can request services.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-gradient-to-br from-[#4a4bd7] to-[#842cd3] rounded-[2rem] text-white shadow-[0_20px_40px_rgba(52,45,85,0.06)] relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-['Plus_Jakarta_Sans'] font-bold mb-2 tracking-tight">Service Support</h2>
              <p className="text-[#f0dbff] opacity-90 font-medium tracking-wide">
                {booking?.pgs?.name} - Room {booking?.rooms?.room_number}
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#fdf8ff] opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute top-0 right-20 w-32 h-32 bg-[#34b5fa] opacity-20 rounded-full blur-2xl"></div>
          </div>

          <div>
            <h3 className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-[#342d55] mb-6 tracking-tight">Quick Request</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {serviceTypes.map((service) => (
                <div 
                  key={service.id} 
                  onClick={() => openServiceModal(service.id)}
                  className={`cursor-pointer p-6 rounded-[2rem] border ${service.border} ${service.bg} hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-[0_20px_40px_rgba(52,45,85,0.06)] flex flex-col items-center justify-center text-center`}
                >
                  <div className={`p-4 rounded-full bg-white mb-4 shadow-sm ${service.color}`}>
                    <service.icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-[#342d55] tracking-tight">{service.label}</h4>
                  <p className="text-sm font-medium text-[#615985]">Tap to request</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#fcfcgf] rounded-[2rem]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-[#342d55] tracking-tight">Recent Requests</h3>
                <button 
                  onClick={() => openServiceModal('Other')}
                  className="bg-[#f1ebff] text-[#4a4bd7] px-4 py-2 rounded-full font-bold text-sm tracking-wide hover:bg-[#ece4ff] transition-colors"
                >
                  + Other Issue
                </button>
            </div>
            
            <div className="space-y-6">
              {complaints.length > 0 ? (
                complaints.map((item) => (
                  <div key={item.id} className="bg-[#ffffff] p-6 rounded-[2rem] border border-[#f1ebff] shadow-[0_10px_30px_rgba(52,45,85,0.03)] flex flex-col hover:shadow-[0_20px_40px_rgba(52,45,85,0.08)] transition-shadow relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusStyle(item.status)}`}>
                          {item.status?.replace('_', ' ') || 'UNKNOWN'}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#a099b4] uppercase tracking-wide">#{item.id?.slice(0, 8) || 'N/A'}</span>
                    </div>
                    
                    <h3 className="text-xl font-['Plus_Jakarta_Sans'] font-bold text-[#342d55] mb-2">{item.category}</h3>
                    <p className="text-[#615985] text-sm leading-relaxed mb-4">{item.description}</p>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#7d75a2] mb-4">
                      {item.pgs?.name || booking?.pgs?.name} - Room {item.rooms?.room_number || booking?.rooms?.room_number}
                    </div>
                    
                    <div className="mt-auto px-4 py-2 bg-[#fdf8ff] rounded-xl self-start flex items-center border border-[#e6deff]">
                      <Clock className="w-4 h-4 mr-2 text-[#7d75a2]" />
                      <span className="text-xs font-bold tracking-wide text-[#342d55]">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-[#f7f1ff] rounded-[2rem] border border-[#e6deff]">
                  <MessageSquare className="w-10 h-10 text-[#7d75a2] mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-[#342d55]">No service requests found</h3>
                  <p className="text-sm text-[#615985]">Everything seems to be working fine!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f0b20]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-[#ffffff] rounded-[2rem] p-8 max-w-lg w-full relative z-10 shadow-[0_40px_80px_rgba(52,45,85,0.15)] animate-in zoom-in-95 duration-200">
            <h3 className="text-3xl font-['Plus_Jakarta_Sans'] font-bold text-[#342d55] mb-2 tracking-tight">Request Service</h3>
            <p className="text-[#615985] font-medium mb-6">Our team will resolve this as soon as possible.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#7d75a2] mb-2">Service Type</label>
                <select 
                  className="w-full p-4 bg-[#fdf8ff] border border-[#e6deff] rounded-xl focus:ring-2 focus:ring-[#4a4bd7] outline-none text-[#342d55] font-medium"
                  value={newComplaint.category}
                  onChange={(e) => setNewComplaint({...newComplaint, category: e.target.value})}
                >
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Internet/WiFi</option>
                  <option>Furniture</option>
                  <option>Cleaning</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#7d75a2] mb-2">Priority Level</label>
                <div className="flex space-x-3 bg-[#fdf8ff] p-1.5 rounded-2xl border border-[#e6deff]">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewComplaint({...newComplaint, urgency: level})}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize tracking-wide transition-all ${
                        newComplaint.urgency === level 
                          ? 'bg-gradient-to-r from-[#4a4bd7] to-[#842cd3] text-white shadow-md' 
                          : 'text-[#615985] hover:bg-[#ece4ff]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#7d75a2] mb-2">Description</label>
                <textarea 
                  required
                  rows="4"
                  className="w-full p-4 bg-[#fdf8ff] border border-[#e6deff] rounded-xl focus:ring-2 focus:ring-[#4a4bd7] outline-none text-[#342d55] resize-none"
                  placeholder="Please describe the issue in detail..."
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-[#f7f1ff] text-[#342d55] rounded-full font-bold tracking-wide hover:bg-[#ece4ff] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-gradient-to-r from-[#4a4bd7] to-[#842cd3] text-white rounded-full font-bold tracking-wide hover:shadow-[0_10px_20px_rgba(74,75,215,0.3)] transition-all hover:-translate-y-0.5"
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

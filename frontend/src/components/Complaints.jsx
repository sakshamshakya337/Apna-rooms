import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Complaints = ({ booking }) => {
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
        .select('*')
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
          user_id: booking.user_id,
          room_id: booking.room_id,
          pg_id: booking.pg_id,
          status: 'pending'
        }]);
      
      if (error) throw error;
      
      toast.success('Complaint registered successfully!');
      setIsModalOpen(false);
      setNewComplaint({
        category: 'Plumbing',
        description: '',
        urgency: 'medium'
      });
      fetchComplaints();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to register complaint.');
    }
  };

  const getStatusStyle = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {!booking ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">No Active Booking</h3>
          <p className="text-gray-500">You need to book a room before you can register any complaints.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">Complaints</h2>
              <p className="text-gray-500">Report issues and track their resolution progress</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-gray-800 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>New Complaint</span>
            </button>
          </div>

          <div className="space-y-4">
            {complaints.length > 0 ? (
              complaints.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusStyle(item.status)}`}>
                        {item.status?.replace('_', ' ') || 'UNKNOWN'}
                      </div>
                      <span className="text-sm font-medium text-gray-400">#{item.id?.slice(0, 8) || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getUrgencyIcon(item.urgency)}
                      <span className="text-xs font-bold uppercase text-gray-400">{item.urgency}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.category}</h3>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <div className="text-xs text-gray-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Reported on {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400">No active complaints</h3>
                <p className="text-gray-500">Everything looks great in your room!</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal - Simplified */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-6">Register Complaint</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-accent"
                  value={newComplaint.category}
                  onChange={(e) => setNewComplaint({...newComplaint, category: e.target.value})}
                >
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Furniture</option>
                  <option>Internet/WiFi</option>
                  <option>Cleaning</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Urgency</label>
                <div className="flex space-x-3">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewComplaint({...newComplaint, urgency: level})}
                      className={`flex-1 py-2 rounded-xl border-2 font-bold capitalize transition-all ${
                        newComplaint.urgency === level 
                          ? 'bg-primary text-white border-primary' 
                          : 'border-gray-100 text-gray-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea 
                  required
                  rows="4"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-accent"
                  placeholder="Describe the issue in detail..."
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-accent text-white rounded-xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-200"
                >
                  Submit
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

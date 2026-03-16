import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, MapPin, Shield, Users, CheckCircle, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PGDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [pg, setPg] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingType, setBookingType] = useState('single'); // 'single' or 'complete'
  const [paymentPlan, setPaymentPlan] = useState('full'); // 'full' or 'half'
  const [contractDuration, setContractDuration] = useState(1); // 1, 6, 12 months

  const MOCKUP_IMAGE = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80";

  useEffect(() => {
    fetchPGDetail();
  }, [id]);

  const fetchPGDetail = async () => {
    setLoading(true);
    try {
      const { data: pgData, error: pgError } = await supabase
        .from('pgs')
        .select('*')
        .eq('id', id)
        .single();

      if (pgError) throw pgError;

      if (pgData) {
        setPg(pgData);
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('pg_id', id);
        
        if (roomError) throw roomError;
        setRooms(roomData || []);
      }
    } catch (err) {
      console.error('Error fetching PG details:', err);
      toast.error('Failed to load PG details');
    } finally {
      setLoading(false);
    }
  };

  const getPricing = () => {
    if (!selectedRoom) return { rent: 0, deposit: 0, total: 0, payableNow: 0 };
    
    const basePrice = Number(selectedRoom.price_per_seat);
    const rent = bookingType === 'single' ? basePrice : (basePrice * Number(selectedRoom.total_seats));
    const deposit = Number(pg?.security_deposit ?? 2000);
    const bookingAmount = paymentPlan === 'half' ? (rent / 2) : rent;
    
    return {
      rent,
      deposit,
      total: rent + deposit,
      payableNow: bookingAmount + deposit
    };
  };

  const pricing = getPricing();

  const handleBooking = async () => {
    if (!currentUser) {
      toast.error('Please login to book a room');
      return navigate('/login');
    }

    if (!selectedRoom) {
      return toast.error('Please select a room first');
    }

    // Razorpay Integration Logic will go here
    navigate(`/booking-confirmation/${id}?room=${selectedRoom.id}&type=${bookingType}&plan=${paymentPlan}&duration=${contractDuration}`);
  };

  if (loading) return <div className="p-12 text-center text-xl">Loading details...</div>;
  if (!pg) return <div className="p-12 text-center text-xl">PG not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Images & Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-3xl overflow-hidden shadow-lg h-[500px]">
            <img 
              src={pg.main_image || MOCKUP_IMAGE} 
              alt={pg.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">{pg.name}</h1>
            <div className="flex items-center text-gray-500 mb-6">
              <MapPin className="w-5 h-5 mr-1" />
              <span>{pg.address}, {pg.city}</span>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold mb-4">About this PG</h2>
              <p className="text-gray-600 leading-relaxed mb-8">{pg.description}</p>
              
              <h3 className="text-xl font-bold mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {pg.amenities?.map((amenity, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>

              {pg.rules && pg.rules.length > 0 && (
                <>
                  <h3 className="text-xl font-bold mt-8 mb-4">Rules & Regulations</h3>
                  <div className="space-y-3">
                    {pg.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start space-x-3 text-gray-600 bg-gray-50 p-3 rounded-xl">
                        <Info className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rule}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Booking */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-3xl p-8 shadow-xl border border-gray-100 space-y-6">
            <h3 className="text-2xl font-bold">Book Your Space</h3>
            
            <div className="space-y-4">
              <label className="block font-medium text-gray-700">Select Room</label>
              <div className="grid grid-cols-1 gap-3">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex space-x-4 ${
                      selectedRoom?.id === room.id 
                        ? 'border-accent bg-blue-50' 
                        : 'border-gray-100 hover:border-accent'
                    }`}
                  >
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img 
                        src={room.image_url || MOCKUP_IMAGE} 
                        alt={`Room ${room.room_number}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center font-bold">
                        <span>Room {room.room_number}</span>
                        <span className="text-accent flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          {room.price_per_seat}/seat
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {room.available_seats} seats available of {room.total_seats}
                      </div>
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {room.amenities.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-400 rounded-md uppercase tracking-wider">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedRoom && (
              <div className="space-y-4 pt-4 border-t">
                <label className="block font-medium text-gray-700">Booking Type</label>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => setBookingType('single')}
                    disabled={selectedRoom.available_seats <= 0}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                      bookingType === 'single' ? 'bg-primary text-white border-primary' : 'border-gray-100 hover:border-primary/30'
                    } disabled:opacity-30`}
                  >
                    Single Seat
                  </button>
                  <button 
                    onClick={() => setBookingType('complete')}
                    disabled={selectedRoom.available_seats < selectedRoom.total_seats}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                      bookingType === 'complete' ? 'bg-primary text-white border-primary' : 'border-gray-100 hover:border-primary/30'
                    } disabled:opacity-30`}
                  >
                    Complete Room
                  </button>
                </div>
                {selectedRoom.available_seats < selectedRoom.total_seats && selectedRoom.available_seats > 0 && (
                  <p className="text-xs text-yellow-600 font-medium">Complete room booking is only available for empty rooms.</p>
                )}

                <label className="block font-medium text-gray-700 pt-4">Payment Plan</label>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => setPaymentPlan('full')}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                      paymentPlan === 'full' ? 'bg-accent text-white border-accent' : 'border-gray-100 hover:border-accent/30'
                    }`}
                  >
                    Full Rent
                  </button>
                  <button 
                    onClick={() => setPaymentPlan('half')}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                      paymentPlan === 'half' ? 'bg-accent text-white border-accent' : 'border-gray-100 hover:border-accent/30'
                    }`}
                  >
                    Pay Half (Booking)
                  </button>
                </div>

                <label className="block font-medium text-gray-700 pt-4">Contract Duration</label>
                <div className="flex space-x-2">
                  {[
                    { label: '1 Month', value: 1 },
                    { label: '6 Months', value: 6 },
                    { label: '1 Year', value: 12 }
                  ].map((duration) => (
                    <button 
                      key={duration.value}
                      onClick={() => setContractDuration(duration.value)}
                      className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all text-sm ${
                        contractDuration === duration.value ? 'bg-accent text-white border-accent' : 'border-gray-100 hover:border-accent/30'
                      }`}
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{paymentPlan === 'half' ? 'Booking Amount (50%)' : 'Rent'}</span>
                    <span>₹{paymentPlan === 'half' ? pricing.rent / 2 : pricing.rent}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Security Deposit</span>
                    <span>₹{pricing.deposit}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total Payable Now</span>
                    <span>₹{pricing.payableNow}</span>
                  </div>
                </div>

                <button 
                  onClick={handleBooking}
                  className="w-full bg-accent text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg flex flex-col items-center leading-tight"
                >
                  <span>Book Now</span>
                  <span className="text-[10px] opacity-80 font-normal">
                    Pay ₹{pricing.payableNow} to reserve
                  </span>
                </button>
              </div>
            )}

            {!selectedRoom && (
              <div className="flex items-center space-x-2 text-gray-400 text-sm justify-center">
                <Info className="w-4 h-4" />
                <span>Select a room to see pricing</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PGDetail;

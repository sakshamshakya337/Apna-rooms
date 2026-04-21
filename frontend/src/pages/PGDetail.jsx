import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, MapPin, Shield, Users, CheckCircle, Info, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PGDetail = () => {
  const { id } = useParams();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [pg, setPg] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingType, setBookingType] = useState('complete'); // 'complete'
  const [paymentPlan, setPaymentPlan] = useState('full'); // 'full'
  const [contractDuration, setContractDuration] = useState(6); // 6, 12 months

  const MOCKUP_IMAGE = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80";
  const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];

  const hasActiveBooking = (room) => {
    return room.bookings?.some((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status));
  };

  const isRoomSoldOut = (room) => {
    return hasActiveBooking(room);
  };

  const getMissingProfileFields = () => {
    const category = userData?.studentCategory || 'National';
    const missing = [];

    if (!userData?.studentCategory) missing.push('student type');
    if (!userData?.phoneNumber) missing.push('student phone number');
    if (category !== 'International' && !userData?.parentPhoneNumber) {
      missing.push('parent/guardian phone number');
    }

    return missing;
  };

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
          .eq('pg_id', id)
          .order('room_number', { ascending: true });
        
        if (roomError) throw roomError;

        const enrichedRooms = await Promise.all((roomData || []).map(async (room) => {
          const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .select('id, status')
            .eq('room_id', room.id)
            .in('status', ACTIVE_BOOKING_STATUSES);

          return {
            ...room,
            bookings: bookingError ? [] : (bookingData || [])
          };
        }));

        setRooms(enrichedRooms);
      }
    } catch (err) {
      console.error('Error fetching PG details:', err);
      toast.error('Failed to load PG details');
    } finally {
      setLoading(false);
    }
  };

  const getPricing = () => {
    if (!selectedRoom) return { rent: 0, deposit: 0, total: 0, payableNow: 0, monthlyRent: 0 };
    
    const monthlyRent = Number(selectedRoom.price_per_seat);
    const duration = contractDuration || 6;
    const totalRentForContract = monthlyRent * duration;
    const deposit = Number(pg?.security_deposit ?? 2000);
    
    return {
      monthlyRent,
      rent: totalRentForContract,
      deposit,
      total: totalRentForContract + deposit,
      payableNow: totalRentForContract + deposit
    };
  };

  const USD_RATE = 83;
  const pricing = getPricing();

  const toUSD = (inr) => Math.round(inr / USD_RATE);
  const pgImages = pg
    ? Array.from(new Set([pg.main_image, ...(pg.images || [])].filter(Boolean)))
    : [];

  const handleBooking = async () => {
    if (!currentUser) {
      toast.error('Please login to book a room');
      return navigate('/login');
    }

    if (!selectedRoom) {
      return toast.error('Please select a room first');
    }

    const missingProfileFields = getMissingProfileFields();
    if (missingProfileFields.length > 0) {
      toast.error(`Complete profile first: ${missingProfileFields.join(', ')}`);
      return navigate('/dashboard?tab=profile');
    }

    if (isRoomSoldOut(selectedRoom)) {
      setSelectedRoom(null);
      return toast.error('This room is already booked.');
    }

    // Razorpay Integration Logic will go here
    navigate(`/booking-confirmation/${id}?room=${selectedRoom.id}&type=complete&plan=${paymentPlan}&duration=${contractDuration}`);
  };

  if (loading) return <div className="p-12 text-center text-xl font-['Sora'] text-white">Loading details...</div>;
  if (!pg) return <div className="p-12 text-center text-xl font-['Sora'] text-white">PG not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 relative overflow-hidden font-['Sora']">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -z-10"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Images & Info */}
        <div className="lg:col-span-2 space-y-8 text-white">
          <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-purple-900/10 h-[550px] relative group border-4 border-white/5">
            <img 
              src={pgImages[0] || MOCKUP_IMAGE} 
              alt={pg.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1e]/60 to-transparent"></div>
            <div className="absolute bottom-8 left-8">
              <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-xl">{pg.name}</h1>
            </div>
          </div>

          {pgImages.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pgImages.slice(1, 6).map((image, index) => (
                <div key={image} className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/20 shadow-xl bg-white/10">
                  <img
                    src={image}
                    alt={`${pg.name} gallery ${index + 2}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          )}

            <div className="flex items-center text-gray-300 mb-8 px-2 font-black text-sm uppercase tracking-widest">
              <MapPin className="w-5 h-5 mr-2 text-accent" />
              <span>{pg.address}, {pg.city}</span>
              {pg.google_map_url && (
                <a
                  href={pg.google_map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 px-4 py-2 bg-accent text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-accent-light transition-colors"
                >
                  Open Maps
                </a>
              )}
            </div>
            
            <div className="bg-white/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-black mb-6 text-primary">The Living Experience</h2>
              <p className="text-gray-700 leading-relaxed mb-10 text-lg font-medium">{pg.description}</p>
              
              <h3 className="text-xl font-black mb-6 text-primary flex items-center">
                <div className="p-2 bg-accent/20 rounded-xl mr-3 text-accent">
                  <CheckCircle className="w-5 h-5" />
                </div>
                Premium Amenities
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {pg.amenities?.map((amenity, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-gray-800 group bg-white/30 p-4 rounded-2xl border border-white/10 hover:border-accent/30 transition-all shadow-sm">
                    <CheckCircle className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm tracking-wide text-primary/80">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
        </div>

        {/* Right Column: Booking Logic */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 bg-white/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/40 shadow-2xl space-y-8">
            <h3 className="text-3xl font-black tracking-tight text-primary">Reserve Now</h3>
            
            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-2">Choose your space</label>
              <div className="grid grid-cols-1 gap-4">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    disabled={isRoomSoldOut(room)}
                    onClick={() => {
                      if (isRoomSoldOut(room)) {
                        toast.error('This room is sold out.');
                        return;
                      }
                      setSelectedRoom(room);
                    }}
                    className={`p-5 rounded-[2.5rem] border transition-all duration-500 flex space-x-4 group ${
                      selectedRoom?.id === room.id 
                        ? 'border-accent bg-accent/10 shadow-xl shadow-accent/10' 
                        : isRoomSoldOut(room)
                          ? 'border-red-100 bg-red-50/40 opacity-60 cursor-not-allowed'
                          : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-20 h-20 rounded-3xl overflow-hidden flex-shrink-0 bg-white/5 shadow-lg">
                      <img 
                        src={room.image_url || MOCKUP_IMAGE} 
                        alt={`Room ${room.room_number}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-grow text-left">
                      <div className="flex flex-col">
                        <span className="font-black text-primary">{pg.name} - Room {room.room_number}</span>
                        <div className="flex flex-col mt-1">
                          <span className="text-accent font-black text-sm flex items-center">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                            {room.price_per_seat} <span className="text-[10px] text-gray-600 ml-1">/ Monthly Rent</span>
                          </span>
                          <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">
                            ~ ${toUSD(room.price_per_seat)} USD
                          </span>
                        </div>
                      </div>
                      {isRoomSoldOut(room) && (
                        <div className="text-[10px] mt-2 font-black uppercase tracking-wider text-red-600">
                          Reserved
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedRoom && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 block">Stay Duration</label>
                  <div className="flex space-x-3">
                    {[
                      { label: '6 Months', value: 6 },
                      { label: '1 Year', value: 12 }
                    ].map((duration) => (
                      <button 
                        key={duration.value}
                        onClick={() => setContractDuration(duration.value)}
                        className={`flex-1 py-4 rounded-2xl border font-black transition-all text-[10px] uppercase tracking-widest ${
                          contractDuration === duration.value 
                          ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                          : 'bg-white/40 border-primary/10 text-primary/60 hover:text-primary hover:bg-white/60'
                        }`}
                      >
                        {duration.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/30 p-8 rounded-[2.5rem] space-y-4 border border-white/20 shadow-inner">
                  <div className="flex justify-between text-xs font-black uppercase tracking-wider text-gray-700">
                    <span>Deposit (Refundable)</span>
                    <span className="text-primary font-bold">₹{pricing.deposit}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-gray-600 pb-2">
                    <span />
                    <span>~ ${toUSD(pricing.deposit)} USD</span>
                  </div>
                  
                  <div className="flex justify-between font-black text-2xl pt-6 border-t border-primary/10 text-primary">
                    <span>Payable Now</span>
                    <div className="flex flex-col items-end">
                      <span className="text-accent">₹{pricing.payableNow}</span>
                      <span className="text-[10px] text-gray-700 uppercase tracking-[0.2em] mt-1 font-black">
                        ~ ${toUSD(pricing.payableNow)} USD
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 flex items-start space-x-4 shadow-xl">
                  <ShieldCheck className="w-6 h-6 text-accent mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Safe Residency</h4>
                    <p className="text-[11px] text-gray-600 mt-1 font-bold leading-relaxed">
                      KYC opens in the dashboard after admin confirms the booking.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleBooking}
                  className="w-full bg-accent hover:bg-accent-light text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1 transition-all active:scale-95 flex flex-col items-center leading-tight"
                >
                  <span>Confirm Booking</span>
                  <span className="text-[10px] opacity-70 font-black uppercase tracking-widest mt-1">
                    Secure This Room Instantly
                  </span>
                </button>
              </div>
            )}

            {!selectedRoom && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500 space-y-4">
                <Info className="w-8 h-8 opacity-20" />
                <span className="text-xs font-black uppercase tracking-widest">Select a room to proceed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PGDetail;

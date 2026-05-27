import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { IndianRupee, MapPin, CheckCircle, Info, ShieldCheck, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PGDetail = () => {
  const { slugAndId } = useParams();
  const id = slugAndId?.includes('--') ? slugAndId.split('--').pop() : slugAndId;
  const { currentUser, userData } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [pg, setPg] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
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

    if (!userData?.fullName?.trim()) missing.push('full name');
    if (!userData?.studentCategory) missing.push('student origin classification');
    if (!userData?.phoneNumber?.trim()) missing.push('resident phone number');
    if (category !== 'International' && !userData?.parentPhoneNumber?.trim()) {
      missing.push('parent/guardian phone number');
    }
    if (!userData?.address?.trim()) missing.push('home address');
    if (!userData?.city?.trim()) missing.push('city');
    if (!userData?.state?.trim()) missing.push('state');

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

  // Gallery lightbox state
  const [activePhotoIdx, setActivePhotoIdx] = useState(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const nextPhoto = () => {
    if (activePhotoIdx !== null) {
      setActivePhotoIdx((prev) => (prev + 1) % pgImages.length);
    }
  };

  const prevPhoto = () => {
    if (activePhotoIdx !== null) {
      setActivePhotoIdx((prev) => (prev - 1 + pgImages.length) % pgImages.length);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activePhotoIdx === null) return;
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') setActivePhotoIdx(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIdx, pgImages.length]);

  // Mobile/Tablet swipe controls
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      nextPhoto(); // Swipe left -> next
    }
    if (touchStart - touchEnd < -50) {
      prevPhoto(); // Swipe right -> prev
    }
    setTouchStart(0);
    setTouchEnd(0);
  };


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

    navigate(`/booking-confirmation/${id}?room=${selectedRoom.id}&type=complete&plan=full&duration=${contractDuration}`);
  };

  if (loading) return <div className="p-12 text-center text-lg font-mono text-text-secondary">Loading details...</div>;
  if (!pg) return <div className="p-12 text-center text-lg font-mono text-text-secondary">PG stay not found.</div>;

  return (
    <div className="min-h-screen bg-background text-on-background py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Info */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-6">
          <Link to="/pgs" className="hover:text-primary transition-colors">Browse Rooms</Link>
          <span className="font-mono">/</span>
          <span className="text-text-primary">{pg.name} Details</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Media & Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Showcase Image */}
            <div 
              onClick={() => setActivePhotoIdx(0)}
              className="rounded-xl overflow-hidden shadow-sm h-96 relative border border-border-low bg-surface-container cursor-zoom-in group/showcase"
            >
              <img 
                src={pgImages[0] || MOCKUP_IMAGE} 
                alt={pg.name}
                className="w-full h-full object-cover group-hover/showcase:scale-[1.03] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Glassmorphic Gallery Button Overlay */}
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/45 backdrop-blur-md rounded-lg border border-white/10 text-white text-[10px] font-bold tracking-wider flex items-center gap-1.5 uppercase opacity-90 group-hover/showcase:opacity-100 group-hover/showcase:bg-black/60 transition-all select-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <span>View {pgImages.length} Photos</span>
              </div>

              <div className="absolute bottom-6 left-6">
                <h1 className="text-3xl lg:text-4xl font-extrabold text-white drop-shadow-md leading-tight">{pg.name}</h1>
              </div>
            </div>

            {/* Gallery Images List */}
            {pgImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {pgImages.slice(1, 5).map((image, index) => {
                  const actualIndex = index + 1;
                  const isLastThumbnail = index === 3;
                  const hasMore = pgImages.length > 5;

                  return (
                    <div 
                      key={image} 
                      onClick={() => setActivePhotoIdx(actualIndex)}
                      className="aspect-[4/3] rounded-lg overflow-hidden border border-border-low bg-surface-container shadow-sm cursor-zoom-in relative group/thumb"
                    >
                      <img
                        src={image}
                        alt={`${pg.name} gallery ${actualIndex + 1}`}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                      />
                      {isLastThumbnail && hasMore && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white select-none backdrop-blur-[2px] transition-all group-hover/thumb:bg-black/70">
                          <span className="font-extrabold text-lg lg:text-xl font-mono">+{pgImages.length - 5}</span>
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-90 mt-0.5">More Photos</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Location & Map Links */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border-low bg-surface-main rounded-xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>{pg.address}, {pg.city}</span>
              </div>
              {pg.google_map_url && (
                <a
                  href={pg.google_map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all text-center whitespace-nowrap cursor-pointer"
                >
                  Open in Google Maps
                </a>
              )}
            </div>

            {/* Living Experience & Amenities */}
            <div className="bg-surface-main p-8 border border-border-low rounded-xl space-y-8">
              <div className="space-y-3">
                <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">The Living Experience</h2>
                <p className="text-text-secondary text-sm lg:text-base leading-relaxed font-medium">{pg.description}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-border-low">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <span className="p-1.5 bg-primary/10 rounded-lg text-primary">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  <span>Premium Amenities</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {pg.amenities?.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-3 rounded-lg border border-border-low bg-surface-container-low text-text-primary font-semibold text-xs uppercase tracking-wider font-mono">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Room Allocations & Payment Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-surface-main border border-border-low p-6 rounded-xl space-y-6 shadow-sm">
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Reserve Room</h3>
              
              {/* Rooms Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Select Available Room</label>
                <div className="space-y-2">
                  {rooms.map((room) => {
                    const soldOut = isRoomSoldOut(room);
                    const isSelected = selectedRoom?.id === room.id;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        disabled={soldOut}
                        onClick={() => {
                          if (soldOut) return toast.error('This room is reserved.');
                          setSelectedRoom(room);
                        }}
                        className={`w-full p-4 rounded-lg border transition-all flex items-center gap-4 text-left ${
                          isSelected 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : soldOut
                              ? 'border-border-low bg-surface-container-low opacity-50 cursor-not-allowed'
                              : 'border-border-low bg-surface-container-low hover:bg-surface-container text-text-primary'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-surface-container border border-border-low">
                          <img 
                            src={room.image_url || MOCKUP_IMAGE} 
                            alt={`Room ${room.room_number}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block font-bold text-sm text-text-primary truncate">Room #{room.room_number}</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-primary font-bold text-xs flex items-center shrink-0">
                              <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                              {room.price_per_seat}
                            </span>
                            <span className="text-[10px] text-text-secondary font-semibold font-mono tracking-wider shrink-0 uppercase">
                              ~ ${toUSD(room.price_per_seat)} USD
                            </span>
                          </div>
                          {soldOut && (
                            <span className="inline-block text-[9px] uppercase font-bold text-error tracking-wider mt-1">Reserved</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Room Details */}
              {selectedRoom && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  
                  {/* Contract duration Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Stay Agreement Duration</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: '6 Months', value: 6 },
                        { label: '1 Year', value: 12 }
                      ].map((duration) => (
                        <button 
                          key={duration.value}
                          onClick={() => setContractDuration(duration.value)}
                          className={`py-2 text-center rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                            contractDuration === duration.value 
                            ? 'bg-primary text-on-primary shadow-sm' 
                            : 'bg-surface-container-low text-text-secondary hover:bg-surface-container border border-border-low'
                          }`}
                        >
                          {duration.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Breakdown Sheet */}
                  <div className="bg-surface-container-low p-4 rounded-lg border border-border-low space-y-3">
                    <div className="flex justify-between text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      <span>Refundable Security Deposit</span>
                      <span className="text-text-primary font-bold">₹{pricing.deposit}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-text-secondary/60 uppercase tracking-widest font-mono font-bold pb-2 border-b border-border-low">
                      <span></span>
                      <span>~ ${toUSD(pricing.deposit)} USD</span>
                    </div>
                    
                    <div className="flex justify-between items-baseline font-bold text-xl pt-2 text-text-primary">
                      <span className="text-sm uppercase tracking-wider text-text-secondary">Security Amount Due</span>
                      <div className="text-right">
                        <span className="text-primary font-extrabold flex items-center text-lg">
                          <IndianRupee className="w-4 h-4" />
                          <span>{pricing.payableNow.toLocaleString()}</span>
                        </span>
                        <span className="block text-[9px] text-text-secondary font-mono tracking-widest uppercase mt-0.5">
                          ~ ${toUSD(pricing.payableNow)} USD
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container border border-border-low rounded-lg flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Secure Residency Token</h4>
                      <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                        KYC uploads will unlock dynamically inside your dashboard portal once verified.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={handleBooking}
                    className="w-full bg-primary text-on-primary py-3 px-4 rounded-lg font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex flex-col items-center justify-center leading-tight cursor-pointer"
                  >
                    <span>Confirm Room Reservation</span>
                    <span className="text-[9px] opacity-75 font-semibold uppercase tracking-widest mt-1">
                      Lock Space Instantly
                    </span>
                  </button>

                </div>
              )}

              {!selectedRoom && (
                <div className="flex flex-col items-center justify-center py-8 text-text-secondary opacity-50 space-y-2 border border-dashed border-border-low rounded-lg bg-surface-container-low">
                  <Info className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Select a room column to start</span>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Premium Lightbox Modal */}
      {activePhotoIdx !== null && pgImages.length > 0 && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col justify-between items-center p-4 animate-in fade-in duration-200 select-none"
          onClick={() => setActivePhotoIdx(null)}
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between max-w-6xl text-white pt-2 z-10" onClick={(e) => e.stopPropagation()}>
            <span className="font-mono text-xs uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              {pg.name} — Image {activePhotoIdx + 1} of {pgImages.length}
            </span>
            <button 
              onClick={() => setActivePhotoIdx(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10 cursor-pointer flex items-center justify-center"
              title="Close Gallery (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Stage */}
          <div className="relative flex-grow w-full max-w-5xl flex items-center justify-center py-4" onClick={(e) => e.stopPropagation()}>
            {/* Prev Button */}
            <button 
              onClick={prevPhoto}
              className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-white border border-white/10 cursor-pointer backdrop-blur-sm"
              title="Previous Image (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Current Image */}
            <div 
              className="relative max-h-[70vh] max-w-full rounded-xl overflow-hidden shadow-2xl border border-white/15 bg-neutral-900 flex items-center justify-center transition-all duration-300"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img 
                src={pgImages[activePhotoIdx]} 
                alt={`${pg.name} view ${activePhotoIdx + 1}`}
                className="max-h-[70vh] max-w-full object-contain pointer-events-none"
              />
            </div>

            {/* Next Button */}
            <button 
              onClick={nextPhoto}
              className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-white border border-white/10 cursor-pointer backdrop-blur-sm"
              title="Next Image (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Thumbnail Strip / Indicator Bar */}
          <div 
            className="w-full max-w-4xl pb-4 overflow-x-auto flex items-center justify-center gap-2.5 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {pgImages.map((image, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhotoIdx(idx)}
                className={`w-14 h-10 rounded-md overflow-hidden border-2 transition-all shrink-0 hover:opacity-100 ${
                  activePhotoIdx === idx 
                    ? 'border-primary opacity-100 scale-105 shadow-md' 
                    : 'border-white/10 opacity-40 hover:scale-102'
                }`}
              >
                <img 
                  src={image} 
                  alt={`Thumbnail ${idx + 1}`} 
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default PGDetail;

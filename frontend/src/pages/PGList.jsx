import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Search, MapPin, IndianRupee, Filter, CheckCircle, Wifi, Coffee, Wind, Globe } from 'lucide-react';

const PGList = () => {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [priceRange, setPriceRange] = useState(25000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [accommodationType, setAccommodationType] = useState('All');

  const AMENITIES_LIST = [
    { id: 'wifi', name: 'High-speed WiFi', icon: Wifi },
    { id: 'meals', name: 'Curated Meals', icon: Coffee },
    { id: 'ac', name: 'Air Conditioning', icon: Wind }
  ];

  const MOCKUP_IMAGE = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80";
  const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];

  const hasActiveBooking = (room) => {
    return room.bookings?.some((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status));
  };

  const isRoomAvailable = (room) => {
    return !hasActiveBooking(room);
  };

  useEffect(() => {
    fetchPGs();
  }, []);

  const fetchPGs = async () => {
    setLoading(true);
    try {
      const [{ data: pgData, error: pgError }, { data: roomData, error: roomError }] = await Promise.all([
        supabase.from('pgs').select('*').eq('is_active', true),
        supabase.from('rooms').select('id, pg_id, price_per_seat')
      ]);

      if (pgError) throw pgError;
      if (roomError) throw roomError;

      const activeRoomStatuses = await Promise.all(
        (roomData || []).map(async (room) => {
          const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .select('id, status')
            .eq('room_id', room.id)
            .in('status', ACTIVE_BOOKING_STATUSES);

          return {
            ...room,
            bookings: bookingError ? [] : (bookingData || [])
          };
        })
      );

      const pgsWithPrice = (pgData || []).map((pg) => {
        const roomsForPg = activeRoomStatuses.filter((room) => room.pg_id === pg.id);
        const availableRooms = roomsForPg.filter(isRoomAvailable);
        const prices = availableRooms.map((room) => Number(room.price_per_seat)) || [];
        const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;

        return {
          ...pg,
          rooms: availableRooms,
          starting_price: startingPrice,
          available_room_count: availableRooms.length
        };
      }).filter((pg) => pg.available_room_count > 0);

      setPgs(pgsWithPrice);
    } catch (error) {
      console.error('Failed to fetch PG list:', error);
      setPgs([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenityName) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityName) 
        ? prev.filter(a => a !== amenityName) 
        : [...prev, amenityName]
    );
  };

  const filteredPGs = pgs.filter(pg => {
    const matchesSearch = pg.city.toLowerCase().includes(searchTerm.toLowerCase()) || pg.address.toLowerCase().includes(searchTerm.toLowerCase()) || pg.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = pg.starting_price <= priceRange;
    // Simple mock amenities filter - assume all PGs have selected if array is empty
    const matchesAmenities = selectedAmenities.length === 0 || selectedAmenities.some(a => pg.amenities?.includes(a));
    
    // Accommodation Type Filter
    const matchesType = accommodationType === 'All' || 
                        pg.accommodation_type === 'Both' || 
                        pg.accommodation_type === accommodationType;

    return matchesSearch && matchesPrice && matchesAmenities && matchesType;
  });

  return (
    <div className="min-h-screen bg-secondary text-primary relative overflow-hidden pt-32 pb-16 px-4 md:px-8">
      {/* Abstract Backgrounds */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#4a4bd7]/10 to-[#842cd3]/10 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/4 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#34b5fa]/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 -z-10"></div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
        
        {/* Sidebar Fillters */}
        <div className="lg:w-1/4 flex flex-col gap-6">
          <div className="glass-morphism p-8 rounded-[2.5rem] sticky top-32 border border-white/40">
            <h2 className="text-2xl font-black mb-6 flex items-center">
              <Filter className="w-5 h-5 mr-3 text-accent" />
              Filters
            </h2>

            <div className="mb-8">
              <label className="text-sm font-bold text-[#615985] uppercase tracking-wider mb-3 block">Location</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a099b4]" />
                <input 
                  type="text" 
                  placeholder="City or PG Name..."
                  className="w-full bg-[#f7f1ff] border-none rounded-[1.5rem] py-4 pl-12 pr-4 text-[#342d55] placeholder:text-[#a099b4] focus:ring-0 shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-8 border-t border-[#e6deff] pt-6 relative">
               <label className="text-sm font-bold text-[#615985] uppercase tracking-wider mb-4 flex justify-between">
                <span>Max Rent</span>
                <span className="text-[#4a4bd7]">₹{priceRange.toLocaleString()}</span>
              </label>
              <input 
                type="range" 
                min="5000" 
                max="50000" 
                step="1000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-2 bg-[#ece4ff] rounded-lg appearance-none cursor-pointer accent-[#4a4bd7]"
              />
            </div>

            <div className="mb-8 border-t border-white/20 pt-6">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 block">Student Category</label>
              <div className="grid grid-cols-2 gap-2">
                {['All', 'Indian', 'International'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setAccommodationType(type)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-black transition-all ${
                      accommodationType === type 
                        ? 'bg-accent text-white shadow-lg shadow-purple-200' 
                        : 'bg-white/50 text-gray-600 hover:bg-white border border-transparent hover:border-gray-100 shadow-sm'
                    }`}
                  >
                    {type === 'All' ? 'Everyone' : type}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#e6deff] pt-6">
              <label className="text-sm font-bold text-[#615985] uppercase tracking-wider mb-4 block">Key Amenities</label>
              <div className="space-y-3">
                {AMENITIES_LIST.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity.name);
                  return (
                    <button 
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.name)}
                      className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all ${
                        isSelected ? 'bg-[#babbff]/20 border border-[#babbff]' : 'bg-[#fdf8ff] hover:bg-[#f7f1ff] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center text-[#342d55] font-semibold text-sm">
                        <amenity.icon className={`w-4 h-4 mr-3 ${isSelected ? 'text-[#4a4bd7]' : 'text-[#a099b4]'}`} />
                        {amenity.name}
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-[#4a4bd7]" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <button 
              onClick={() => { setSearchTerm(''); setPriceRange(50000); setSelectedAmenities([]); setAccommodationType('All'); }}
              className="w-full mt-8 py-4 bg-[#f1ebff] text-[#4a4bd7] rounded-[1.5rem] font-bold text-sm hover:bg-[#ece4ff] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="lg:w-3/4">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight text-[#0f0b20] mb-2">Available Properties</h1>
              <p className="text-[#615985] font-medium text-lg">Showing {filteredPGs.length} curated stays</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-96 bg-[#f1ebff] rounded-[2rem] animate-pulse"></div>
              ))}
            </div>
          ) : filteredPGs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredPGs.map((pg) => (
                <div key={pg.id} className="group relative bg-white/60 backdrop-blur-2xl rounded-[3rem] overflow-hidden shadow-2xl shadow-purple-900/5 border border-white transition-all duration-500 hover:shadow-purple-900/10 hover:-translate-y-2 flex flex-col">
                  {/* Image Area */}
                  <div className="p-4 relative">
                    <div className="h-64 rounded-[2.2rem] overflow-hidden relative">
                       <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10"></div>
                      <img 
                        src={pg.main_image || MOCKUP_IMAGE} 
                        alt={pg.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2">
                        <span className="bg-[#ffffff]/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-[#006592] flex items-center shadow-sm whitespace-nowrap">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                        {pg.accommodation_type && (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center shadow-sm whitespace-nowrap ${
                            pg.accommodation_type === 'International' 
                              ? 'bg-[#34b5fa] text-white' 
                              : pg.accommodation_type === 'Indian'
                              ? 'bg-[#4a4bd7] text-white'
                              : 'bg-gradient-to-r from-[#4a4bd7] to-[#34b5fa] text-white'
                          }`}>
                            <Globe className="w-3 h-3 mr-1" />
                            {pg.accommodation_type === 'Both' ? 'Indian & Int' : pg.accommodation_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-8 pt-4 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#0f0b20] mb-1">{pg.name}</h3>
                        <p className="text-[#615985] flex items-center font-medium">
                          <MapPin className="w-4 h-4 mr-1 text-[#a099b4]" />
                          {pg.address}, {pg.city}
                        </p>
                        {pg.google_map_url && (
                          <a
                            href={pg.google_map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center mt-2 text-[10px] font-black uppercase tracking-widest text-[#4a4bd7] hover:text-[#34b5fa]"
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Open in Maps
                          </a>
                        )}
                      </div>
                      <div className="bg-[#f0dbff] text-[#7614c4] px-4 py-2 rounded-2xl flex flex-col items-end shadow-sm">
                        <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">Starting at</span>
                        <div className="font-extrabold flex items-center text-lg">
                          <IndianRupee className="w-4 h-4 mr-0.5" />
                          {pg.starting_price > 0 ? pg.starting_price : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8 mt-2">
                      {pg.amenities?.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="bg-[#f7f1ff] text-[#4a4bd7] text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border border-[#ece4ff]">
                          {amenity}
                        </span>
                      ))}
                      {pg.amenities?.length > 3 && (
                        <span className="text-[#a099b4] text-xs font-bold px-2 py-1.5 align-middle">
                          +{pg.amenities.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-4 relative">
                      <Link 
                        to={`/pg/${pg.id}`}
                        className="w-full relative z-20 overflow-hidden flex items-center justify-center p-4.5 bg-gradient-to-r from-accent to-accent-light text-white rounded-full font-black text-sm shadow-xl shadow-purple-100 hover:shadow-purple-200 transition-all active:scale-95"
                      >
                        <span className="relative z-10 w-full text-center">View Details</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#ffffff]/80 backdrop-blur-xl rounded-[3rem] p-16 text-center border border-[#ffffff] shadow-[0_20px_40px_rgba(52,45,85,0.03)]">
              <div className="w-24 h-24 bg-[#f1ebff] rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-[#4a4bd7]" />
              </div>
              <h3 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#0f0b20] mb-2">No matches found</h3>
              <p className="text-[#615985] text-lg">Try adjusting your filters or searching for a different location.</p>
              <button 
                onClick={() => { setSearchTerm(''); setPriceRange(50000); setSelectedAmenities([]); setAccommodationType('All'); }}
                className="mt-8 px-8 py-3 bg-[#fdf8ff] border border-[#e6deff] text-[#4a4bd7] rounded-full font-bold hover:bg-[#f1ebff] transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PGList;

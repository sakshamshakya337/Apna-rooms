import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Search, MapPin, Filter, CheckCircle, Wifi, Coffee, Wind, Globe, Shield } from 'lucide-react';
import { slugifyPG } from '../utils/slugify';

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
        
        // Use available rooms first; fallback to all rooms to compute starting price if fully booked
        const roomsToUse = availableRooms.length > 0 ? availableRooms : roomsForPg;
        const prices = roomsToUse.map((room) => Number(room.price_per_seat)) || [];
        const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;

        return {
          ...pg,
          rooms: roomsForPg, // Keep all rooms for reference
          starting_price: startingPrice,
          available_room_count: availableRooms.length
        };
      });

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
    const matchesSearch = pg.city.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pg.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pg.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = pg.starting_price <= priceRange;
    
    // Robust, case-insensitive, synonym-based key amenities matching for backward compatibility
    const matchesAmenities = selectedAmenities.length === 0 || selectedAmenities.every(filterAmenity => {
      const normalizedFilter = filterAmenity.toLowerCase();
      return pg.amenities?.some(pgAmenity => {
        const norm = pgAmenity.toLowerCase();
        if (normalizedFilter.includes('wifi') && norm.includes('wifi')) return true;
        if (normalizedFilter.includes('meals') && (norm.includes('meals') || norm.includes('food') || norm.includes('mess'))) return true;
        if (normalizedFilter.includes('conditioning') && (norm.includes('ac') || norm.includes('air conditioning') || norm.includes('cooling'))) return true;
        return norm === normalizedFilter;
      });
    });
    
    // Accommodation Type Filter
    const matchesType = accommodationType === 'All' || 
                        pg.accommodation_type === 'Both' || 
                        pg.accommodation_type === accommodationType;

    return matchesSearch && matchesPrice && matchesAmenities && matchesType;
  });

  return (
    <div className="min-h-screen bg-background text-on-background py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Available Accommodations</h1>
          <p className="text-text-secondary text-sm lg:text-base mt-1">Showing {filteredPGs.length} curated verified stays</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <div className="w-full lg:w-1/4 shrink-0">
            <div className="bg-surface-main border border-border-low rounded-xl p-5 space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-border-low">
                <h2 className="font-bold text-base text-text-primary flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <span>Filters</span>
                </h2>
                <button 
                  onClick={() => { setSearchTerm(''); setPriceRange(25000); setSelectedAmenities([]); setAccommodationType('All'); }}
                  className="text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                >
                  Clear All
                </button>
              </div>

              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Location Search</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search city, area or PG name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 px-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Max Price Range */}
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  <span>Max Monthly Rent</span>
                  <span className="text-primary font-mono">₹{priceRange.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="5000" 
                  max="40000" 
                  step="1000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Student Category Classification */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Student Classification</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['All', 'Indian', 'International'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setAccommodationType(type)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                        accommodationType === type 
                          ? 'bg-primary text-on-primary shadow-sm' 
                          : 'bg-surface-container-low text-text-secondary hover:bg-surface-container border border-border-low'
                      }`}
                    >
                      {type === 'All' ? 'Both' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Amenities */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Key Amenities</label>
                <div className="space-y-2">
                  {AMENITIES_LIST.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity.name);
                    return (
                      <button 
                        key={amenity.id}
                        onClick={() => toggleAmenity(amenity.name)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                          isSelected 
                            ? 'border-primary bg-primary/5 text-text-primary' 
                            : 'border-border-low bg-surface-container-low hover:bg-surface-container text-text-secondary'
                        }`}
                      >
                        <span className="flex items-center text-xs font-semibold gap-2">
                          <amenity.icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-outline'}`} />
                          <span>{amenity.name}</span>
                        </span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Listings Area */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 4].map(idx => (
                  <div key={idx} className="h-80 bg-surface-container animate-pulse rounded-xl border border-border-low"></div>
                ))}
              </div>
            ) : filteredPGs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPGs.map((pg) => (
                  <div 
                    key={pg.id} 
                    className="bg-surface-main border border-border-low rounded-xl overflow-hidden hover:border-outline transition-all duration-300 flex flex-col group"
                  >
                    <div className="h-48 relative overflow-hidden bg-surface-container">
                      <img 
                        src={pg.main_image || MOCKUP_IMAGE} 
                        alt={pg.name} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
                        {pg.available_room_count > 0 ? (
                          <span className="bg-success/15 text-success text-[10px] font-bold tracking-wider rounded border border-success/35 px-2 py-0.5">
                            AVAILABLE ({pg.available_room_count} ROOMS)
                          </span>
                        ) : (
                          <span className="bg-error/15 text-error text-[10px] font-bold tracking-wider rounded border border-error/35 px-2 py-0.5 animate-pulse">
                            SOLD OUT
                          </span>
                        )}
                        {pg.accommodation_type && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-primary/20 ${
                            pg.accommodation_type === 'International' 
                              ? 'bg-primary/20 text-primary' 
                              : pg.accommodation_type === 'Indian'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-primary/15 text-primary'
                          }`}>
                            <Globe className="w-3 h-3 shrink-0" />
                            <span>{pg.accommodation_type === 'Both' ? 'Indian & Int' : pg.accommodation_type}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors">{pg.name}</h3>
                        <p className="text-text-secondary text-xs flex items-center gap-1 mt-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-outline" />
                          <span>{pg.address}, {pg.city}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {pg.amenities?.slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className="bg-surface-container-low text-text-secondary text-[10px] px-2 py-1 rounded border border-border-low uppercase font-mono tracking-wider">
                            {amenity}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 border-t border-border-low pt-4 text-center items-center">
                        <div className="data-grid-divider">
                          <span className="block text-[9px] font-semibold text-text-secondary uppercase tracking-wider font-mono">Rent starting</span>
                          <span className="block font-bold text-text-primary mt-1 text-sm">₹{pg.starting_price.toLocaleString()}</span>
                        </div>
                        <div className="data-grid-divider">
                          <span className="block text-[9px] font-semibold text-text-secondary uppercase tracking-wider font-mono">Deposit</span>
                          <span className="block font-bold text-text-primary mt-1 text-sm">2 MO</span>
                        </div>
                        <div>
                          <Link 
                            to={`/pg/${slugifyPG(pg.name, pg.address, pg.city)}--${pg.id}`}
                            className="inline-block px-3 py-2 bg-primary text-on-primary font-bold text-xs rounded-lg hover:opacity-90 active:scale-95 transition-all text-center w-full"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-main border border-border-low rounded-xl p-16 text-center shadow-sm">
                <Search className="w-10 h-10 text-outline mx-auto mb-4" />
                <h3 className="text-xl font-bold text-text-primary mb-1">No stay fits the search criteria</h3>
                <p className="text-text-secondary text-sm">Try relaxing your sidebar filter tags or searching a broader city area.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default PGList;

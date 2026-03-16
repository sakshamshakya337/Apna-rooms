import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Search, MapPin, IndianRupee, Filter } from 'lucide-react';

const PGList = () => {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const MOCKUP_IMAGE = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80";

  useEffect(() => {
    fetchPGs();
  }, []);

  const fetchPGs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pgs')
      .select('*, rooms (price_per_seat)')
      .eq('is_active', true);
    
    if (data) {
      const pgsWithPrice = data.map(pg => {
        const prices = pg.rooms?.map(r => Number(r.price_per_seat)) || [];
        const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;
        return { ...pg, starting_price: startingPrice };
      });
      setPgs(pgsWithPrice);
    }
    setLoading(false);
  };

  const filteredPGs = pgs.filter(pg => 
    pg.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pg.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center text-xl">Loading PGs...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-12">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by city or area..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          <span>Filters</span>
        </button>
      </div>

      {/* PG Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPGs.map((pg) => (
          <Link 
            key={pg.id} 
            to={`/pg/${pg.id}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100"
          >
            <div className="h-64 relative">
              <img 
                src={pg.main_image || MOCKUP_IMAGE} 
                alt={pg.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-bold shadow-md flex items-center">
                <IndianRupee className="w-3 h-3 mr-1" />
                {pg.starting_price > 0 ? `${pg.starting_price}/mo` : 'Price on request'}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-primary mb-2">{pg.name}</h3>
              <div className="flex items-center text-gray-500 mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{pg.address}, {pg.city}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pg.amenities?.slice(0, 3).map((amenity, idx) => (
                  <span key={idx} className="bg-blue-50 text-accent text-xs px-2 py-1 rounded-md font-medium">
                    {amenity}
                  </span>
                ))}
                {pg.amenities?.length > 3 && (
                  <span className="text-gray-400 text-xs px-2 py-1">+{pg.amenities.length - 3} more</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredPGs.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No PGs found matching your search.
        </div>
      )}
    </div>
  );
};

export default PGList;

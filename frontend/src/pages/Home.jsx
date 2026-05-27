import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { MapPin, Search, Shield, Star, DollarSign, Users, Award, Zap, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { slugifyPG } from '../utils/slugify';

const Home = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Search Form State
  const [location, setLocation] = useState('');
  const [budgetRange, setBudgetRange] = useState('All');
  const [pgType, setPgType] = useState('All');

  // PG listings state
  const [featuredPgs, setFeaturedPgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedPgs();
  }, []);

  const fetchFeaturedPgs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pgs')
        .select('*, rooms (price_per_seat, total_seats)')
        .eq('is_active', true)
        .limit(3);
        
      if (data) {
        const pgsWithPrice = data.map(pg => {
          const prices = pg.rooms?.map(r => Number(r.price_per_seat)) || [];
          const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;
          return { ...pg, starting_price: startingPrice };
        });
        setFeaturedPgs(pgsWithPrice);
      }
    } catch (err) {
      console.error('Error fetching featured PGs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    let queryParams = [];
    if (location.trim()) queryParams.push(`search=${encodeURIComponent(location.trim())}`);
    if (budgetRange !== 'All') queryParams.push(`budget=${encodeURIComponent(budgetRange)}`);
    if (pgType !== 'All') queryParams.push(`type=${encodeURIComponent(pgType)}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    navigate(`/pgs${queryString}`);
  };

  const MOCKUP_IMAGE = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80";

  return (
    <div className="bg-background text-on-background min-h-screen transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="bg-surface-main py-12 lg:py-20 border-b border-border-low">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold tracking-wider">
                <span className="flex w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span>SYSTEMATIC COLIVING PLATFORM</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-extrabold text-text-primary tracking-tight leading-tight">
                Professional PG Rentals for Modern Professionals.
              </h1>
              
              <p className="text-text-secondary text-base lg:text-lg max-w-xl leading-relaxed">
                Streamlined living spaces curated for efficiency. High-density urban locations with verified amenities and transparent billing.
              </p>

              {/* High-Density Responsive Search Deck */}
              <form onSubmit={handleSearchSubmit} className="bg-surface-container-low border border-border-low p-4 rounded-2xl shadow-xl space-y-3 max-w-xl">
                {/* Location Search Row */}
                <div className="flex items-center px-4 bg-surface-main border border-border-low rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                  <MapPin className="w-5 h-5 text-primary mr-3 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search location (e.g. Noida, Sector 62)" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border-none focus:outline-none focus:ring-0 text-sm bg-transparent py-3.5 text-on-background placeholder:text-text-secondary/50 font-semibold"
                  />
                </div>
                
                {/* Filters & Action Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center px-4 bg-surface-main border border-border-low rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <span className="text-sm font-bold text-primary mr-2.5 font-mono">₹</span>
                    <select 
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full border-none focus:outline-none focus:ring-0 text-xs sm:text-sm bg-transparent py-3 text-on-background cursor-pointer font-semibold pr-8"
                    >
                      <option value="All" className="bg-surface-main">Budget Range</option>
                      <option value="5000-10000" className="bg-surface-main">₹5,000 - ₹10,000</option>
                      <option value="10000-20000" className="bg-surface-main">₹10,000 - ₹20,000</option>
                      <option value="20000+" className="bg-surface-main">₹20,000+</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center px-4 bg-surface-main border border-border-low rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <Users className="w-4.5 h-4.5 text-primary mr-2.5 shrink-0" />
                    <select 
                      value={pgType}
                      onChange={(e) => setPgType(e.target.value)}
                      className="w-full border-none focus:outline-none focus:ring-0 text-xs sm:text-sm bg-transparent py-3 text-on-background cursor-pointer font-semibold pr-8"
                    >
                      <option value="All" className="bg-surface-main">Room Type</option>
                      <option value="Single" className="bg-surface-main">Single Room</option>
                      <option value="Double" className="bg-surface-main">Double Sharing</option>
                      <option value="Triple" className="bg-surface-main">Triple Sharing</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    className="bg-primary text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-md shadow-primary/10 text-sm"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Rooms</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Interactive Image Mockup */}
            <div className="hidden lg:block relative aspect-video overflow-hidden rounded-xl border border-border-low shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80"
                alt="Professional Apna Rooms Interior Mockup" 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none"></div>
            </div>

          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 border border-border-low bg-surface-main rounded-xl">
            <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono">Market Occupancy</span>
            <span className="block text-2xl lg:text-3xl font-bold text-primary mt-1">94.2%</span>
          </div>
          <div className="p-5 border border-border-low bg-surface-main rounded-xl">
            <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono">Verified Listings</span>
            <span className="block text-2xl lg:text-3xl font-bold text-primary mt-1">1,240+</span>
          </div>
          <div className="p-5 border border-border-low bg-surface-main rounded-xl">
            <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono">Active Users</span>
            <span className="block text-2xl lg:text-3xl font-bold text-primary mt-1">12.5k</span>
          </div>
          <div className="p-5 border border-border-low bg-surface-main rounded-xl">
            <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono">Avg. Guest Rating</span>
            <span className="block text-2xl lg:text-3xl font-bold text-success mt-1">4.8/5.0</span>
          </div>
        </div>
      </section>

      {/* Featured PGs Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-text-primary">Featured PGs</h2>
            <p className="text-text-secondary text-sm lg:text-base mt-1">Highly-rated student accommodations near top major colleges and tech hubs.</p>
          </div>
          <Link 
            to="/pgs" 
            className="text-primary font-semibold text-sm hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View all listings</span>
            <span className="font-mono">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-80 bg-surface-container animate-pulse rounded-xl border border-border-low"></div>
            ))}
          </div>
        ) : featuredPgs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPgs.map((pg) => {
              const roomsForPg = pg.rooms || [];
              const hasSingle = roomsForPg.some(r => Number(r.total_seats) === 1);
              const roomTypeStr = hasSingle ? 'SINGLE' : roomsForPg.length > 0 ? 'SHARING' : 'STUDIO';
              
              return (
                <Link 
                  key={pg.id} 
                  to={`/pg/${slugifyPG(pg.name, pg.address, pg.city)}--${pg.id}`}
                  className="bg-surface-main border border-border-low rounded-xl overflow-hidden hover:border-outline transition-all duration-300 flex flex-col group"
                >
                  <div className="h-48 relative overflow-hidden bg-surface-container">
                    <img 
                      src={pg.main_image || MOCKUP_IMAGE} 
                      alt={pg.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-success/15 text-success text-[10px] font-bold tracking-wider rounded border border-success/35">
                      AVAILABLE
                    </div>
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors">{pg.name}</h3>
                      <p className="text-text-secondary text-xs flex items-center gap-1 mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-outline" />
                        <span>{pg.address}, {pg.city}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 border-t border-border-low mt-5 pt-4 text-center">
                      <div className="data-grid-divider">
                        <span className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider font-mono">Rent</span>
                        <span className="block font-bold text-text-primary mt-1 text-sm">₹{pg.starting_price.toLocaleString()}</span>
                      </div>
                      <div className="data-grid-divider">
                        <span className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider font-mono">Deposit</span>
                        <span className="block font-bold text-text-primary mt-1 text-sm">2 MO</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider font-mono">Type</span>
                        <span className="block font-bold text-text-primary mt-1 text-sm font-mono">{roomTypeStr}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-surface-main border border-border-low rounded-xl">
            <span className="text-text-secondary font-semibold">More verified stay listings coming up shortly!</span>
          </div>
        )}
      </section>

      {/* Systematic Living Experience Section */}
      <section className="bg-surface-subtle py-16 border-y border-border-low">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-text-primary">Systematic Living Experience</h2>
            <p className="text-text-secondary text-sm lg:text-base mt-2">Our platform is engineered for clarity, safety, and reliability.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-main p-6 border border-border-low rounded-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-text-primary mb-2">Verified Listings</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Every single room is physically verified by our audit team to guarantee the absolute highest standards of listing data integrity.
                </p>
              </div>
            </div>
            
            <div className="bg-surface-main p-6 border border-border-low rounded-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-text-primary mb-2">Transparent Billing</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Zero hidden charges. Effortlessly manage your monthly rent, security deposits, and real-time electricity bills in one place.
                </p>
              </div>
            </div>
            
            <div className="bg-surface-main p-6 border border-border-low rounded-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-text-primary mb-2">24/7 SLA Management</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Dedicated property facility managers available to resolve maintenance, HVAC, electrical, or plumbing requests within a 4-hour SLA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary to-primary-container text-on-primary py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight">Ready to Elevate Your Living Experience?</h2>
          <p className="text-primary-fixed-dim/95 text-base lg:text-lg max-w-xl mx-auto">
            Join thousands of modern students and working professionals who have already upgraded their coliving journey with Apna Rooms.
          </p>
          <Link 
            to="/pgs" 
            className="inline-block py-4.5 px-8 bg-surface-main text-primary rounded-lg font-bold text-lg hover:shadow-lg transition-all active:scale-95 duration-200 cursor-pointer"
          >
            Find Your Room Now
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;

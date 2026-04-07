import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Shield, Star, Zap, IndianRupee, ChevronRight, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../config/supabase';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredPgs, setFeaturedPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedPgs();
  }, []);

  const fetchFeaturedPgs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pgs')
        .select('*, rooms (price_per_seat)')
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pgs?search=${encodeURIComponent(searchQuery)}`);
    } else {
        navigate('/pgs');
    }
  };

  const MOCKUP_IMAGE = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80";

  return (
    <div className="bg-[#fdf8ff] min-h-screen font-['Manrope'] text-[#342d55] overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-24 md:pt-48 md:pb-32 flex flex-col items-center justify-center min-h-[90vh]">
        {/* Abstract Background Ethereal Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#4a4bd7]/20 to-[#842cd3]/20 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#34b5fa]/20 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#ffffff]/60 backdrop-blur-xl rounded-full border border-[#e6deff] shadow-[0_20px_40px_rgba(52,45,85,0.06)] text-sm font-bold text-[#4a4bd7] mb-4">
            <span className="flex w-2 h-2 rounded-full bg-[#4a4bd7] animate-pulse"></span>
            <span>Welcome to The Ethereal Academic Living</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight leading-[1.1] text-[#0f0b20]">
            Find Your Perfect Stay with <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4a4bd7] to-[#842cd3]">Apna Rooms</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#615985] max-w-2xl mx-auto font-medium leading-relaxed">
            Experience premium living spaces built for students. Secure, verified, and beautifully curated to elevate your academic journey.
          </p>

          <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto mt-12 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#4a4bd7] to-[#842cd3] rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-[#ffffff] p-2 rounded-[2rem] shadow-[0_20px_40px_rgba(52,45,85,0.08)] border border-[#f1ebff]">
              <div className="p-4 bg-[#f7f1ff] rounded-[1.5rem] text-[#4a4bd7]">
                <MapPin className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                placeholder="Search by city, university, or PG name..." 
                className="flex-1 bg-transparent border-none text-lg px-6 text-[#342d55] placeholder:text-[#a099b4] focus:outline-none focus:ring-0 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="hidden md:flex px-8 py-5 bg-gradient-to-r from-[#4a4bd7] to-[#842cd3] text-white rounded-[1.5rem] font-bold text-lg hover:shadow-[0_10px_20px_rgba(74,75,215,0.3)] transition-all hover:-translate-y-0.5">
                Explore Rooms
              </button>
              <button type="submit" className="md:hidden p-4 bg-gradient-to-r from-[#4a4bd7] to-[#842cd3] text-white rounded-[1.5rem]">
                <Search className="w-6 h-6" />
              </button>
            </div>
          </form>
          
          <div className="flex items-center justify-center space-x-6 pt-8 text-sm font-bold text-[#7d75a2]">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-[#006592]" />
              <span>Verified Properties</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#006592]" />
              <span>Zero Brokerage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Glassmorphism */}
      <section className="relative py-24 px-6 z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-['Plus_Jakarta_Sans'] font-extrabold mb-6 tracking-tight">The New Standard of Living</h2>
            <p className="text-[#615985] text-lg max-w-2xl mx-auto">Everything you need to focus on your studies, wrapped in a seamless digital experience.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#ffffff]/80 backdrop-blur-3xl p-10 rounded-[2rem] shadow-[0_20px_40px_rgba(52,45,85,0.06)] border border-[#ffffff] relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#e7c9ff] rounded-bl-full opacity-20 transition-transform group-hover:scale-110"></div>
              <div className="w-16 h-16 bg-[#f0dbff] rounded-2xl flex items-center justify-center mb-8 rotate-3 shadow-sm">
                <Shield className="w-8 h-8 text-[#7614c4]" />
              </div>
              <h3 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] mb-4">Secure & Verified</h3>
              <p className="text-[#615985] leading-relaxed">Complete peace of mind. Every property undergoes rigorous background checks and quality assurance before listing.</p>
            </div>
            
            <div className="bg-[#ffffff]/80 backdrop-blur-3xl p-10 rounded-[2rem] shadow-[0_20px_40px_rgba(52,45,85,0.06)] border border-[#ffffff] relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#34b5fa] rounded-bl-full opacity-10 transition-transform group-hover:scale-110"></div>
              <div className="w-16 h-16 bg-[#f5f9ff] rounded-2xl flex items-center justify-center mb-8 -rotate-3 shadow-sm">
                <Star className="w-8 h-8 text-[#006592]" />
              </div>
              <h3 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] mb-4">Premium Amenities</h3>
              <p className="text-[#615985] leading-relaxed">From blazing-fast WiFi to nutritious curated meals and professional housekeeping, we handle the chores.</p>
            </div>
            
            <div className="bg-[#ffffff]/80 backdrop-blur-3xl p-10 rounded-[2rem] shadow-[0_20px_40px_rgba(52,45,85,0.06)] border border-[#ffffff] relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#babbff] rounded-bl-full opacity-20 transition-transform group-hover:scale-110"></div>
              <div className="w-16 h-16 bg-[#fdf8ff] border border-[#e6deff] rounded-2xl flex items-center justify-center mb-8 rotate-3 shadow-sm">
                <Zap className="w-8 h-8 text-[#4a4bd7]" />
              </div>
              <h3 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] mb-4">Seamless Experience</h3>
              <p className="text-[#615985] leading-relaxed">Book a room, pay rent securely, and raise service requests entirely through our digital ecosystem.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured PGs Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-[#ffffff] h-1/2 skew-y-3 origin-bottom-left -z-10"></div>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-['Plus_Jakarta_Sans'] font-extrabold mb-4 tracking-tight">Featured Stays</h2>
              <p className="text-[#615985] text-lg">Handpicked premium accommodations ready for you to move in.</p>
            </div>
            <Link to="/pgs" className="inline-flex items-center px-6 py-3 bg-[#f1ebff] text-[#4a4bd7] rounded-full font-bold hover:bg-[#ece4ff] transition-colors group">
              View All Properties
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-[#f1ebff] rounded-[2rem] animate-pulse"></div>
              ))}
            </div>
          ) : featuredPgs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPgs.map((pg) => (
                <Link 
                  key={pg.id} 
                  to={`/pg/${pg.id}`}
                  className="group bg-[#ffffff] rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_rgba(52,45,85,0.04)] hover:shadow-[0_40px_80px_rgba(74,75,215,0.12)] transition-all duration-500 border border-[#fdf8ff] flex flex-col hover:-translate-y-2 relative"
                >
                  <div className="h-72 relative overflow-hidden m-3 rounded-[2rem]">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
                    <img 
                      src={pg.main_image || MOCKUP_IMAGE} 
                      alt={pg.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-4 right-4 z-20 bg-[#ffffff]/90 backdrop-blur-md px-4 py-2 rounded-full text-sm font-extrabold text-[#342d55] shadow-lg flex items-center">
                      <IndianRupee className="w-4 h-4 mr-1 text-[#4a4bd7]" />
                      {pg.starting_price > 0 ? `${pg.starting_price}/mo` : 'Price on request'}
                    </div>
                  </div>
                  
                  <div className="p-8 pt-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#0f0b20] mb-3 group-hover:text-[#4a4bd7] transition-colors">{pg.name}</h3>
                      <div className="flex items-center text-[#a099b4] mb-6">
                        <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span className="font-medium">{pg.address}, {pg.city}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                       {pg.amenities?.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="bg-[#fdf8ff] border border-[#e6deff] text-[#615985] text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                          {amenity}
                        </span>
                      ))}
                      {pg.amenities?.length > 3 && (
                        <span className="bg-[#fdf8ff] text-[#a099b4] text-xs px-3 py-1.5 rounded-full font-bold">+{pg.amenities.length - 3}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#ffffff] rounded-[3rem] border border-[#f1ebff] shadow-sm">
              <p className="text-[#a099b4] text-lg font-bold">More spectacular properties coming soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4a4bd7] to-[#842cd3]"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#ffffff] opacity-10 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
          <h2 className="text-4xl md:text-6xl font-['Plus_Jakarta_Sans'] font-extrabold mb-8 tracking-tight text-shadow-sm">Ready to elevate your stay?</h2>
          <p className="text-[#f0dbff] text-xl mb-12 font-medium max-w-2xl mx-auto leading-relaxed">
            Join thousands of students who have already upgraded their living experience with Apna Rooms.
          </p>
          <Link to="/pgs" className="inline-flex py-5 px-10 bg-[#ffffff] text-[#4a4bd7] rounded-full font-extrabold text-xl hover:shadow-[0_20px_40px_rgba(255,255,255,0.2)] hover:-translate-y-1 transition-all">
            Find Your Room Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

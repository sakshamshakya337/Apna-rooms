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
    <div className="bg-secondary min-h-screen text-primary overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-24 md:pt-48 md:pb-32 flex flex-col items-center justify-center min-h-[90vh]">
        {/* Abstract Background Ethereal Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#4a4bd7]/20 to-[#842cd3]/20 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#34b5fa]/20 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-6 py-2.5 bg-white/60 backdrop-blur-2xl rounded-full border border-white/40 shadow-xl text-sm font-bold text-accent mb-4">
            <span className="flex w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></span>
            <span className="tracking-wide">Experience Premium Student Living</span>
          </div>
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <img 
              src="/apna_light.jpg" 
              alt="Apna Rooms Logo" 
              className="h-20 w-20 object-contain rounded-[2rem] shadow-2xl border border-white/20 animate-float"
            />
            <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.95] text-primary">
              Stay in <br className="hidden md:block"/>
              <span className="text-gradient">Apna Rooms</span>
            </h1>
          </div>
          
          <p className="text-lg md:text-xl text-[#615985] max-w-2xl mx-auto font-medium leading-relaxed">
            Experience premium living spaces built for students. Secure, verified, and beautifully curated to elevate your academic journey.
          </p>

          <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto mt-16 relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-accent to-accent-light rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative flex items-center bg-white p-2.5 rounded-[2.5rem] shadow-2xl border border-white/50">
              <div className="p-4 bg-accent/10 rounded-[1.8rem] text-accent">
                <MapPin className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                placeholder="Search by city, university, or PG name..." 
                className="flex-1 bg-transparent border-none text-lg px-6 text-[#342d55] placeholder:text-[#a099b4] focus:outline-none focus:ring-0 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="hidden md:flex px-10 py-5 bg-gradient-to-r from-accent to-accent-light text-white rounded-[1.8rem] font-black text-lg hover:shadow-2xl hover:shadow-purple-400/30 transition-all hover:-translate-y-1">
                Explore Rooms
              </button>
              <button type="submit" className="md:hidden p-5 bg-accent text-white rounded-[1.8rem]">
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
            <div className="glass-morphism p-10 rounded-[2.5rem] relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-5 transition-transform group-hover:scale-110"></div>
              <div className="w-16 h-16 bg-accent/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-lg shadow-purple-200">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Secure & Verified</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Complete peace of mind. Every property undergoes rigorous background checks and quality assurance before listing.</p>
            </div>
            
            <div className="glass-morphism p-10 rounded-[2.5rem] relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
               <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-5 transition-transform group-hover:scale-110"></div>
              <div className="w-16 h-16 bg-accent/10 rounded-3xl flex items-center justify-center mb-8 -rotate-3 shadow-lg shadow-purple-200">
                <Star className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Premium Living</h3>
              <p className="text-gray-500 leading-relaxed text-sm">From blazing-fast WiFi to nutritious curated meals and professional housekeeping, we handle everything.</p>
            </div>
            
            <div className="glass-morphism p-10 rounded-[2.5rem] relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
               <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-5 transition-transform group-hover:scale-110"></div>
              <div className="w-16 h-16 bg-accent/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-lg shadow-purple-200">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Seamless Tech</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Book a room, pay rent securely, and raise service requests entirely through our digital ecosystem.</p>
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
            <Link to="/pgs" className="inline-flex items-center px-8 py-3.5 bg-accent/10 text-accent rounded-full font-black text-sm hover:bg-accent hover:text-white transition-all group">
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
                  className="group bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-900/5 hover:shadow-purple-900/10 transition-all duration-500 border border-white flex flex-col hover:-translate-y-2 relative"
                >
                  <div className="h-72 relative overflow-hidden m-4 rounded-[2rem]">
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

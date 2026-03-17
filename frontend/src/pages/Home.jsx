import React from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Shield, Star, Zap, IndianRupee, ChevronRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../config/supabase';

const Home = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [featuredPgs, setFeaturedPgs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchFeaturedPgs();
  }, []);

  const fetchFeaturedPgs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pgs')
        .select('*, rooms (price_per_seat)')
        .eq('is_active', true)
        .limit(3); // Fetch top 3 PGs
        
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
      window.location.href = `/pgs?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const MOCKUP_IMAGE = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80";

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hero-content relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
            Find Your Perfect Stay with <span className="text-accent">Apna Rooms</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience modern living with all amenities. Book a single seat or a complete room in the best PGs across the city.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
            <Link 
              to="/pgs" 
              className="bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center space-x-2 w-full sm:w-auto justify-center shadow-lg"
            >
              <Search className="w-5 h-5" />
              <span>Explore PGs</span>
            </Link>
            <Link 
              to="/contact" 
              className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all w-full sm:w-auto text-center shadow-lg"
            >
              List Your Property
            </Link>
          </div>

          {/* Quick Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl flex items-center">
            <div className="flex-grow flex items-center pl-4">
              <MapPin className="text-gray-400 w-5 h-5 mr-2" />
              <input 
                type="text"
                placeholder="Search by city, area, or PG name..."
                className="w-full py-3 text-gray-800 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-opacity-90 transition-all"
            >
              Search
            </button>
          </form>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Why Choose Apna Rooms?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-4">Secure & Verified</h3>
              <p className="text-gray-600">All properties and roommates are verified for your safety and peace of mind.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Premium Amenities</h3>
              <p className="text-gray-600">High-speed WiFi, nutritious meals, laundry, and 24/7 security services.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Easy Payments</h3>
              <p className="text-gray-600">Integrated online payments for rent and electricity bills with instant receipts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured PGs Section */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-2">Featured Accommodations</h2>
              <p className="text-gray-600">Handpicked premium stays just for you.</p>
            </div>
            <Link to="/pgs" className="hidden sm:flex items-center text-accent font-semibold hover:underline">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : featuredPgs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPgs.map((pg) => (
                <Link 
                  key={pg.id} 
                  to={`/pg/${pg.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full"
                >
                  <div className="h-64 relative overflow-hidden">
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
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-primary mb-2 line-clamp-1">{pg.name}</h3>
                      <div className="flex items-center text-gray-500 mb-4">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="text-sm truncate">{pg.address}, {pg.city}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {pg.amenities?.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="bg-blue-50 text-accent text-xs px-2 py-1 rounded-md font-medium">
                          {amenity}
                        </span>
                      ))}
                      {pg.amenities?.length > 3 && (
                        <span className="text-gray-400 text-xs px-2 py-1">+{pg.amenities.length - 3}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500">More amazing PGs coming soon!</p>
            </div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
            <Link to="/pgs" className="inline-flex items-center justify-center bg-gray-100 text-primary px-6 py-3 rounded-xl font-semibold w-full">
              View All Properties
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">Book your perfect room in just three simple steps. No hidden fees, no complicated processes.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
            
            <div className="flex flex-col items-center text-center relative bg-white">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-6 relative">
                <Search className="w-10 h-10 text-accent" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">1</div>
              </div>
              <h3 className="text-xl font-bold mb-3">Search & Filter</h3>
              <p className="text-gray-600">Browse through hundreds of verified PGs. Filter by location, price, and amenities.</p>
            </div>
            
            <div className="flex flex-col items-center text-center relative bg-white">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-6 relative">
                <MapPin className="w-10 h-10 text-accent" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">2</div>
              </div>
              <h3 className="text-xl font-bold mb-3">Select & Review</h3>
              <p className="text-gray-600">Check photos, read rules, and select the room that perfectly matches your lifestyle.</p>
            </div>
            
            <div className="flex flex-col items-center text-center relative bg-white">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-6 relative">
                <CheckCircle className="w-10 h-10 text-accent" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">3</div>
              </div>
              <h3 className="text-xl font-bold mb-3">Book securely</h3>
              <p className="text-gray-600">Pay securely online and get instant confirmation. Your new home awaits!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-primary text-white px-4 relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent opacity-10 rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-3xl font-bold text-center mb-16">What Our Residents Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <div className="flex text-yellow-400 mb-4">
                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="italic text-gray-200 mb-6">"Finding a good PG in a new city was scary, but Apna Rooms made it incredibly easy. The interface is smooth and the property is exactly as shown in pictures."</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 overflow-hidden border-2 border-white">
                  <img src="https://i.pravatar.cc/150?img=32" alt="User" />
                </div>
                <div>
                  <h4 className="font-bold">Priya Sharma</h4>
                  <p className="text-sm text-gray-300">Software Engineer</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <div className="flex text-yellow-400 mb-4">
                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="italic text-gray-200 mb-6">"The rent payment via the dashboard is a lifesaver. No more chasing owners for receipts or arguing over electricity bills. Everything is transparent."</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 overflow-hidden border-2 border-white">
                  <img src="https://i.pravatar.cc/150?img=11" alt="User" />
                </div>
                <div>
                  <h4 className="font-bold">Rahul Verma</h4>
                  <p className="text-sm text-gray-300">University Student</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <div className="flex text-yellow-400 mb-4">
                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="italic text-gray-200 mb-6">"I appreciate the verified properties feature. As a parent looking for accommodation for my daughter, safety was my priority. Apna Rooms delivered."</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 overflow-hidden border-2 border-white">
                  <img src="https://i.pravatar.cc/150?img=44" alt="User" />
                </div>
                <div>
                  <h4 className="font-bold">Anita Desai</h4>
                  <p className="text-sm text-gray-300">Parent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

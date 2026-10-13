import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Camera, Laptop, Armchair, Calculator, Hammer, Book, Activity, Home as HomeIcon, Package, MapPin, ShieldCheck, RefreshCw, IndianRupee } from 'lucide-react';
import { CITIES, CATEGORIES, API_URL } from '../constants';

const ICONS = {
  'Cameras': Camera,
  'Electronics': Laptop,
  'Furniture': Armchair,
  'Calculators': Calculator,
  'Tools': Hammer,
  'Books': Book,
  'Sports': Activity,
  'Household': HomeIcon
};

const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [recentItems, setRecentItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/items?limit=8`)
      .then(res => setRecentItems(res.data.items || []))
      .catch(err => console.error(err))
      .finally(() => setLoadingItems(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (selectedCity) params.set('area', selectedCity);
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Banner */}
      <div className="w-full bg-gradient-to-r from-brand via-brand/95 to-emerald-900 text-white py-20 px-4 text-center">
        <span className="bg-white/15 text-white/95 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-sm inline-block mb-4">
          🌱 Peer-to-Peer Neighborhood Sharing
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
          Borrow more. <span className="text-emerald-300">Buy less.</span>
        </h1>
        <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
          Rent power tools, cameras, camping gear, and gadgets directly from verified neighbors in Indore, Ujjain, and Dewas.
        </p>
        
        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto bg-white rounded-full p-2 flex shadow-2xl text-gray-800 border border-white/20">
          <select 
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="bg-transparent pl-4 pr-2 outline-none border-r border-gray-200 text-sm font-medium text-gray-700 cursor-pointer"
          >
            <option value="">All Cities</option>
            {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
          <input 
            type="text" 
            placeholder="Search camera, impact drill, calculator, tent..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 px-4 outline-none text-sm font-medium placeholder-gray-400" 
          />
          <button 
            type="submit" 
            className="bg-brand text-white px-7 py-3 rounded-full font-bold hover:bg-brand/90 transition flex items-center gap-2 shadow-sm text-sm"
          >
            <Search className="h-4 w-4" /> Search
          </button>
        </form>
      </div>

      {/* Featured Items Grid on Homepage */}
      <div className="max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Featured in Your Neighborhood</h2>
            <p className="text-sm text-gray-500 mt-1">Ready for pickup today across MP</p>
          </div>
          <Link to="/explore" className="text-brand font-bold text-sm hover:underline flex items-center gap-1">
            Browse all items &rarr;
          </Link>
        </div>

        {loadingItems ? (
          <div className="text-center py-12 text-gray-400">Loading popular items...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recentItems.slice(0, 8).map(item => (
              <Link 
                to={`/items/${item._id}`} 
                key={item._id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
              >
                <div className="h-48 overflow-hidden bg-gray-100 relative">
                  <img 
                    src={item.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                    {item.category}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand" /> 📍 {item.pickupLocation || `${item.area} (Pickup)`}
                  </div>
                  <h3 className="font-extrabold text-base text-gray-900 group-hover:text-brand transition mb-2 line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50">
                    <div>
                      <span className="text-xl font-black text-brand">₹{item.feePerDay}</span>
                      <span className="text-xs font-medium text-gray-400"> / day</span>
                    </div>
                    <span className="bg-brand text-white px-3.5 py-1.5 rounded-xl text-xs font-black group-hover:bg-brand/90 transition shadow-sm">
                      Borrow Now &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Popular Categories Strip */}
      <div className="w-full bg-gray-50 py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Explore by Category</h2>
            <p className="text-sm text-gray-500 mt-1">From DSLR cameras to scientific calculators</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4">
            {CATEGORIES.map(cat => {
              const Icon = ICONS[cat] || Package;
              return (
                <button 
                  key={cat} 
                  onClick={() => navigate(`/explore?category=${cat}`)}
                  className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-brand/40 transition group cursor-pointer"
                >
                  <Icon className="w-8 h-8 text-gray-400 group-hover:text-brand mb-2 transition" />
                  <span className="text-xs font-bold text-gray-700 group-hover:text-brand transition text-center">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Why ShareNest Banner */}
      <div className="max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Why ShareNest?</h2>
          <p className="text-sm text-gray-500 mt-1">Save money, reduce waste, and connect with your neighborhood</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-14 h-14 bg-emerald-50 text-brand rounded-2xl flex items-center justify-center mx-auto mb-5">
              <IndianRupee className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Save Thousands of Rupees</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Why pay ₹2,000 for a tool you will use once a year? Borrow it for just ₹100/day from a neighbor down the street.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-14 h-14 bg-emerald-50 text-brand rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Safe & Verified Sharing</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Every request has tracked statuses (Requested ➔ Approved ➔ Handover ➔ Returned) and refundable security deposits.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-14 h-14 bg-emerald-50 text-brand rounded-2xl flex items-center justify-center mx-auto mb-5">
              <RefreshCw className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Sustainable Communities</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Cut down consumer electronics waste and clutter in your garage by sharing resources within Madhya Pradesh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

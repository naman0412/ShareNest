import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, CITIES, CATEGORIES } from '../constants';
import { Search, MapPin, Tag, SlidersHorizontal } from 'lucide-react';

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentCategory = searchParams.get('category') || '';
  const currentArea = searchParams.get('area') || '';
  const currentQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(currentQuery);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (currentCategory) params.category = currentCategory;
    if (currentArea) params.area = currentArea;
    if (currentQuery) params.q = currentQuery;

    axios.get(`${API_URL}/items`, { params })
      .then(res => setItems(res.data.items || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [currentCategory, currentArea, currentQuery]);

  const handleFilterChange = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleFilterChange('q', searchQuery.trim());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Explore Available Items</h1>
          <p className="text-sm text-gray-500 mt-1">Browse verified items shared by neighbors in your area</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input 
              type="text" 
              placeholder="Search cameras, tools, calculators..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-sm"
            />
          </div>
          <button 
            type="submit" 
            className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand/90 transition shadow-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-brand" /> Filters:
        </div>

        {/* Category Filter */}
        <select 
          value={currentCategory} 
          onChange={e => handleFilterChange('category', e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium bg-gray-50 text-gray-700 outline-none focus:border-brand"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* City Filter */}
        <select 
          value={currentArea} 
          onChange={e => handleFilterChange('area', e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium bg-gray-50 text-gray-700 outline-none focus:border-brand"
        >
          <option value="">All Locations</option>
          {CITIES.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        {/* Clear Filters */}
        {(currentCategory || currentArea || currentQuery) && (
          <button 
            onClick={() => {
              setSearchQuery('');
              setSearchParams({});
            }}
            className="text-xs text-red-500 hover:underline font-semibold ml-auto"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand border-t-transparent mb-3"></div>
          <p>Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-lg mx-auto p-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2">No items found</h3>
          <p className="text-sm text-gray-500 mb-4">Try clearing filters or searching for something else like "drill" or "camera".</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setSearchParams({});
            }}
            className="bg-brand text-white px-5 py-2 rounded-xl text-sm font-semibold"
          >
            View All Listings
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(item => (
            <Link 
              to={`/items/${item._id}`} 
              key={item._id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group cursor-pointer"
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
                <div className="flex items-center gap-1 text-xs text-gray-400 font-medium mb-1.5">
                  <MapPin className="w-3 h-3 text-brand" /> {item.area}
                </div>
                <h3 className="font-bold text-base text-gray-900 group-hover:text-brand transition mb-2 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50">
                  <div>
                    <span className="text-xl font-extrabold text-brand">₹{item.feePerDay}</span>
                    <span className="text-xs font-medium text-gray-400"> / day</span>
                  </div>
                  <span className="bg-brand/10 text-brand px-3 py-1.5 rounded-lg text-xs font-bold group-hover:bg-brand group-hover:text-white transition">
                    View & Rent &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;

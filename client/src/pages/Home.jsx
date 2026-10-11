import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Camera, Laptop, Armchair, Calculator, Hammer, Book, Activity, Home as HomeIcon, Package } from 'lucide-react';
import { CITIES, CATEGORIES } from '../constants';

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

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/explore');
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full bg-gradient-to-r from-brand to-brand/80 text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Borrow more. Buy less.</h1>
        <p className="text-xl mb-8 text-white/90">Join your local community to share and rent items.</p>
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto bg-white rounded-full p-2 flex shadow-lg text-gray-800">
          <select className="bg-transparent pl-4 pr-2 outline-none border-r border-gray-200">
            <option value="">All Cities</option>
            {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
          <input type="text" placeholder="What do you need?" className="flex-1 px-4 outline-none" />
          <button type="submit" className="bg-accent text-white px-6 py-2 rounded-full font-semibold hover:bg-accent/90 transition flex items-center gap-2">
            <Search className="h-5 w-5" /> Search
          </button>
        </form>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-16 w-full">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => {
            const Icon = ICONS[cat] || Package;
            return (
              <button 
                key={cat} 
                onClick={() => navigate(`/explore?category=${cat}`)}
                className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-brand/30 transition group"
              >
                <Icon className="w-10 h-10 text-gray-400 group-hover:text-brand mb-3 transition" />
                <span className="font-semibold text-gray-700 group-hover:text-brand transition">{cat}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, CITIES, CATEGORIES } from '../constants';

const Explore = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/items`)
      .then(res => setItems(res.data.items))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-brand">Explore Items</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map(item => (
          <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
            <img src={item.images[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image'} alt={item.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <div className="text-xs text-brand font-semibold uppercase mb-1">{item.category} &bull; {item.area}</div>
              <h3 className="font-bold text-lg mb-2 truncate">{item.title}</h3>
              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-gray-900">₹{item.feePerDay}<span className="text-sm font-normal text-gray-500">/day</span></span>
                <button className="bg-brand/10 text-brand px-3 py-1 rounded-md text-sm font-medium hover:bg-brand hover:text-white transition">View</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore;

import React, { useState, useContext } from 'react';
import axios from 'axios';
import { API_URL, CITIES, CATEGORIES } from '../constants';
import { AuthContext } from '../context/AuthContext';
import { X, Plus, Image as ImageIcon, MapPin, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CONDITIONS = ['Like New', 'Excellent', 'Good', 'New', 'Fair'];

const PostItemModal = ({ isOpen, onClose, onItemCreated }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0] || 'Electronics',
    condition: 'Excellent',
    feePerDay: '',
    depositAmount: '',
    area: user?.area || CITIES[0] || 'Indore',
    pickupLocation: '',
    imageUrl: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to list an item');
      onClose();
      navigate('/login');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter an item title');
      return;
    }
    if (!formData.feePerDay || Number(formData.feePerDay) < 0) {
      toast.error('Please enter a valid rental fee per day');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please write a short description');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const threeMonths = new Date();
      threeMonths.setMonth(now.getMonth() + 3);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        condition: formData.condition,
        feePerDay: Number(formData.feePerDay),
        depositAmount: Number(formData.depositAmount) || 0,
        area: formData.area || user.area || 'Indore',
        pickupLocation: formData.pickupLocation.trim() || `${formData.area || 'Indore'} (Lender Location)`,
        availableFrom: now.toISOString(),
        availableTo: threeMonths.toISOString(),
        images: formData.imageUrl.trim() ? [{ url: formData.imageUrl.trim() }] : []
      };

      const res = await axios.post(`${API_URL}/items`, payload);
      toast.success('🎉 Item listed successfully! Others can now borrow it.');
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        category: CATEGORIES[0] || 'Electronics',
        condition: 'Excellent',
        feePerDay: '',
        depositAmount: '',
        area: user?.area || CITIES[0] || 'Indore',
        pickupLocation: '',
        imageUrl: '',
        description: ''
      });

      if (onItemCreated) {
        onItemCreated(res.data);
      } else {
        navigate('/explore');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || 'Failed to list item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl my-8 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="bg-emerald-50 text-brand text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
            🤝 Lend to Neighbors
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900">Post an Item for Rent</h2>
          <p className="text-xs text-gray-500 mt-1">
            Turn your unused tools, camera, gadgets, or gear into passive income safely.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Item Title *</label>
            <input 
              type="text" 
              placeholder="e.g. Sony Alpha A7 Camera or Bosch Hammer Drill"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand bg-white font-medium"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Condition *</label>
              <select 
                value={formData.condition}
                onChange={e => setFormData({ ...formData, condition: e.target.value })}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand bg-white font-medium"
              >
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Rent Fee (₹ / day) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-gray-400 text-sm font-bold">₹</span>
                <input 
                  type="number" 
                  min="0"
                  placeholder="150"
                  value={formData.feePerDay}
                  onChange={e => setFormData({ ...formData, feePerDay: e.target.value })}
                  className="w-full border border-gray-200 pl-8 pr-3 py-3 rounded-xl text-sm outline-none focus:border-brand font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Security Deposit (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-gray-400 text-sm font-bold">₹</span>
                <input 
                  type="number" 
                  min="0"
                  placeholder="1000"
                  value={formData.depositAmount}
                  onChange={e => setFormData({ ...formData, depositAmount: e.target.value })}
                  className="w-full border border-gray-200 pl-8 pr-3 py-3 rounded-xl text-sm outline-none focus:border-brand font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
              <select 
                value={formData.area}
                onChange={e => setFormData({ ...formData, area: e.target.value })}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand bg-white font-medium"
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Pickup Landmark / Area</label>
              <input 
                type="text" 
                placeholder="e.g. Vijay Nagar / Palasia"
                value={formData.pickupLocation}
                onChange={e => setFormData({ ...formData, pickupLocation: e.target.value })}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Photo Image URL</label>
            <input 
              type="url" 
              placeholder="https://images.unsplash.com/photo-..."
              value={formData.imageUrl}
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand font-medium text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description & Pickup Instructions *</label>
            <textarea 
              rows={3}
              placeholder="Describe your item, accessories included, and how the borrower should pick it up..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand resize-none font-medium"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-brand text-white hover:bg-brand/90 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostItemModal;

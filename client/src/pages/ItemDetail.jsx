import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../constants';
import { AuthContext } from '../context/AuthContext';
import { Calendar, MapPin, Tag, Shield, ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [borrowerNote, setBorrowerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Default dates: tomorrow to 3 days from now
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 4);

    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(threeDays.toISOString().split('T')[0]);

    axios.get(`${API_URL}/items/${id}`)
      .then(res => setItem(res.data))
      .catch(err => {
        console.error(err);
        toast.error('Could not load item details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const handleBorrowRequest = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to borrow items');
      navigate('/login');
      return;
    }

    if (item.owner?._id === user._id) {
      toast.error('You cannot borrow your own item!');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('Return date must be after pickup date');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/requests`, {
        itemId: item._id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        borrowerNote
      });

      toast.success('Borrow request sent successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || 'Failed to submit borrow request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand border-t-transparent mb-4"></div>
        <p>Loading item details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto my-20 text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Item Not Found</h2>
        <p className="text-gray-500 mb-6">The listing you are looking for may have been removed or deactivated.</p>
        <Link to="/explore" className="bg-brand text-white px-6 py-2.5 rounded-xl font-medium inline-block hover:bg-brand/90 transition">
          Browse Other Items
        </Link>
      </div>
    );
  }

  const days = calculateDays();
  const totalRentFee = days * (item.feePerDay || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/explore" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand font-medium mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Explore
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Media & Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <img 
              src={item.images?.[0]?.url || 'https://via.placeholder.com/800x500?text=No+Image'} 
              alt={item.title} 
              className="w-full h-80 sm:h-96 object-cover"
            />
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {item.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {item.area}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  Condition: {item.condition}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{item.title}</h1>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.description}</p>
            </div>

            {/* Owner Details */}
            <div className="border-t border-gray-100 pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-lg">
                {item.owner?.name ? item.owner.name[0] : 'U'}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Listed by</p>
                <h4 className="font-bold text-gray-900">{item.owner?.name || 'Community Member'}</h4>
                <p className="text-xs text-gray-500">{item.area} &bull; Verified Member</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Booking Widget */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
            <div className="flex items-baseline justify-between mb-6 pb-6 border-b border-gray-100">
              <div>
                <span className="text-3xl font-extrabold text-gray-900">₹{item.feePerDay}</span>
                <span className="text-gray-500 text-sm"> / day</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block font-medium">Refundable Deposit</span>
                <span className="text-sm font-semibold text-gray-700">₹{item.depositAmount}</span>
              </div>
            </div>

            <form onSubmit={handleBorrowRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand" /> Pickup Date
                </label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand" /> Return Date
                </label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Note to Owner (Optional)
                </label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Planning to use it for a weekend project in Indore..."
                  value={borrowerNote}
                  onChange={e => setBorrowerNote(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
                />
              </div>

              {/* Price Calculation breakdown */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm border border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>₹{item.feePerDay} &times; {days} {days === 1 ? 'day' : 'days'}</span>
                  <span>₹{totalRentFee}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Refundable Security Deposit</span>
                  <span>₹{item.depositAmount}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total Rental Fee</span>
                  <span className="text-brand">₹{totalRentFee}</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand text-white py-3.5 rounded-xl font-bold hover:bg-brand/90 transition shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Sending Request...' : 'Request to Borrow'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
              <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Free cancellation before pickup handover.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;

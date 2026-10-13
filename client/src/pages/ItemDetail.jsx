import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../constants';
import { AuthContext } from '../context/AuthContext';
import { Calendar, MapPin, Tag, Shield, ArrowLeft, Clock, CheckCircle, Navigation, UserCheck } from 'lucide-react';
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
      toast.error('Please sign in to borrow this item');
      navigate('/login', { state: { from: `/items/${id}` } });
      return;
    }

    if (item.owner?._id === user._id) {
      toast.error('You are the owner of this item!');
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

      toast.success('🎉 Borrow request sent to lender! Check your Dashboard to track progress.');
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
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-gray-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand border-t-transparent mb-4"></div>
        <p className="font-semibold text-sm">Loading item details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto my-20 text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Item Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">This listing may have been removed or deactivated by the owner.</p>
        <Link to="/explore" className="bg-brand text-white px-6 py-3 rounded-xl font-bold text-sm inline-block hover:bg-brand/90 transition shadow-sm">
          Browse Available Items
        </Link>
      </div>
    );
  }

  const days = calculateDays();
  const totalRentFee = days * (item.feePerDay || 0);
  const pickupLoc = item.pickupLocation || `${item.area} (Lender Location)`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link to="/explore" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand font-semibold text-sm mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Explore
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Media & Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm relative group">
            <img 
              src={item.images?.[0]?.url || 'https://via.placeholder.com/800x500?text=No+Image'} 
              alt={item.title} 
              className="w-full h-80 sm:h-[420px] object-cover"
            />
            <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-md">
              {item.category}
            </span>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Condition: {item.condition}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand" /> {item.area}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{item.title}</h1>
            </div>

            {/* Prominent Pickup Location Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  📍 Pickup & Return Location (Lender's Area)
                </p>
                <p className="text-base font-extrabold text-gray-900 mt-0.5">
                  {pickupLoc}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You will pick up the item directly from the lender at this location upon approval.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Description & Usage Guidelines</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{item.description}</p>
            </div>

            {/* Owner Details */}
            <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-brand text-white font-black flex items-center justify-center text-lg shadow-sm">
                  {item.owner?.name ? item.owner.name[0] : 'U'}
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Item Owner</p>
                  <h4 className="font-extrabold text-gray-900">{item.owner?.name || 'Verified Lender'}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5 text-brand" /> {item.area} Community Member
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Booking Widget */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
            <div className="flex items-baseline justify-between mb-6 pb-6 border-b border-gray-100">
              <div>
                <span className="text-3xl font-black text-brand">₹{item.feePerDay}</span>
                <span className="text-gray-400 text-sm font-semibold"> / day</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-gray-400 block font-bold uppercase">Security Deposit</span>
                <span className="text-sm font-extrabold text-gray-800">₹{item.depositAmount} (Refundable)</span>
              </div>
            </div>

            <form onSubmit={handleBorrowRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand" /> Select Pickup Date
                </label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand" /> Select Return Date
                </label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Message to Owner (Optional)
                </label>
                <textarea 
                  rows={2}
                  placeholder="Tell the owner what you need it for and your preferred pickup time..."
                  value={borrowerNote}
                  onChange={e => setBorrowerNote(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none font-medium"
                />
              </div>

              {/* Price Calculation breakdown */}
              <div className="bg-gray-50/80 p-4 rounded-2xl space-y-2 text-sm border border-gray-100">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>₹{item.feePerDay} &times; {days} {days === 1 ? 'day' : 'days'}</span>
                  <span>₹{totalRentFee}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>Refundable Deposit</span>
                  <span>₹{item.depositAmount}</span>
                </div>
                <div className="border-t border-gray-200 pt-2.5 flex justify-between font-black text-gray-900 text-base">
                  <span>Total Due</span>
                  <span className="text-brand">₹{totalRentFee}</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-brand text-white py-4 rounded-2xl font-black text-sm hover:bg-brand/90 transition shadow-lg shadow-brand/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                {isSubmitting ? 'Submitting Request...' : 'Borrow Now'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full refund on deposit after item return.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;

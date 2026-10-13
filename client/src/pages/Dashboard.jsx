import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_URL, CITIES, CATEGORIES } from '../constants';
import axios from 'axios';
import { Package, Inbox, ShoppingBag, Plus, Clock, MapPin, AlertCircle, CheckCircle, Navigation, Shield, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import PostItemModal from '../components/PostItemModal';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('borrowing');
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [lenderRequests, setLenderRequests] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [borrowRes, lenderRes, itemsRes] = await Promise.all([
        axios.get(`${API_URL}/requests/mine`),
        axios.get(`${API_URL}/requests/received`),
        axios.get(`${API_URL}/items?owner=${user._id}`)
      ]);
      setBorrowRequests(borrowRes.data || []);
      setLenderRequests(lenderRes.data || []);
      setMyItems(itemsRes.data?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (reqId, action) => {
    try {
      await axios.patch(`${API_URL}/requests/${reqId}/${action}`);
      toast.success('Status updated successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update request');
    }
  };

  // Helper function to calculate exact time remaining
  const getTimeRemaining = (endDateStr, status) => {
    if (status === 'completed') {
      return { text: 'Rental Completed', type: 'completed' };
    }
    if (status === 'cancelled' || status === 'declined') {
      return { text: status.toUpperCase(), type: 'cancelled' };
    }
    if (!endDateStr) return null;

    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff < 0) {
      const overdueDays = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
      const overdueHours = Math.floor((Math.abs(diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return {
        isOverdue: true,
        text: `OVERDUE by ${overdueDays > 0 ? `${overdueDays}d ` : ''}${overdueHours}h!`,
        days: overdueDays,
        hours: overdueHours,
        type: 'overdue'
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return {
      isOverdue: false,
      text: `${days > 0 ? `${days}d ` : ''}${hours}h remaining`,
      days,
      hours,
      type: 'active'
    };
  };

  if (!user) return <div className="text-center py-20 text-gray-400 font-semibold">Please sign in to view your dashboard.</div>;

  const renderRequestCard = (req, isLender) => {
    const timeInfo = getTimeRemaining(req.endDate, req.status);
    const pickupLoc = req.item?.pickupLocation || `${req.item?.area || 'Indore'} (Lender Location)`;

    return (
      <div key={req._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-5 hover:shadow-md transition">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex gap-4 items-start">
            <img 
              src={req.item?.images?.[0]?.url || 'https://via.placeholder.com/150'} 
              alt={req.item?.title} 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 bg-gray-100 border border-gray-100"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 capitalize">
                  {req.status ? req.status.replace(/_/g, ' ') : 'Requested'}
                </span>
                <span className="text-xs text-gray-400 font-medium">#{req._id.slice(-6)}</span>
              </div>
              <h3 className="font-extrabold text-lg text-gray-900 line-clamp-1">{req.item?.title || 'Item Unavailable'}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isLender 
                  ? `Borrower: ${req.borrower?.name || 'Community Member'} (${req.borrower?.phone || req.borrower?.area || 'Indore'})` 
                  : `Lender: ${req.owner?.name || 'Community Member'} (${req.owner?.phone || req.owner?.area || 'Indore'})`}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-400 font-bold uppercase">Total Fee</p>
            <p className="font-black text-brand text-2xl">₹{req.totalFee}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Deposit: ₹{req.depositAmount}</p>
          </div>
        </div>

        {/* Real-time Time Left & Pickup Location Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-50">
          {/* Time Remaining Counter */}
          <div className={`p-3.5 rounded-2xl flex items-center gap-3 border ${
            timeInfo?.type === 'overdue' 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : (timeInfo?.type === 'completed' 
                  ? 'bg-gray-50 border-gray-200 text-gray-600' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800')
          }`}>
            <Clock className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider">
                {isLender ? 'Expected Back In' : 'Time Left to Return'}
              </p>
              <p className="text-sm font-black">
                {timeInfo?.text || 'Pending approval'}
              </p>
            </div>
          </div>

          {/* Pickup & Return Location */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-amber-900 flex items-center gap-3">
            <Navigation className="w-5 h-5 shrink-0 text-amber-700" />
            <div className="overflow-hidden">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                📍 Pickup & Handover Point
              </p>
              <p className="text-xs font-bold truncate">
                {pickupLoc}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-400 font-medium">
            Rental Period: {new Date(req.startDate).toLocaleDateString()} &rarr; {new Date(req.endDate).toLocaleDateString()}
          </div>

          <div className="flex flex-wrap gap-2">
            {isLender && req.status === 'requested' && (
              <>
                <button 
                  onClick={() => handleAction(req._id, 'approve')} 
                  className="bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand/90 transition shadow-sm"
                >
                  Approve Request
                </button>
                <button 
                  onClick={() => handleAction(req._id, 'decline')} 
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition"
                >
                  Decline
                </button>
              </>
            )}

            {isLender && req.status === 'approved' && (
              <button 
                onClick={() => handleAction(req._id, 'pickup')} 
                className="bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand/90 transition shadow-sm flex items-center gap-1.5"
              >
                Mark Handed Over to Borrower
              </button>
            )}

            {!isLender && req.status === 'picked_up_pending_borrower_confirmation' && (
              <button 
                onClick={() => handleAction(req._id, 'confirm-pickup')} 
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
              >
                Confirm Received Item
              </button>
            )}

            {!isLender && req.status === 'picked_up' && (
              <button 
                onClick={() => handleAction(req._id, 'return')} 
                className="bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand/90 transition shadow-sm"
              >
                Mark Item Returned
              </button>
            )}

            {isLender && req.status === 'returned_pending_owner_confirmation' && (
              <button 
                onClick={() => handleAction(req._id, 'confirm-return')} 
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
              >
                Confirm Returned & Complete
              </button>
            )}

            {req.status === 'completed' && (
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Handover Complete
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Profile + Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as <strong className="text-gray-900">{user.name}</strong> ({user.area}) &bull; Single unified account
          </p>
        </div>
        <button 
          onClick={() => setIsPostModalOpen(true)} 
          className="bg-brand text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-brand/90 transition shadow-lg shadow-brand/20 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Post a Product to Lend
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('borrowing')} 
          className={`pb-4 px-4 font-extrabold text-sm whitespace-nowrap flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'borrowing' ? 'text-brand border-b-2 border-brand' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ShoppingBag className="w-4 h-4"/> Items I Borrowed ({borrowRequests.length})
        </button>
        <button 
          onClick={() => setActiveTab('lending')} 
          className={`pb-4 px-4 font-extrabold text-sm whitespace-nowrap flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'lending' ? 'text-brand border-b-2 border-brand' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Inbox className="w-4 h-4"/> Requests on My Items ({lenderRequests.length})
        </button>
        <button 
          onClick={() => setActiveTab('listings')} 
          className={`pb-4 px-4 font-extrabold text-sm whitespace-nowrap flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'listings' ? 'text-brand border-b-2 border-brand' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Package className="w-4 h-4"/> My Listed Products ({myItems.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[300px]">
        {activeTab === 'borrowing' && (
          <div className="flex flex-col gap-4">
            {borrowRequests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 text-lg">No active borrow requests</h3>
                <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto mb-4">
                  Browse tools, cameras, and gear in your city and borrow with zero hassle.
                </p>
                <a href="/explore" className="bg-brand text-white px-5 py-2.5 rounded-xl font-bold text-sm inline-block">
                  Explore Items Now
                </a>
              </div>
            ) : (
              borrowRequests.map(req => renderRequestCard(req, false))
            )}
          </div>
        )}
        
        {activeTab === 'lending' && (
          <div className="flex flex-col gap-4">
            {lenderRequests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
                <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 text-lg">No incoming requests yet</h3>
                <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                  When neighbors in Indore, Ujjain, or Dewas request to borrow your items, they will appear here.
                </p>
              </div>
            ) : (
              lenderRequests.map(req => renderRequestCard(req, true))
            )}
          </div>
        )}

        {activeTab === 'listings' && (
          <div>
            {myItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 text-lg">You haven't listed any items yet</h3>
                <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto mb-4">
                  Have a DSLR, hammer drill, or tent sitting idle? Post it to start earning!
                </p>
                <button 
                  onClick={() => setIsPostModalOpen(true)} 
                  className="bg-brand text-white px-5 py-2.5 rounded-xl font-bold text-sm"
                >
                  + Post Your First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myItems.map(item => (
                  <div key={item._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                    <img 
                      src={item.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image'} 
                      alt={item.title} 
                      className="w-full h-48 object-cover" 
                    />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-brand">{item.category}</span>
                        <span className="text-xs text-gray-400 font-medium">📍 {item.pickupLocation || item.area}</span>
                      </div>
                      <h3 className="font-bold text-base text-gray-900 line-clamp-1">{item.title}</h3>
                      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-50">
                        <span className="font-black text-brand text-lg">₹{item.feePerDay}/day</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for Posting Products */}
      <PostItemModal 
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onItemCreated={() => {
          fetchData();
        }}
      />
    </div>
  );
};

export default Dashboard;

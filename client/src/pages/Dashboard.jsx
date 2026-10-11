import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../constants';
import axios from 'axios';
import { Package, Inbox, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('borrowing');
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [lenderRequests, setLenderRequests] = useState([]);
  const [myItems, setMyItems] = useState([]);

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
      setBorrowRequests(borrowRes.data);
      setLenderRequests(lenderRes.data);
      setMyItems(itemsRes.data.items || []);
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
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    }
  };

  if (!user) return <div className="text-center py-20">Please login.</div>;

  const renderRequestCard = (req, isLender) => (
    <div key={req._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
      <div>
        <h3 className="font-bold text-lg">{req.item?.title || 'Item Unavailable'}</h3>
        <div className="flex items-center gap-2 mt-1 mb-2">
          <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 capitalize">{req.status.replace(/_/g, ' ')}</span>
        </div>
        <p className="text-sm text-gray-500">
          {isLender ? `Borrower: ${req.borrower?.name || 'Unknown'}` : `Owner: ${req.owner?.name || 'Unknown'}`}
        </p>
        <p className="text-sm text-gray-500">Dates: {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
      </div>
      <div className="flex flex-col items-end justify-between">
        <p className="font-bold text-gray-900 text-xl">₹{req.totalFee}</p>
        <div className="flex flex-wrap justify-end gap-2 mt-4">
          {isLender && req.status === 'requested' && (
            <>
              <button onClick={() => handleAction(req._id, 'approve')} className="bg-brand text-white px-3 py-1 rounded text-sm font-medium hover:bg-brand/90 transition">Approve</button>
              <button onClick={() => handleAction(req._id, 'decline')} className="bg-red-50 text-red-600 px-3 py-1 rounded text-sm font-medium hover:bg-red-100 transition">Decline</button>
            </>
          )}
          {isLender && req.status === 'approved' && (
            <button onClick={() => handleAction(req._id, 'pickup')} className="bg-accent text-white px-3 py-1 rounded text-sm font-medium hover:bg-accent/90 transition">Mark Handed Over</button>
          )}
          {!isLender && req.status === 'picked_up_pending_borrower_confirmation' && (
            <button onClick={() => handleAction(req._id, 'confirm-pickup')} className="bg-brand text-white px-3 py-1 rounded text-sm font-medium hover:bg-brand/90 transition">Confirm Received</button>
          )}
          {!isLender && req.status === 'picked_up' && (
            <button onClick={() => handleAction(req._id, 'return')} className="bg-accent text-white px-3 py-1 rounded text-sm font-medium hover:bg-accent/90 transition">Return Item</button>
          )}
          {isLender && req.status === 'returned_pending_owner_confirmation' && (
            <button onClick={() => handleAction(req._id, 'confirm-return')} className="bg-brand text-white px-3 py-1 rounded text-sm font-medium hover:bg-brand/90 transition">Confirm Returned</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-brand">Hello, {user.name}</h1>
      
      <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto">
        <button onClick={() => setActiveTab('borrowing')} className={`pb-4 px-4 font-semibold whitespace-nowrap flex items-center gap-2 ${activeTab === 'borrowing' ? 'text-brand border-b-2 border-brand' : 'text-gray-500'}`}>
          <ShoppingBag className="w-5 h-5"/> My Borrowing
        </button>
        <button onClick={() => setActiveTab('lending')} className={`pb-4 px-4 font-semibold whitespace-nowrap flex items-center gap-2 ${activeTab === 'lending' ? 'text-brand border-b-2 border-brand' : 'text-gray-500'}`}>
          <Inbox className="w-5 h-5"/> Requests Received
        </button>
        <button onClick={() => setActiveTab('listings')} className={`pb-4 px-4 font-semibold whitespace-nowrap flex items-center gap-2 ${activeTab === 'listings' ? 'text-brand border-b-2 border-brand' : 'text-gray-500'}`}>
          <Package className="w-5 h-5"/> My Listings
        </button>
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'borrowing' && (
          <div className="flex flex-col gap-4">
            {borrowRequests.length === 0 ? <p className="text-gray-500">You haven't borrowed anything yet.</p> : borrowRequests.map(req => renderRequestCard(req, false))}
          </div>
        )}
        
        {activeTab === 'lending' && (
          <div className="flex flex-col gap-4">
            {lenderRequests.length === 0 ? <p className="text-gray-500">No requests received for your items.</p> : lenderRequests.map(req => renderRequestCard(req, true))}
          </div>
        )}

        {activeTab === 'listings' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Products</h2>
            </div>
            {myItems.length === 0 ? (
              <p className="text-gray-500">You haven't listed any items yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myItems.map(item => (
                  <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <img src={item.images[0]?.url || 'https://via.placeholder.com/400x300'} alt={item.title} className="w-full h-40 object-cover" />
                    <div className="p-4">
                      <h3 className="font-bold text-lg truncate">{item.title}</h3>
                      <p className="text-brand font-medium text-sm mt-1">{item.category}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="font-bold text-gray-900">₹{item.feePerDay}/day</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
    </div>
  );
};

export default Dashboard;

import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_URL, CITIES, CATEGORIES } from '../constants';
import axios from 'axios';
import { Package, Inbox, ShoppingBag, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CONDITIONS = ['New', 'Like New', 'Excellent', 'Good', 'Fair'];

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('borrowing');
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [lenderRequests, setLenderRequests] = useState([]);
  const [myItems, setMyItems] = useState([]);

  // List Item Modal state
  const [showModal, setShowModal] = useState(false);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0] || 'Electronics',
    condition: 'Excellent',
    feePerDay: '',
    depositAmount: '',
    area: user?.area || CITIES[0] || 'Indore',
    imageUrl: ''
  });

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
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItem.title.trim() || !newItem.description.trim() || !newItem.feePerDay) {
      toast.error('Please fill in title, description, and fee');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const now = new Date();
      const threeMonths = new Date();
      threeMonths.setMonth(now.getMonth() + 3);

      const payload = {
        title: newItem.title.trim(),
        description: newItem.description.trim(),
        category: newItem.category,
        condition: newItem.condition,
        feePerDay: Number(newItem.feePerDay),
        depositAmount: Number(newItem.depositAmount) || 0,
        area: newItem.area || user.area || 'Indore',
        availableFrom: now.toISOString(),
        availableTo: threeMonths.toISOString(),
        images: newItem.imageUrl.trim() ? [{ url: newItem.imageUrl.trim() }] : []
      };

      await axios.post(`${API_URL}/items`, payload);
      toast.success('Item listed successfully!');
      setShowModal(false);
      setNewItem({
        title: '',
        description: '',
        category: CATEGORIES[0] || 'Electronics',
        condition: 'Excellent',
        feePerDay: '',
        depositAmount: '',
        area: user?.area || CITIES[0] || 'Indore',
        imageUrl: ''
      });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || 'Failed to list item');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  if (!user) return <div className="text-center py-20 text-gray-500 font-medium">Please login to view dashboard.</div>;

  const renderRequestCard = (req, isLender) => (
    <div key={req._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
      <div>
        <h3 className="font-bold text-lg text-gray-900">{req.item?.title || 'Item Unavailable'}</h3>
        <div className="flex items-center gap-2 mt-1 mb-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 capitalize">
            {req.status ? req.status.replace(/_/g, ' ') : 'Requested'}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          {isLender ? `Borrower: ${req.borrower?.name || 'Community Member'}` : `Owner: ${req.owner?.name || 'Community Member'}`}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Dates: {new Date(req.startDate).toLocaleDateString()} &mdash; {new Date(req.endDate).toLocaleDateString()}
        </p>
      </div>

      <div className="flex flex-col sm:items-end justify-between">
        <p className="font-extrabold text-brand text-xl">₹{req.totalFee}</p>
        <div className="flex flex-wrap justify-end gap-2 mt-4">
          {isLender && req.status === 'requested' && (
            <>
              <button onClick={() => handleAction(req._id, 'approve')} className="bg-brand text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-brand/90 transition shadow-sm">
                Approve Request
              </button>
              <button onClick={() => handleAction(req._id, 'decline')} className="bg-red-50 text-red-600 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition">
                Decline
              </button>
            </>
          )}
          {isLender && req.status === 'approved' && (
            <button onClick={() => handleAction(req._id, 'pickup')} className="bg-brand text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-brand/90 transition shadow-sm">
              Mark Handed Over
            </button>
          )}
          {!isLender && req.status === 'picked_up_pending_borrower_confirmation' && (
            <button onClick={() => handleAction(req._id, 'confirm-pickup')} className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition shadow-sm">
              Confirm Received
            </button>
          )}
          {!isLender && req.status === 'picked_up' && (
            <button onClick={() => handleAction(req._id, 'return')} className="bg-brand text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-brand/90 transition shadow-sm">
              Mark as Returned
            </button>
          )}
          {isLender && req.status === 'returned_pending_owner_confirmation' && (
            <button onClick={() => handleAction(req._id, 'confirm-return')} className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition shadow-sm">
              Confirm Returned & Complete
            </button>
          )}
          {req.status === 'completed' && (
            <span className="text-xs text-gray-400 font-semibold py-1">Rental Completed</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{user.area} &bull; Member Dashboard</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-brand text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-brand/90 transition shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> List a New Item
        </button>
      </div>
      
      <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('borrowing')} 
          className={`pb-4 px-4 font-bold text-sm whitespace-nowrap flex items-center gap-2 transition ${
            activeTab === 'borrowing' ? 'text-brand border-b-2 border-brand' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ShoppingBag className="w-4 h-4"/> My Borrow Requests ({borrowRequests.length})
        </button>
        <button 
          onClick={() => setActiveTab('lending')} 
          className={`pb-4 px-4 font-bold text-sm whitespace-nowrap flex items-center gap-2 transition ${
            activeTab === 'lending' ? 'text-brand border-b-2 border-brand' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Inbox className="w-4 h-4"/> Requests Received ({lenderRequests.length})
        </button>
        <button 
          onClick={() => setActiveTab('listings')} 
          className={`pb-4 px-4 font-bold text-sm whitespace-nowrap flex items-center gap-2 transition ${
            activeTab === 'listings' ? 'text-brand border-b-2 border-brand' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Package className="w-4 h-4"/> My Listings ({myItems.length})
        </button>
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'borrowing' && (
          <div className="flex flex-col gap-4">
            {borrowRequests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
                <p className="text-gray-500 font-medium">You haven't requested any items yet.</p>
              </div>
            ) : (
              borrowRequests.map(req => renderRequestCard(req, false))
            )}
          </div>
        )}
        
        {activeTab === 'lending' && (
          <div className="flex flex-col gap-4">
            {lenderRequests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
                <p className="text-gray-500 font-medium">No requests received for your items yet.</p>
              </div>
            ) : (
              lenderRequests.map(req => renderRequestCard(req, true))
            )}
          </div>
        )}

        {activeTab === 'listings' && (
          <div>
            {myItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
                <p className="text-gray-500 font-medium mb-4">You haven't listed any items yet.</p>
                <button onClick={() => setShowModal(true)} className="bg-brand text-white px-5 py-2.5 rounded-xl font-bold text-sm">
                  List Your First Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myItems.map(item => (
                  <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <img src={item.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image'} alt={item.title} className="w-full h-44 object-cover" />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-brand">{item.category}</span>
                        <span className="text-xs text-gray-400">{item.area}</span>
                      </div>
                      <h3 className="font-bold text-base text-gray-900 line-clamp-1">{item.title}</h3>
                      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-50">
                        <span className="font-extrabold text-brand text-lg">₹{item.feePerDay}/day</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
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

      {/* Modal: List a New Item */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">List an Item for Rent</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Item Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sony Alpha A7 Camera or Bosch Hammer Drill"
                  value={newItem.title}
                  onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select 
                    value={newItem.category}
                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand bg-white"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Condition</label>
                  <select 
                    value={newItem.condition}
                    onChange={e => setNewItem({ ...newItem, condition: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand bg-white"
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fee Per Day (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 150"
                    value={newItem.feePerDay}
                    onChange={e => setNewItem({ ...newItem, feePerDay: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Security Deposit (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1000"
                    value={newItem.depositAmount}
                    onChange={e => setNewItem({ ...newItem, depositAmount: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City / Location</label>
                <select 
                  value={newItem.area}
                  onChange={e => setNewItem({ ...newItem, area: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand bg-white"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL (Optional)</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newItem.imageUrl}
                  onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description & Details</label>
                <textarea 
                  rows={3}
                  placeholder="Describe your item, accessories included, and pickup notes..."
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-brand resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingItem}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-brand text-white hover:bg-brand/90 transition shadow-sm disabled:opacity-50"
                >
                  {isSubmittingItem ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

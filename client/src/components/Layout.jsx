import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, Plus, User, LogOut, Compass, LayoutDashboard } from 'lucide-react';
import PostItemModal from './PostItemModal';
import toast from 'react-hot-toast';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const handleOpenPostModal = () => {
    if (!user) {
      toast.error('Please sign in to lend an item');
      navigate('/login');
      return;
    }
    setIsPostModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center shadow-md shadow-brand/20 group-hover:scale-105 transition-transform">
                  <Leaf className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl sm:text-2xl text-gray-900 tracking-tight leading-none">
                    Share<span className="text-brand">Nest</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-0.5">
                    Borrow &bull; Lend &bull; Share
                  </span>
                </div>
              </Link>
            </div>

            {/* Nav Links & CTA */}
            <div className="flex items-center gap-3 sm:gap-5">
              <Link 
                to="/explore" 
                className="text-gray-600 hover:text-brand font-bold text-sm hidden sm:flex items-center gap-1.5 transition"
              >
                <Compass className="w-4 h-4" /> Explore
              </Link>

              {/* Prominent Plus / Lend Icon Button */}
              <button 
                onClick={handleOpenPostModal}
                className="bg-brand text-white px-3.5 sm:px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm hover:bg-brand/90 transition shadow-md shadow-brand/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Lend an Item</span>
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link 
                    to="/dashboard" 
                    className="text-gray-700 hover:text-brand font-bold text-xs sm:text-sm bg-gray-50 hover:bg-emerald-50 px-3 sm:px-4 py-2.5 rounded-2xl transition border border-gray-100 flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-4 h-4 text-brand" />
                    <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                    <span className="sm:hidden">Dashboard</span>
                  </Link>

                  <button 
                    onClick={logout} 
                    title="Logout"
                    className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-white mt-16 py-10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-gray-500">
          <div>
            <p className="font-bold text-gray-700 text-sm">ShareNest — Local Item Sharing Marketplace</p>
            <p className="mt-1">Connecting neighbors across Indore, Ujjain, and Dewas.</p>
          </div>
          <div>
            <p>&copy; {new Date().getFullYear()} ShareNest. Borrow more. Buy less.</p>
          </div>
        </div>
      </footer>

      {/* Global Post Item Modal */}
      <PostItemModal 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)} 
        onItemCreated={() => {
          navigate('/explore');
        }}
      />
    </div>
  );
};

export default Layout;

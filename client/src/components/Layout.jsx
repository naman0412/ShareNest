import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, Bell, User } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <Leaf className="h-8 w-8 text-brand" />
                <span className="font-bold text-xl text-brand">ShareNest</span>
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/explore" className="text-gray-600 hover:text-brand font-medium">Explore</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="text-gray-600 hover:text-brand font-medium">Dashboard</Link>
                  <button onClick={logout} className="text-gray-600 hover:text-red-600 font-medium">Logout</button>
                </>
              ) : (
                <Link to="/login" className="bg-brand text-white px-4 py-2 rounded-lg font-medium hover:bg-brand/90 transition">Login</Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-white mt-12 py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} ShareNest. Borrow more. Buy less.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

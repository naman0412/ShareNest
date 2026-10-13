import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CITIES } from '../constants';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('borrower');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState(CITIES[0] || 'Indore');

  const { login, register } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          toast.error('Please enter your email and password');
          setIsSubmitting(false);
          return;
        }
        const res = await login(email, password, role);
        if (res.success) {
          navigate(role === 'borrower' ? '/explore' : '/dashboard');
        }
      } else {
        // Register validation
        if (!name.trim()) {
          toast.error('Please enter your full name');
          setIsSubmitting(false);
          return;
        }
        if (!email.trim()) {
          toast.error('Please enter a valid email address');
          setIsSubmitting(false);
          return;
        }
        if (!phone.trim()) {
          toast.error('Please enter your contact phone number');
          setIsSubmitting(false);
          return;
        }
        if (!password || password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }

        const res = await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          area
        }, role);

        if (res.success) {
          navigate(role === 'borrower' ? '/explore' : '/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      {/* Role Toggle */}
      <div className="flex mb-6 bg-gray-50 p-1 rounded-xl">
        <button 
          type="button"
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            role === 'borrower' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setRole('borrower')}
        >
          Borrower
        </button>
        <button 
          type="button"
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            role === 'lender' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setRole('lender')}
        >
          Lender
        </button>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">
          {isLogin ? 'Welcome back to ShareNest' : 'Join the Community'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isLogin 
            ? 'Sign in to borrow, rent, or manage your listings' 
            : 'Create an account to start sharing items locally'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name input for Register only */}
        {!isLogin && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Rahul Sharma" 
              className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
          <input 
            type="email" 
            placeholder="e.g. rahul@example.com" 
            className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Phone & City for Register only */}
        {!isLogin && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
              <input 
                type="tel" 
                placeholder="e.g. 9876543210" 
                className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Your City / Area</label>
              <select 
                className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm bg-white"
                value={area}
                onChange={e => setArea(e.target.value)}
              >
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
          <input 
            type="password" 
            placeholder={isLogin ? 'Enter your password' : 'Create a secure password (min 6 chars)'} 
            className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-brand text-white py-3.5 rounded-xl font-bold hover:bg-brand/90 transition shadow-sm mt-2 disabled:opacity-60 flex items-center justify-center"
        >
          {isSubmitting 
            ? 'Processing...' 
            : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      {/* Switch between Login and Register */}
      <div className="mt-6 text-center border-t border-gray-100 pt-5">
        <button 
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
          }} 
          className="text-sm font-semibold text-brand hover:underline"
        >
          {isLogin 
            ? "Don't have an account? Sign up for free" 
            : "Already have an account? Sign in here"}
        </button>
      </div>

      {/* Quick Test Credential Hint */}
      {isLogin && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 text-center border border-gray-100">
          💡 <strong>Demo Account:</strong> naman@sharenest.com / Password@123
        </div>
      )}
    </div>
  );
};

export default Login;

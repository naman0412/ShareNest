import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { CITIES } from '../constants';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState(CITIES[0] || 'Indore');

  const { login, register } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination if coming from a protected action
  const from = location.state?.from || '/explore';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        if (!email.trim() || !password) {
          toast.error('Please enter your email and password');
          setIsSubmitting(false);
          return;
        }
        const res = await login(email.trim().toLowerCase(), password);
        if (res.success) {
          navigate(from);
        }
      } else {
        // Validation for registration
        if (!name.trim()) {
          toast.error('Please enter your full name');
          setIsSubmitting(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          toast.error('Please enter a valid email address');
          setIsSubmitting(false);
          return;
        }
        if (!phone.trim() || phone.trim().length < 10) {
          toast.error('Please enter a valid 10-digit phone number');
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
        });

        if (res.success) {
          navigate(from);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      {/* Mode Switcher Tabs */}
      <div className="flex mb-6 bg-gray-50 p-1 rounded-2xl border border-gray-100">
        <button 
          type="button"
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            isLogin ? 'bg-white text-brand shadow-sm' : 'text-gray-400 hover:text-gray-700'
          }`}
          onClick={() => setIsLogin(true)}
        >
          Sign In
        </button>
        <button 
          type="button"
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            !isLogin ? 'bg-white text-brand shadow-sm' : 'text-gray-400 hover:text-gray-700'
          }`}
          onClick={() => setIsLogin(false)}
        >
          Create Account
        </button>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">
          {isLogin ? 'Welcome back to ShareNest' : 'Join Your Neighborhood'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isLogin 
            ? 'Access your items, active rentals, and borrow requests' 
            : 'One unified account to both borrow and lend items locally'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full Name (Register only) */}
        {!isLogin && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Naman Agrawal" 
              className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
          <input 
            type="email" 
            placeholder="e.g. naman@sharenest.com" 
            className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Phone & City (Register only) */}
        {!isLogin && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                placeholder="e.g. 9876543210" 
                className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City / Neighborhood</label>
              <select 
                className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm bg-white"
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
          <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            placeholder={isLogin ? 'Enter your password' : 'Create a secure password (min 6 characters)'} 
            className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-brand text-white py-4 rounded-xl font-bold hover:bg-brand/90 transition shadow-md mt-2 disabled:opacity-50 flex items-center justify-center text-sm"
        >
          {isSubmitting 
            ? 'Please wait...' 
            : (isLogin ? 'Sign In to ShareNest' : 'Create My Free Account')}
        </button>
      </form>

      {/* Switch between Login and Register */}
      <div className="mt-6 text-center border-t border-gray-100 pt-5">
        <button 
          type="button"
          onClick={() => setIsLogin(!isLogin)} 
          className="text-sm font-semibold text-brand hover:underline"
        >
          {isLogin 
            ? "New neighbor? Create an account for free" 
            : "Already registered? Sign in with your account"}
        </button>
      </div>

      {/* Demo Credentials Box */}
      {isLogin && (
        <div className="mt-5 p-3.5 bg-emerald-50/60 rounded-2xl text-xs text-gray-600 border border-emerald-100 text-center">
          💡 <strong>Demo Account:</strong> <code>naman@sharenest.com</code> / <code>Password@123</code>
        </div>
      )}
    </div>
  );
};

export default Login;

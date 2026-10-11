import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('borrower');
  const [email, setEmail] = useState('naman@sharenest.com');
  const [password, setPassword] = useState('Test@1234');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      const res = await login(email, password, role);
      if (res.success) {
        navigate(role === 'borrower' ? '/explore' : '/dashboard');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="flex mb-6 border-b border-gray-200">
        <button 
          className={`flex-1 py-2 font-medium ${role === 'borrower' ? 'text-brand border-b-2 border-brand' : 'text-gray-500'}`}
          onClick={() => setRole('borrower')}
        >Borrower</button>
        <button 
          className={`flex-1 py-2 font-medium ${role === 'lender' ? 'text-brand border-b-2 border-brand' : 'text-gray-500'}`}
          onClick={() => setRole('lender')}
        >Lender</button>
      </div>
      
      <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input 
          type="email" 
          placeholder="Email" 
          className="border border-gray-300 p-3 rounded-lg outline-none focus:border-brand"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="border border-gray-300 p-3 rounded-lg outline-none focus:border-brand"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-brand text-white py-3 rounded-lg font-bold hover:bg-brand/90 transition mt-2">
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-gray-500 hover:text-brand">
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export default Login;

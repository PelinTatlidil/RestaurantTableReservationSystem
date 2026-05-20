import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const response = await axiosInstance.post('/api/auth/login', formData);
      login(response.data);
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
      navigate(response.data.role === 'admin' ? '/admin-dashboard' : '/profile');
    } catch (error) {
      alert('Login failed. Please try again.');
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
      if (response.data.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/customer-panel');
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Login failed. Please try again.');
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    }
  };

  return (
<<<<<<< ours
    <main className="restaurant-auth-page">
      <section className="w-full max-w-[477px]">
        <div className="mb-8">
          <h1 className="font-serif text-6xl font-semibold text-stone-950">Log In</h1>
          <p className="mt-2 text-xl text-stone-700">Welcome Back!</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="restaurant-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="restaurant-input"
          />
          <button type="submit" className="restaurant-button mt-10 w-[130px]">
            Login
          </button>
        </form>
        <div className="mt-16 flex flex-wrap items-center gap-4 text-xl text-stone-800">
          <span>Don't have an account?</span>
          <Link to="/register" className="restaurant-button w-[147px]">
            Register
          </Link>
        </div>
      </section>
    </main>
=======
    <div className="max-w-md mx-auto mt-20">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Login
        </button>
      </form>
    </div>
>>>>>>> theirs
  );
};

export default Login;

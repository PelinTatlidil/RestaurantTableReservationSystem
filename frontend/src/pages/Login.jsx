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
      const response = await axiosInstance.post('/api/auth/login', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      login(response.data);

      if (response.data.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/profile');
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <main className="restaurant-auth-page">
      <section className="w-full max-w-[477px]">
        <div className="mb-8">
          <h1 className="font-serif text-6xl font-semibold text-stone-950">
            Log In
          </h1>
          <p className="mt-2 text-xl text-stone-700">Welcome Back!</p>
        </div>

        {error && <p className="mb-4 text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          <input
            type="email"
            name="login-email"
            placeholder="Email"
            autoComplete="off"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="restaurant-input"
          />

          <input
            type="password"
            name="login-password"
            placeholder="Password"
            autoComplete="new-password"
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
  );
};

export default Login;

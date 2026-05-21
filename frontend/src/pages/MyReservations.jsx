import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.password
    ) {
      setMessage({
        type: 'error',
        text: 'Please complete all required fields.',
      });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long.',
      });
      return;
    }

    if (formData.password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match.',
      });
      return;
    }

    try {
      const response = await axiosInstance.post('/api/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      setMessage({
        type: 'success',
        text: response.data.message || 'Registration successful. Please log in.',
      });

      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Registration failed. Please try again.',
      });
    }
  };

  return (
    <main className="restaurant-auth-page">
      <section className="w-full max-w-[477px]">
        <h1 className="mb-8 font-serif text-5xl font-semibold text-stone-950">
          Register Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="restaurant-input"
          />

          <input
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="restaurant-input"
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="restaurant-input"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="restaurant-input"
          />

          <input
            type="tel"
            placeholder="Phone Number"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="restaurant-input"
          />

          {message.text && (
            <p
              className={
                message.type === 'error'
                  ? 'restaurant-message-error'
                  : 'restaurant-message-success'
              }
            >
              {message.text}
            </p>
          )}

          <button type="submit" className="restaurant-button mt-4 w-[147px]">
            Register
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xl text-stone-800">
          <span>Already have an account?</span>
          <Link
            to="/login"
            className="restaurant-button restaurant-button-secondary w-[130px]"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Register;
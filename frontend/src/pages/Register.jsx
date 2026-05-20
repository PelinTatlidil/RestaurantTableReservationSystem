import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Register = () => {
<<<<<<< ours
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
=======
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    setMessage({ type: '', text: '' });

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setMessage({ type: 'error', text: 'Please complete all required fields.' });
      return;
    }

    if (formData.password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('All fields are required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
      return;
    }

    try {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
      const response = await axiosInstance.post('/api/auth/register', formData);
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
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
      await axiosInstance.post('/api/auth/register', formData);
      setSuccess('Registration successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1000);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Registration failed. Please try again.');
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
        <h1 className="mb-8 font-serif text-5xl font-semibold text-stone-950">Register Account</h1>
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
            <p className={message.type === 'error' ? 'restaurant-message-error' : 'restaurant-message-success'}>
              {message.text}
            </p>
          )}
          <button type="submit" className="restaurant-button mt-4 w-[147px]">
            Register
          </button>
        </form>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xl text-stone-800">
          <span>Already have an account?</span>
          <Link to="/login" className="restaurant-button restaurant-button-secondary w-[130px]">
            Login
          </Link>
        </div>
      </section>
    </main>
=======
    <div className="max-w-md mx-auto mt-20">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>
        {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}
        {success && <p className="mb-4 text-green-600 text-sm">{success}</p>}
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
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
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">
          Register
        </button>
      </form>
    </div>
>>>>>>> theirs
  );
};

export default Register;

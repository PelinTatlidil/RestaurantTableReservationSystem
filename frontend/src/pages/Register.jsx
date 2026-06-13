import { useEffect, useState } from 'react';
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
  const [emailStatus, setEmailStatus] = useState({
    checking: false,
    exists: false,
    text: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const email = formData.email.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      setEmailStatus({ checking: false, exists: false, text: '' });
      return undefined;
    }

    const controller = new AbortController();
    let isActive = true;
    setEmailStatus({ checking: true, exists: false, text: 'Checking email...' });

    const timeoutId = setTimeout(async () => {
      const abortTimeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await axiosInstance.get('/api/auth/check-email', {
          params: { email },
          signal: controller.signal,
        });

        if (isActive) {
          setEmailStatus({
            checking: false,
            exists: response.data.exists,
            text: response.data.exists ? 'Email address already exists.' : '',
          });
        }
      } catch (error) {
        if (isActive) {
          setEmailStatus({
            checking: false,
            exists: false,
            text: 'Email availability could not be checked. You can still register.',
          });
        }
      } finally {
        clearTimeout(abortTimeoutId);
      }
    }, 400);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [formData.email]);

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

    if (emailStatus.exists) {
      setMessage({
        type: 'error',
        text: 'Email address already exists.',
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

          {emailStatus.text && (
            <p
              className={
                emailStatus.exists
                  ? 'restaurant-message-error'
                  : 'text-sm font-semibold text-stone-600'
              }
            >
              {emailStatus.text}
            </p>
          )}

          <input
            type="tel"
            placeholder="Phone Number"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

          <button
            type="submit"
            disabled={emailStatus.exists}
            className="restaurant-button mt-4 w-[147px] disabled:cursor-not-allowed disabled:opacity-60"
          >
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

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const Profile = () => {
  const { user } = useAuth(); // Access user token from context
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Fetch profile data from the backend
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFormData({
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || '',
        });
      } catch (error) {
        setMessage({
          type: 'error',
          text: 'Failed to fetch profile. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.name.trim() || !formData.phone.trim()) {
      setMessage({
        type: 'error',
        text: 'Name and phone number are required.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put(
        '/api/auth/profile',
        {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      setFormData({
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone || '',
      });
      setMessage({
        type: 'success',
        text: response.data.message || 'Profile updated successfully.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="restaurant-page py-20 text-center text-xl text-stone-700">Loading...</div>;
  }

  return (
    <main className="restaurant-page px-6 py-20">
      <section className="mx-auto max-w-6xl">
        <div className="mb-16">
          <h1 className="font-serif text-5xl font-semibold text-stone-950">Welcome!</h1>
          <p className="mt-4 text-xl text-stone-700">
            Manage your restaurant bookings from your dashboard.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <article className="restaurant-card flex h-full flex-col p-8">
            <h2 className="font-serif text-3xl text-stone-950">Make a Reservation</h2>
            <p className="mt-4 text-xl text-stone-700">
              Book a table by selecting a date, time and number of guests.
            </p>
            <div className="mt-auto pt-8">
              <Link to="/make-reservation" className="restaurant-button w-[167px]">
                Book now
              </Link>
            </div>
          </article>
          <article className="restaurant-card flex h-full flex-col p-8">
            <h2 className="font-serif text-3xl text-stone-950">My Reservations</h2>
            <p className="mt-4 text-xl text-stone-700">
              View, update or cancel your existing reservations.
            </p>
            <div className="mt-auto pt-8">
              <Link to="/my-reservations" className="restaurant-button w-[266px]">
                My Reservations
              </Link>
            </div>
          </article>
        </div>

        <form onSubmit={handleSubmit} className="restaurant-card mt-12 grid gap-5 p-8 md:grid-cols-2">
          <h2 className="font-serif text-3xl text-stone-950 md:col-span-2">Your Profile</h2>
          <p className="text-lg text-stone-700 md:col-span-2">
            Update your personal details below.
          </p>
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
            value={formData.email}
            readOnly
            className="restaurant-input opacity-75"
          />
          <input
            type="tel"
            placeholder="Phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="restaurant-input"
          />

          {message.text && (
            <p
              className={
                message.type === 'error'
                  ? 'restaurant-message-error md:col-span-2'
                  : 'restaurant-message-success md:col-span-2'
              }
            >
              {message.text}
            </p>
          )}

          <button type="submit" className="restaurant-button md:col-span-2 md:w-[240px]">
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Profile;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const statusClassName = (status) => {
  if (status === 'Confirmed' || status === 'Completed') {
    return 'restaurant-status';
  }

  if (status === 'Pending') {
    return 'restaurant-status restaurant-status-pending';
  }

  return 'restaurant-status restaurant-status-canceled';
};

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateValue));

const reservationTime = (reservation) => {
  if (reservation.timeSlot) {
    return `${reservation.timeSlot.startTime} - ${reservation.timeSlot.endTime}`;
  }

  return 'Not assigned';
};

const Profile = () => {
  const { user } = useAuth(); // Access user token from context
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationMessage, setReservationMessage] = useState('');
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

  useEffect(() => {
    const fetchReservations = async () => {
      setReservationsLoading(true);
      setReservationMessage('');

      try {
        const response = await axiosInstance.get('/api/reservations/my', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setReservations(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setReservationMessage(
          error.response?.data?.message || 'Failed to fetch reservations.'
        );
      } finally {
        setReservationsLoading(false);
      }
    };

    if (user) fetchReservations();
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

        <section className="mb-12" aria-labelledby="dashboard-reservations-title">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2
                id="dashboard-reservations-title"
                className="font-serif text-3xl text-stone-950"
              >
                My Reservations
              </h2>
              <p className="mt-2 text-lg text-stone-700">
                Review your upcoming and recent booking details.
              </p>
            </div>
            <Link to="/make-reservation" className="restaurant-button md:w-[190px]">
              Book a Table
            </Link>
          </div>

          <div className="restaurant-admin-table" role="table" aria-label="Customer dashboard reservations">
            <div className="reservation-admin-row restaurant-admin-head" role="row">
              <span role="columnheader">Date</span>
              <span role="columnheader">Time</span>
              <span role="columnheader">Guests</span>
              <span role="columnheader">Table</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Notification</span>
              <span role="columnheader">Details</span>
            </div>

            {reservationsLoading ? (
              <div className="p-6 text-xl text-stone-700" role="status">
                Loading reservations...
              </div>
            ) : reservationMessage ? (
              <div className="restaurant-message-error m-6" role="alert">
                {reservationMessage}
              </div>
            ) : reservations.length ? (
              reservations.map((reservation) => (
                <div key={reservation._id} className="reservation-admin-row" role="row">
                  <span role="cell">{formatDate(reservation.date)}</span>
                  <span role="cell">{reservationTime(reservation)}</span>
                  <span role="cell">{reservation.guests}</span>
                  <span role="cell">
                    {reservation.table
                      ? `Table ${reservation.table.tableNumber}`
                      : 'Not assigned'}
                  </span>
                  <span role="cell">
                    <span
                      className={statusClassName(reservation.status)}
                      aria-label={`Reservation status ${reservation.status}`}
                    >
                      {reservation.status}
                    </span>
                  </span>
                  <span role="cell">{reservation.customerNotification?.message || 'No updates'}</span>
                  <span role="cell">
                    <button
                      type="button"
                      onClick={() => setSelectedReservation(reservation)}
                      className="text-lg font-semibold text-[#016630]"
                      aria-label={`View details for reservation on ${formatDate(reservation.date)}`}
                    >
                      View
                    </button>
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-xl text-stone-700" role="status">
                You do not have any reservations yet.
              </div>
            )}
          </div>
        </section>

        {selectedReservation && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/45 px-4 py-8">
            <section
              className="admin-panel max-h-[90vh] w-full max-w-3xl overflow-auto"
              aria-labelledby="dashboard-reservation-details-title"
            >
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2
                  id="dashboard-reservation-details-title"
                  className="font-serif text-3xl font-semibold text-stone-950"
                >
                  Reservation Details
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedReservation(null)}
                  className="restaurant-button restaurant-button-secondary"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-4 text-lg text-stone-800 md:grid-cols-2">
                <p>
                  <strong>Date:</strong> {formatDate(selectedReservation.date)}
                </p>
                <p>
                  <strong>Time:</strong> {reservationTime(selectedReservation)}
                </p>
                <p>
                  <strong>Guests:</strong> {selectedReservation.guests}
                </p>
                <p>
                  <strong>Table:</strong>{' '}
                  {selectedReservation.table
                    ? `Table ${selectedReservation.table.tableNumber}`
                    : 'Not assigned'}
                </p>
                <p>
                  <strong>Status:</strong> {selectedReservation.status}
                </p>
                <p>
                  <strong>Table Preference:</strong>{' '}
                  {selectedReservation.tablePreference || 'None'}
                </p>
                <p className="md:col-span-2">
                  <strong>Special Requests:</strong> {selectedReservation.requests || 'None'}
                </p>
                <p className="md:col-span-2">
                  <strong>Notification:</strong>{' '}
                  {selectedReservation.customerNotification?.message || 'No updates'}
                </p>
              </div>
            </section>
          </div>
        )}

        <form onSubmit={handleSubmit} className="restaurant-card mt-12 grid gap-5 p-8 md:grid-cols-2">
          <h2 className="font-serif text-3xl text-stone-950 md:col-span-2">Your Profile</h2>
          <p className="text-lg text-stone-700 md:col-span-2">
            Update your personal details below.
          </p>
          <label className="restaurant-field">
            <span>Name</span>
            <input
              type="text"
              placeholder="Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </label>
          <label className="restaurant-field">
            <span>Email</span>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              readOnly
              className="opacity-75"
            />
          </label>
          <label className="restaurant-field">
            <span>Phone</span>
            <input
              type="tel"
              placeholder="Phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </label>

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

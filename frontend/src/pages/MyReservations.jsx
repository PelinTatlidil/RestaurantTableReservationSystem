import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

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

const MyReservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadReservations = async () => {
      setLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const response = await axiosInstance.get('/api/reservations/my', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setReservations(response.data);
      } catch (error) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to fetch reservations.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [user]);

  return (
    <main className="restaurant-page px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="font-serif text-5xl font-semibold text-stone-950">My Reservations</h1>
          <p className="mt-4 text-xl text-stone-700">
            Track your booking details and reservation status.
          </p>
        </div>

        {message.text && (
          <p
            className={
              message.type === 'error'
                ? 'restaurant-message-error mb-6'
                : 'restaurant-message-success mb-6'
            }
          >
            {message.text}
          </p>
        )}

        <div className="restaurant-admin-table">
          <div className="reservation-admin-row restaurant-admin-head">
            <span>Date</span>
            <span>Time</span>
            <span>Guests</span>
            <span>Table</span>
            <span>Status</span>
            <span>Notification</span>
            <span></span>
          </div>

          {loading ? (
            <div className="p-6 text-xl text-stone-700">Loading reservations...</div>
          ) : reservations.length ? (
            reservations.map((reservation) => (
              <div key={reservation._id} className="reservation-admin-row">
                <span>{formatDate(reservation.date)}</span>
                <span>{reservationTime(reservation)}</span>
                <span>{reservation.guests}</span>
                <span>
                  {reservation.table
                    ? `Table ${reservation.table.tableNumber}`
                    : 'Not assigned'}
                </span>
                <span>
                  <span className={statusClassName(reservation.status)}>
                    {reservation.status}
                  </span>
                </span>
                <span>{reservation.customerNotification?.message || 'No updates'}</span>
                <span></span>
              </div>
            ))
          ) : (
            <div className="p-6 text-xl text-stone-700">No reservations found.</div>
          )}
        </div>
      </section>
    </main>
  );
};

export default MyReservations;

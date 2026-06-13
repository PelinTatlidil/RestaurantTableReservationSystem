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

const getReservationDate = (reservation) => (reservation.date ? reservation.date.slice(0, 10) : '');

const getReservationTimeSlotId = (reservation) =>
  typeof reservation.timeSlot === 'string' ? reservation.timeSlot : reservation.timeSlot?._id;

const MyReservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [editingReservation, setEditingReservation] = useState(null);
  const [cancelConfirmation, setCancelConfirmation] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    timeSlotId: '',
    guests: '',
    tablePreference: '',
    requests: '',
  });
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

  const loadTimeSlots = async () => {
    if (timeSlots.length) {
      return;
    }

    const response = await axiosInstance.get('/api/time-slots/available', {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setTimeSlots(response.data);
  };

  const openEditForm = async (reservation) => {
    setMessage({ type: '', text: '' });

    try {
      await loadTimeSlots();
      setEditingReservation(reservation);
      setFormData({
        date: getReservationDate(reservation),
        timeSlotId: getReservationTimeSlotId(reservation) || '',
        guests: reservation.guests ? String(reservation.guests) : '',
        tablePreference: reservation.tablePreference || '',
        requests: reservation.requests || '',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load available time slots.',
      });
    }
  };

  const closeEditForm = () => {
    setEditingReservation(null);
    setFormData({
      date: '',
      timeSlotId: '',
      guests: '',
      tablePreference: '',
      requests: '',
    });
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.date) {
      setMessage({ type: 'error', text: 'Reservation date is required.' });
      return;
    }

    if (!formData.timeSlotId) {
      setMessage({ type: 'error', text: 'Time slot is required.' });
      return;
    }

    const guestCount = Number(formData.guests);
    if (!Number.isInteger(guestCount) || guestCount < 1) {
      setMessage({ type: 'error', text: 'Guests must be a positive whole number.' });
      return;
    }

    try {
      const response = await axiosInstance.put(
        `/api/reservations/${editingReservation._id}`,
        {
          date: formData.date,
          timeSlotId: formData.timeSlotId,
          guests: guestCount,
          tablePreference: formData.tablePreference,
          requests: formData.requests,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      setReservations((currentReservations) =>
        currentReservations.map((reservation) =>
          reservation._id === response.data.reservation._id
            ? response.data.reservation
            : reservation
        )
      );
      closeEditForm();
      setMessage({
        type: 'success',
        text: response.data.message || 'Reservation updated successfully.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Reservation could not be updated.',
      });
    }
  };

  const confirmCancel = async () => {
    if (!cancelConfirmation) {
      return;
    }

    try {
      const response = await axiosInstance.patch(
        `/api/reservations/${cancelConfirmation._id}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      setReservations((currentReservations) =>
        currentReservations.map((reservation) =>
          reservation._id === response.data.reservation._id
            ? response.data.reservation
            : reservation
        )
      );
      setCancelConfirmation(null);
      setMessage({
        type: 'success',
        text: response.data.message || 'Reservation cancelled successfully.',
      });
    } catch (error) {
      setCancelConfirmation(null);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Reservation could not be cancelled.',
      });
    }
  };

  return (
    <main className="restaurant-page px-6 py-10">
      <section className="mx-auto max-w-6xl" aria-labelledby="my-reservations-title">
        <div className="mb-8">
          <h1
            id="my-reservations-title"
            className="font-serif text-5xl font-semibold text-stone-950"
          >
            My Reservations
          </h1>
          <p className="mt-4 text-xl text-stone-700">
            Track your booking details and reservation status.
          </p>
        </div>

        {message.text && (
          <p
            role="alert"
            className={
              message.type === 'error'
                ? 'restaurant-message-error mb-6'
                : 'restaurant-message-success mb-6'
            }
          >
            {message.text}
          </p>
        )}

        <div className="restaurant-admin-table" role="table" aria-label="My reservation list">
          <div className="reservation-admin-row restaurant-admin-head" role="row">
            <span role="columnheader">Date</span>
            <span role="columnheader">Time</span>
            <span role="columnheader">Guests</span>
            <span role="columnheader">Table</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Notification</span>
            <span role="columnheader">Actions</span>
          </div>

          {loading ? (
            <div className="p-6 text-xl text-stone-700" role="status">
              Loading reservations...
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
                <span role="cell" className="flex flex-wrap gap-2">
                  {reservation.status === 'Cancelled' ? (
                    <span>Cancelled</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditForm(reservation)}
                        className="restaurant-icon-button"
                        aria-label={`Update reservation on ${formatDate(reservation.date)}`}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelConfirmation(reservation)}
                        className="restaurant-icon-button restaurant-danger-button"
                        aria-label={`Cancel reservation on ${formatDate(reservation.date)}`}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-xl text-stone-700" role="status">
              You do not have any reservations yet.
            </div>
          )}
        </div>

        {editingReservation && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/45 px-4 py-8">
            <section className="admin-panel max-h-[90vh] w-full max-w-4xl overflow-auto">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-serif text-3xl font-semibold text-stone-950">
                  Update Reservation
                </h2>
                <button
                  type="button"
                  onClick={closeEditForm}
                  className="restaurant-button restaurant-button-secondary"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="grid gap-5 md:grid-cols-2">
                <label className="restaurant-field">
                  <span>Date</span>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(event) => setFormData({ ...formData, date: event.target.value })}
                  />
                </label>
                <label className="restaurant-field">
                  <span>Time Slot</span>
                  <select
                    value={formData.timeSlotId}
                    onChange={(event) =>
                      setFormData({ ...formData, timeSlotId: event.target.value })
                    }
                  >
                    <option value="">Select a time slot</option>
                    {timeSlots.map((slot) => (
                      <option key={slot._id} value={slot._id}>
                        {slot.startTime} - {slot.endTime}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="restaurant-field">
                  <span>Guests</span>
                  <input
                    type="number"
                    min="1"
                    value={formData.guests}
                    onChange={(event) => setFormData({ ...formData, guests: event.target.value })}
                  />
                </label>
                <label className="restaurant-field">
                  <span>Table Preference</span>
                  <input
                    type="text"
                    value={formData.tablePreference}
                    onChange={(event) =>
                      setFormData({ ...formData, tablePreference: event.target.value })
                    }
                  />
                </label>
                <label className="restaurant-field md:col-span-2">
                  <span>Special Requests</span>
                  <textarea
                    value={formData.requests}
                    onChange={(event) =>
                      setFormData({ ...formData, requests: event.target.value })
                    }
                  />
                </label>
                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button type="submit" className="restaurant-button">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={closeEditForm}
                    className="restaurant-button restaurant-button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {cancelConfirmation && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/45 px-4 py-8">
            <section className="admin-panel w-full max-w-xl">
              <h2 className="font-serif text-3xl font-semibold text-stone-950">
                Cancel Reservation
              </h2>
              <p className="mt-4 text-lg text-stone-800">
                Cancel your reservation on{' '}
                <strong>{formatDate(cancelConfirmation.date)}</strong>?
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCancelConfirmation(null)}
                  className="restaurant-button restaurant-button-secondary"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  onClick={confirmCancel}
                  className="restaurant-button restaurant-danger-button"
                >
                  Cancel Reservation
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
};

export default MyReservations;

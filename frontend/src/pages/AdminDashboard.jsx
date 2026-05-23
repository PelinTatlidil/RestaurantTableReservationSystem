import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const statusClass = {
  Confirmed: 'restaurant-status',
  Completed: 'restaurant-status',
  Pending: 'restaurant-status restaurant-status-pending',
  Canceled: 'restaurant-status restaurant-status-canceled',
  Cancelled: 'restaurant-status restaurant-status-canceled',
  'No-show': 'restaurant-status restaurant-status-canceled',
};

const managementLinks = [
  { to: '/admin/reservations', label: 'Reservations', description: 'Create and manage bookings' },
  { to: '/tasks', label: 'Tables', description: 'Maintain table capacity' },
  { to: '/admin/time-slots', label: 'Time Slots', description: 'Set booking windows' },
  { to: '/admin/users', label: 'Users', description: 'Review customer accounts' },
  { to: '/admin/restaurant-info', label: 'Restaurant Info', description: 'Update public details' },
];

const formatReservationDateTime = (reservation) => {
  const date = reservation.date
    ? new Intl.DateTimeFormat('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(reservation.date))
    : 'No date';

  if (reservation.timeSlot) {
    return `${date}, ${reservation.timeSlot.startTime} - ${reservation.timeSlot.endTime}`;
  }

  return `${date}, Not assigned`;
};

const reservationCustomerName = (reservation) =>
  reservation.customer?.name || reservation.customerName || 'Unknown customer';

const reservationId = (reservation) =>
  reservation._id ? `R${reservation._id.slice(-7).toUpperCase()}` : 'Reservation';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const authConfig = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const [reservationResponse, tableResponse, timeSlotResponse] = await Promise.all([
          axiosInstance.get('/api/reservations/admin', authConfig),
          axiosInstance.get('/api/tables', authConfig),
          axiosInstance.get('/api/time-slots', authConfig),
        ]);

        setReservations(reservationResponse.data);
        setTables(tableResponse.data);
        setTimeSlots(timeSlotResponse.data);
      } catch (error) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to load dashboard data.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Total Reservations',
        value: reservations.length,
        period: 'All time',
        accent: 'bg-[#dff7d4] text-[#016630]',
      },
      {
        label: 'Confirmed Reservations',
        value: reservations.filter((reservation) => reservation.status === 'Confirmed').length,
        period: 'All time',
        accent: 'bg-[#dfeedd] text-[#386b34]',
      },
      {
        label: 'Cancelled Reservations',
        value: reservations.filter((reservation) =>
          ['Cancelled', 'Canceled'].includes(reservation.status)
        ).length,
        period: 'All time',
        accent: 'bg-[#f0dfdc] text-[#9b3d32]',
      },
      {
        label: 'Available Tables',
        value: tables.filter((table) => table.isAvailable).length,
        period: 'All time',
        accent: 'bg-[#e4dfef] text-[#5a4d7c]',
      },
      {
        label: 'Open Time Slots',
        value: timeSlots.filter((timeSlot) => timeSlot.isAvailable).length,
        period: 'All time',
        accent: 'bg-[#e5f4f7] text-[#12616d]',
      },
    ],
    [reservations, tables, timeSlots]
  );

  const recentReservations = useMemo(
    () =>
      [...reservations]
        .sort((first, second) => new Date(second.date) - new Date(first.date))
        .slice(0, 4),
    [reservations]
  );

  return (
    <main className="restaurant-admin-page px-6 py-10">
      <section className="mx-auto max-w-[1376px]">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-5xl font-semibold text-stone-950">
              Admin Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-xl text-stone-700">
              Monitor reservation activity and jump into daily management tasks.
            </p>
          </div>
          <Link to="/admin/reservations" className="restaurant-button w-full sm:w-[230px]">
            Manage Reservations
          </Link>
        </div>

        {message.text && (
          <p className="restaurant-message-error mb-6">{message.text}</p>
        )}

        <section className="admin-panel mb-8" aria-labelledby="management-title">
          <div className="mb-5 flex flex-col gap-2">
            <h2 id="management-title" className="font-serif text-3xl font-semibold text-stone-950">
              Management
            </h2>
            <p className="text-lg text-stone-700">
              Open the area you need to manage.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {managementLinks.map((item) => (
              <Link key={item.to} to={item.to} className="admin-action-card">
                <span className="text-xl font-semibold text-stone-950">{item.label}</span>
                <span className="mt-2 text-base text-stone-700">{item.description}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5" aria-label="Dashboard summary">
          {stats.map((stat) => (
            <article key={stat.label} className="admin-stat-card">
              <div className={`admin-stat-accent ${stat.accent}`} aria-hidden="true" />
              <p className="text-base font-semibold text-stone-700">{stat.label}</p>
              <p className="mt-3 text-4xl font-semibold text-stone-950">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-stone-600">{stat.period}</p>
            </article>
          ))}
        </section>

        <article className="admin-panel mt-8">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-stone-950">
                Recent Reservations
              </h2>
              <p className="mt-2 text-lg text-stone-700">
                Latest booking activity across the restaurant.
              </p>
            </div>
            <Link to="/admin/reservations" className="text-lg font-semibold text-[#016630]">
              View all reservations
            </Link>
          </div>

          <div className="admin-dashboard-table">
            <div className="admin-dashboard-row admin-dashboard-head">
              <span>Reservation ID</span>
              <span>Customer</span>
              <span>Date and Time</span>
              <span>Guests</span>
              <span>Status</span>
            </div>

            {loading ? (
              <div className="p-6 text-xl text-stone-700">Loading reservations...</div>
            ) : recentReservations.length ? (
              recentReservations.map((reservation) => (
                <div key={reservation._id} className="admin-dashboard-row">
                  <span className="font-semibold text-stone-900">{reservationId(reservation)}</span>
                  <span>{reservationCustomerName(reservation)}</span>
                  <span>{formatReservationDateTime(reservation)}</span>
                  <span>{reservation.guests}</span>
                  <span>
                    <span className={statusClass[reservation.status] || 'restaurant-status'}>
                      {reservation.status}
                    </span>
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-xl text-stone-700">No reservations have been created yet.</div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
};

export default AdminDashboard;

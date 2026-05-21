import { Link } from 'react-router-dom';

const stats = [
  {
    label: 'Total Reservations',
    value: '128',
    period: 'All time',
    accent: 'bg-[#dff7d4] text-[#016630]',
    icon: 'Cal',
  },
  {
    label: 'Confirmed Reservations',
    value: '96',
    period: 'All time',
    accent: 'bg-[#dfeedd] text-[#386b34]',
    icon: 'Ok',
  },
  {
    label: 'Canceled Reservations',
    value: '32',
    period: 'All time',
    accent: 'bg-[#f0dfdc] text-[#9b3d32]',
    icon: 'No',
  },
  {
    label: 'Available Tables',
    value: '14',
    period: 'All time',
    accent: 'bg-[#e4dfef] text-[#5a4d7c]',
    icon: 'Tbl',
  },
];

const reservations = [
  {
    id: 'R2345678',
    customer: 'Pelin Tatlidil',
    dateTime: '31 May 2026, 7:00 PM',
    guests: '4',
    table: 'Window seat',
    status: 'Confirmed',
  },
  {
    id: 'R2345679',
    customer: 'Aria Morgan',
    dateTime: '01 Jun 2026, 6:30 PM',
    guests: '2',
    table: 'Indoor',
    status: 'Confirmed',
  },
  {
    id: 'R2345680',
    customer: 'Noah Chen',
    dateTime: '02 Jun 2026, 8:15 PM',
    guests: '6',
    table: 'Indoor',
    status: 'Canceled',
  },
  {
    id: 'R2345681',
    customer: 'Maya Singh',
    dateTime: '04 Jun 2026, 7:45 PM',
    guests: '3',
    table: 'Patio',
    status: 'Pending',
  },
];

const statusClass = {
  Confirmed: 'restaurant-status',
  Pending: 'restaurant-status restaurant-status-pending',
  Canceled: 'restaurant-status restaurant-status-canceled',
};

const AdminDashboard = () => {
  return (
    <main className="restaurant-admin-page px-6 py-10">
      <section className="mx-auto max-w-[1376px]">
        <div className="mb-6">
          <h1 className="font-serif text-5xl font-semibold text-stone-950">
            Admin Dashboard
          </h1>
        </div>

        <section className="grid gap-8 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="admin-stat-card">
              <div className={`admin-stat-icon ${stat.accent}`} aria-hidden="true">
                {stat.icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold leading-snug text-stone-900">
                  {stat.label}
                </h2>
                <p className="mt-3 text-4xl font-semibold text-stone-950">
                  {stat.value}
                </p>
                <p className="mt-2 text-base text-stone-600">{stat.period}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,963px)_1fr]">
          <article className="admin-panel">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-serif text-3xl font-semibold text-stone-950">
                Recent Reservations
              </h2>
              <Link to="/my-reservations" className="text-lg font-semibold text-[#016630]">
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

              {reservations.map((reservation) => (
                <div key={reservation.id} className="admin-dashboard-row">
                  <span>{reservation.id}</span>
                  <span>{reservation.customer}</span>
                  <span>{reservation.dateTime}</span>
                  <span>{reservation.guests}</span>
                  <span>
                    <span className={statusClass[reservation.status]}>
                      {reservation.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </article>

          <aside className="admin-panel admin-actions">
            <h2 className="font-serif text-3xl font-semibold text-stone-950">
              Quick Actions
            </h2>

            <Link to="/tasks" className="restaurant-button">
              Manage Tables
            </Link>

            <Link to="/my-reservations" className="restaurant-button restaurant-button-secondary">
              Manage Reservations
            </Link>

            <button type="button" className="restaurant-button restaurant-button-secondary">
              Manage Users
            </button>

            <button type="button" className="restaurant-button restaurant-button-secondary">
              Restaurant Info
            </button>
          </aside>
        </section>
      </section>
    </main>
  );
};

export default AdminDashboard;

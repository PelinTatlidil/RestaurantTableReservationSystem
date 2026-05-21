<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
const reservations = [
  {
    id: 1,
    date: '31 May 2026',
    time: '7:00 PM',
    guests: 4,
    status: 'Confirmed',
  },
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
import './MyReservations.css';

const reservations = [
  {
    id: 1,
    date: 'May 24, 2026',
    time: '7:00 PM',
    guests: 2,
    table: 'A4',
    status: 'Confirmed',
  },
  {
    id: 2,
    date: 'May 28, 2026',
    time: '8:30 PM',
    guests: 4,
    table: 'B2',
    status: 'Pending',
  },
  {
    id: 3,
    date: 'June 2, 2026',
    time: '6:15 PM',
    guests: 6,
    table: 'C1',
    status: 'Completed',
  },
];

const statusClassMap = {
  Confirmed: 'status-confirmed',
  Pending: 'status-pending',
  Completed: 'status-completed',
};

const detailsConfig = [
  { label: 'Date', key: 'date' },
  { label: 'Time', key: 'time' },
  { label: 'Guests', key: 'guests' },
  { label: 'Table', key: 'table' },
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
];

const MyReservations = () => {
  return (
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    <main className="restaurant-page px-6 py-20">
      <section className="mx-auto max-w-7xl">
        <div className="mb-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-6xl font-semibold text-stone-950">My Reservations</h1>
            <p className="mt-4 text-xl text-stone-700">
              View, update or cancel your existing reservations.
            </p>
          </div>
          <a href="/make-reservation" className="restaurant-button w-full md:w-[337px]">
            Make Reservation
          </a>
        </div>

        <div className="restaurant-table-shell">
          <div className="restaurant-table-row restaurant-table-head">
            <span>Date and Time</span>
            <span>Guests</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {reservations.map((reservation) => (
            <div key={reservation.id} className="restaurant-table-row">
              <span>
                {reservation.date}, {reservation.time}
              </span>
              <span>{reservation.guests} guests</span>
              <span>
                <span className="restaurant-status">Confirmed</span>
              </span>
              <span className="flex flex-wrap gap-4">
                <button type="button" className="restaurant-small-button">
                  Update
                </button>
                <button type="button" className="restaurant-small-button restaurant-danger-button">
                  Cancel
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    <section className="my-reservations">
      <header className="my-reservations__header">
        <p className="my-reservations__eyebrow">Dining Dashboard</p>
        <h1>My Reservations</h1>
        <p className="my-reservations__subtitle">
          Review upcoming bookings, update reservation details, or cancel a table when your plans change.
        </p>
      </header>

      <div className="my-reservations__grid">
        {reservations.map((reservation) => (
          <article className="reservation-card" key={reservation.id}>
            <div className="reservation-card__top">
              <span className={`status-chip ${statusClassMap[reservation.status]}`}>{reservation.status}</span>
              <span className="reservation-card__id">#{reservation.id.toString().padStart(3, '0')}</span>
            </div>

            <dl className="reservation-card__details">
              {detailsConfig.map((detail) => (
                <div key={detail.key} className="reservation-card__row">
                  <dt>{detail.label}</dt>
                  <dd>{reservation[detail.key]}</dd>
                </div>
              ))}
            </dl>

            <div className="reservation-card__actions">
              <button type="button" className="button button--secondary">
                Update
              </button>
              <button type="button" className="button button--danger">
                Cancel
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  );
};

export default MyReservations;

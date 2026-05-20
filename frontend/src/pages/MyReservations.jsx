const reservations = [
  {
    id: 1,
    date: '31 May 2026',
    time: '7:00 PM',
    guests: 4,
    status: 'Confirmed',
  },
];

const MyReservations = () => {
  return (
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
  );
};

export default MyReservations;

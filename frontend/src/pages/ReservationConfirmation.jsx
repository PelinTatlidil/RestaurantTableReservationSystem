import { Link, useLocation } from 'react-router-dom';

const DetailRow = ({ label, value }) => (
  <div className="grid gap-5 border-t border-stone-300 py-6 sm:grid-cols-[240px_1fr]">
    <p className="text-2xl font-semibold text-stone-900">{label}</p>
    <p className="text-2xl text-stone-700">{value}</p>
  </div>
);

const formatDate = (dateValue) => {
  if (!dateValue) {
    return 'Not provided';
  }

  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateValue));
};

const reservationTime = (reservation) => {
  if (reservation?.timeSlot) {
    return `${reservation.timeSlot.startTime} - ${reservation.timeSlot.endTime}`;
  }

  return 'Not assigned';
};

const reservationTable = (reservation) => {
  if (reservation?.table) {
    return `Table ${reservation.table.tableNumber} (${reservation.table.capacity} guests)`;
  }

  return 'Assigned by restaurant';
};

const ReservationConfirmation = () => {
  const { state } = useLocation();
  const reservation = state?.reservation;
  const confirmationMessage = state?.message || 'Your table has been booked successfully.';
  const reservationNumber = reservation?._id
    ? `R${reservation._id.slice(-7).toUpperCase()}`
    : 'Confirmed';

  return (
    <main className="restaurant-page px-6 py-16">
      <section className="mx-auto max-w-5xl">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full bg-emerald-100 text-5xl font-semibold text-emerald-700">
            OK
          </div>
          <h1 className="font-serif text-5xl font-semibold text-stone-950">
            Reservation Confirmed
          </h1>
          <p className="mt-4 text-xl text-stone-700">{confirmationMessage}</p>
        </div>

        <div className="mt-12">
          <DetailRow label="Reservation #" value={reservationNumber} />
          <DetailRow label="Date" value={formatDate(reservation?.date)} />
          <DetailRow label="Time" value={reservationTime(reservation)} />
          <DetailRow label="Number of Guests" value={`${reservation?.guests || 0} Guests`} />
          <DetailRow label="Assigned Table" value={reservationTable(reservation)} />
          <DetailRow label="Status" value={reservation?.status || 'Confirmed'} />
          <DetailRow label="Special Requests" value={reservation?.requests || 'None'} />
        </div>

        <div className="mt-10 grid gap-7 sm:grid-cols-2">
          <Link to="/my-reservations" className="restaurant-button">
            View Reservations
          </Link>
          <Link to="/" className="restaurant-button restaurant-button-secondary">
            Home
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ReservationConfirmation;

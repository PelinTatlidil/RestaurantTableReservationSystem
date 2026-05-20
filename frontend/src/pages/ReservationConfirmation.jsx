import { Link } from 'react-router-dom';

const DetailRow = ({ label, value }) => (
  <div className="grid gap-5 border-t border-stone-300 py-6 sm:grid-cols-[240px_1fr]">
    <p className="text-2xl font-semibold text-stone-900">{label}</p>
    <p className="text-2xl text-stone-700">{value}</p>
  </div>
);

const ReservationConfirmation = () => {
  return (
    <main className="restaurant-page px-6 py-16">
      <section className="mx-auto max-w-5xl">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full bg-emerald-100 text-5xl text-emerald-700">
            ✓
          </div>
          <h1 className="font-serif text-5xl font-semibold text-stone-950">
            Reservation Confirmed
          </h1>
          <p className="mt-4 text-xl text-stone-700">Your table has been booked successfully.</p>
        </div>

        <div className="mt-12">
          <DetailRow label="Reservation #" value="R2345678" />
          <DetailRow label="Date" value="Sunday, May 31, 2026" />
          <DetailRow label="Time" value="7:00 PM" />
          <DetailRow label="Number of Guests" value="4 Guests" />
          <DetailRow label="Special Requests" value="Anniversary celebration - window seat preferred" />
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

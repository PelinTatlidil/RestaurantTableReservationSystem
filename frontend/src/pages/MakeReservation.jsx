import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MakeReservation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    guests: '',
    tablePreference: '',
    requests: '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/reservation-confirmation');
  };

  return (
    <main className="restaurant-page px-6 py-14">
      <section className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="font-serif text-5xl font-semibold text-stone-950">Make a Reservation</h1>
          <p className="mt-4 text-xl text-stone-700">Fill in the details below to book your table</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-11 space-y-7">
          <div className="grid gap-8 md:grid-cols-2">
            <label className="restaurant-field">
              <span>Date</span>
              <input
                type="date"
                value={formData.date}
                onChange={(event) => setFormData({ ...formData, date: event.target.value })}
              />
            </label>
            <label className="restaurant-field">
              <span>Time</span>
              <input
                type="time"
                value={formData.time}
                onChange={(event) => setFormData({ ...formData, time: event.target.value })}
              />
            </label>
            <label className="restaurant-field">
              <span>Number of Guests</span>
              <input
                type="number"
                min="1"
                placeholder="4"
                value={formData.guests}
                onChange={(event) => setFormData({ ...formData, guests: event.target.value })}
              />
            </label>
            <label className="restaurant-field">
              <span>Table Preference (optional)</span>
              <input
                type="text"
                placeholder="Window seat"
                value={formData.tablePreference}
                onChange={(event) =>
                  setFormData({ ...formData, tablePreference: event.target.value })
                }
              />
            </label>
          </div>

          <label className="restaurant-field">
            <span>Special Requests (optional)</span>
            <textarea
              rows="4"
              placeholder="Enter any special requests..."
              value={formData.requests}
              onChange={(event) => setFormData({ ...formData, requests: event.target.value })}
            />
          </label>

          <div className="flex justify-end gap-7 pt-3">
            <button type="submit" className="restaurant-button w-[130px]">
              Submit
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="restaurant-button restaurant-button-secondary w-[130px]"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default MakeReservation;

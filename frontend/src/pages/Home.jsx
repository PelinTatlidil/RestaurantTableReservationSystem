import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';

const defaultRestaurantInfo = {
  name: 'Digi Meat Restaurant',
  address: {
    street: '123 Food Street',
    city: 'Brisbane',
    state: 'QLD',
    postcode: '4000',
  },
  contact: {
    phone: '0400 123 456',
    email: 'info@restaurant.com',
  },
  openingHours: ['Mon to Fri 11:00 AM to 10:00 PM', 'Sat to Sun 10:00 AM to 11:00 PM'],
  bookingPolicy:
    'Bookings are recommended. Please arrive within 15 minutes of your reservation time. For changes or cancellations, contact the restaurant before your booking.',
};

const InfoPanel = ({ title, lines }) => (
  <article className="restaurant-card flex min-h-[196px] items-center justify-center px-8 py-7 text-center">
    <div>
      <h2 className="font-serif text-2xl text-stone-950">{title}</h2>
      {lines.map((line) => (
        <p key={line} className="mt-2 text-lg text-stone-700">
          {line}
        </p>
      ))}
    </div>
  </article>
);

const Home = () => {
  const [restaurantInfo, setRestaurantInfo] = useState(defaultRestaurantInfo);

  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      try {
        const response = await axiosInstance.get('/api/restaurant-info');
        setRestaurantInfo(response.data);
      } catch (error) {
        setRestaurantInfo(defaultRestaurantInfo);
      }
    };

    fetchRestaurantInfo();
  }, []);

  const addressLines = [
    restaurantInfo.address.street,
    `${restaurantInfo.address.city}, ${restaurantInfo.address.state} ${restaurantInfo.address.postcode}`,
  ];
  const contactLines = [
    `Phone: ${restaurantInfo.contact.phone}`,
    `Email: ${restaurantInfo.contact.email}`,
  ];

  return (
    <main className="restaurant-page">
      <section className="mx-auto flex min-h-[640px] max-w-6xl flex-col items-center justify-center px-6 pb-16 pt-12 text-center">
        <div className="relative flex h-[550px] w-full max-w-[802px] items-center justify-center overflow-hidden">
          <div className="absolute h-[620px] w-[668px] rounded-full bg-[#e3d5c2]" />
          <div className="absolute top-[300px] h-[500px] w-[537px] rounded-full bg-[#f5efe7]" />
          <div className="restaurant-hero-image absolute top-[52px] h-[280px] w-[452px] max-w-[82vw] rounded-[6px]" />
          <div className="relative mt-[360px] max-w-3xl">
            <h1 className="font-serif text-5xl font-semibold text-stone-950 sm:text-6xl">
              {restaurantInfo.name}
            </h1>
            <p className="mt-4 text-xl text-stone-700">
              Welcome to {restaurantInfo.name}. Book your table online quickly and easily.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-20 md:grid-cols-2 xl:grid-cols-4">
        <InfoPanel
          title="Opening Hours"
          lines={restaurantInfo.openingHours}
        />
        <InfoPanel title="Address" lines={addressLines} />
        <InfoPanel title="Contact" lines={contactLines} />
        <InfoPanel
          title="Booking Policy"
          lines={[restaurantInfo.bookingPolicy]}
        />
      </section>
    </main>
  );
};

export default Home;

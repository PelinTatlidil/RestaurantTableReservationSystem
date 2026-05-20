import { Link } from 'react-router-dom';

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
  return (
    <main className="restaurant-page">
      <section className="mx-auto flex min-h-[640px] max-w-6xl flex-col items-center justify-center px-6 pb-16 pt-12 text-center">
        <div className="relative flex h-[550px] w-full max-w-[802px] items-center justify-center overflow-hidden">
          <div className="absolute h-[744px] w-[802px] rounded-full bg-[#e3d5c2]" />
          <div className="absolute top-[355px] h-[618px] w-[663px] rounded-full bg-[#f5efe7]" />
          <div className="restaurant-hero-image absolute top-[72px] h-[360px] w-[580px] max-w-[88vw] rounded-[6px]" />
          <div className="relative mt-[370px] max-w-3xl">
            <h1 className="font-serif text-5xl font-semibold text-stone-950 sm:text-6xl">
              Digi Meat Restaurant
            </h1>
            <p className="mt-4 text-xl text-stone-700">
              Welcome to Digi Meat Restaurant. Book your table online quickly and easily.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/make-reservation" className="restaurant-button">
                Make Reservation
              </Link>
              <Link to="/login" className="restaurant-button restaurant-button-secondary">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-20 md:grid-cols-3">
        <InfoPanel
          title="Opening Hours"
          lines={['Mon to Fri 11:00 AM to 10:00 PM', 'Sat to Sun 10:00 AM to 11:00 PM']}
        />
        <InfoPanel title="Address" lines={['123 Food Street', 'Brisbane, QLD 4000']} />
        <InfoPanel
          title="Contact"
          lines={['Phone: 0400 123 456', 'Email: info@restaurant.com']}
        />
      </section>
    </main>
  );
};

export default Home;

const AdminManagementPage = ({ title, description }) => {
  return (
    <main className="restaurant-admin-page px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="admin-panel">
          <h1 className="font-serif text-5xl font-semibold text-stone-950">{title}</h1>
          <p className="mt-4 text-xl text-stone-700">{description}</p>
        </div>
      </section>
    </main>
  );
};

export default AdminManagementPage;

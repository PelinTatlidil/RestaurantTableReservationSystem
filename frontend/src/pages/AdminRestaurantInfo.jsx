import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '',
  address: {
    street: '',
    city: '',
    state: '',
    postcode: '',
  },
  contact: {
    phone: '',
    email: '',
  },
  openingHoursText: '',
  bookingPolicy: '',
};

const restaurantInfoToForm = (restaurantInfo) => ({
  name: restaurantInfo.name || '',
  address: {
    street: restaurantInfo.address?.street || '',
    city: restaurantInfo.address?.city || '',
    state: restaurantInfo.address?.state || '',
    postcode: restaurantInfo.address?.postcode || '',
  },
  contact: {
    phone: restaurantInfo.contact?.phone || '',
    email: restaurantInfo.contact?.email || '',
  },
  openingHoursText: (restaurantInfo.openingHours || []).join('\n'),
  bookingPolicy: restaurantInfo.bookingPolicy || '',
});

const AdminRestaurantInfo = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const authConfig = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${user.token}` },
    }),
    [user.token]
  );

  useEffect(() => {
    const loadRestaurantInfo = async () => {
      setLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const response = await axiosInstance.get('/api/restaurant-info');
        setFormData(restaurantInfoToForm(response.data));
      } catch (error) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to fetch restaurant information.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadRestaurantInfo();
  }, []);

  const updateAddress = (field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      address: {
        ...currentFormData.address,
        [field]: value,
      },
    }));
  };

  const updateContact = (field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      contact: {
        ...currentFormData.contact,
        [field]: value,
      },
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Restaurant name is required.';
    if (!formData.address.street.trim()) return 'Street address is required.';
    if (!formData.address.city.trim()) return 'City is required.';
    if (!formData.address.state.trim()) return 'State is required.';
    if (!formData.address.postcode.trim()) return 'Postcode is required.';
    if (!formData.contact.phone.trim()) return 'Contact phone number is required.';
    if (!formData.contact.email.trim()) return 'Contact email is required.';
    if (!formData.openingHoursText.split('\n').some((line) => line.trim())) {
      return 'At least one opening hours line is required.';
    }
    if (!formData.bookingPolicy.trim()) return 'Booking policy is required.';

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    const validationMessage = validateForm();
    if (validationMessage) {
      setMessage({ type: 'error', text: validationMessage });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      address: {
        street: formData.address.street.trim(),
        city: formData.address.city.trim(),
        state: formData.address.state.trim(),
        postcode: formData.address.postcode.trim(),
      },
      contact: {
        phone: formData.contact.phone.trim(),
        email: formData.contact.email.trim(),
      },
      openingHours: formData.openingHoursText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      bookingPolicy: formData.bookingPolicy.trim(),
    };

    setSaving(true);

    try {
      const response = await axiosInstance.put('/api/restaurant-info', payload, authConfig);
      setFormData(restaurantInfoToForm(response.data));
      setMessage({ type: 'success', text: 'Restaurant information updated successfully.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update restaurant information.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="restaurant-admin-page px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="font-serif text-5xl font-semibold text-stone-950">
            Restaurant Information Management
          </h1>
          <p className="mt-4 text-xl text-stone-700">
            Maintain the details customers see on the restaurant home page.
          </p>
        </div>

        {message.text && (
          <p
            className={
              message.type === 'error'
                ? 'restaurant-message-error mb-6'
                : 'restaurant-message-success mb-6'
            }
          >
            {message.text}
          </p>
        )}

        {loading ? (
          <div className="admin-panel text-xl text-stone-700">
            Loading restaurant information...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="admin-panel grid gap-5 md:grid-cols-2">
            <label className="restaurant-field md:col-span-2">
              <span>Restaurant Name</span>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              />
            </label>

            <label className="restaurant-field">
              <span>Street Address</span>
              <input
                type="text"
                value={formData.address.street}
                onChange={(event) => updateAddress('street', event.target.value)}
              />
            </label>
            <label className="restaurant-field">
              <span>City</span>
              <input
                type="text"
                value={formData.address.city}
                onChange={(event) => updateAddress('city', event.target.value)}
              />
            </label>
            <label className="restaurant-field">
              <span>State</span>
              <input
                type="text"
                value={formData.address.state}
                onChange={(event) => updateAddress('state', event.target.value)}
              />
            </label>
            <label className="restaurant-field">
              <span>Postcode</span>
              <input
                type="text"
                value={formData.address.postcode}
                onChange={(event) => updateAddress('postcode', event.target.value)}
              />
            </label>
            <label className="restaurant-field">
              <span>Phone</span>
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(event) => updateContact('phone', event.target.value)}
              />
            </label>
            <label className="restaurant-field">
              <span>Email</span>
              <input
                type="email"
                value={formData.contact.email}
                onChange={(event) => updateContact('email', event.target.value)}
              />
            </label>
            <label className="restaurant-field md:col-span-2">
              <span>Opening Hours</span>
              <textarea
                value={formData.openingHoursText}
                onChange={(event) =>
                  setFormData({ ...formData, openingHoursText: event.target.value })
                }
              />
            </label>
            <label className="restaurant-field md:col-span-2">
              <span>Booking Policy</span>
              <textarea
                value={formData.bookingPolicy}
                onChange={(event) =>
                  setFormData({ ...formData, bookingPolicy: event.target.value })
                }
              />
            </label>
            <div className="md:col-span-2">
              <button type="submit" disabled={saving} className="restaurant-button">
                {saving ? 'Saving...' : 'Save Restaurant Information'}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
};

export default AdminRestaurantInfo;

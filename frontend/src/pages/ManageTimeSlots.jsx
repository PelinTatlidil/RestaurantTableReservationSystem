import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  startTime: '',
  endTime: '',
  isAvailable: true,
};

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const ManageTimeSlots = () => {
  const { user } = useAuth();
  const [timeSlots, setTimeSlots] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingSlot, setEditingSlot] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const authConfig = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  const loadTimeSlots = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axiosInstance.get('/api/time-slots', authConfig);
      setTimeSlots(response.data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to fetch time slots.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingSlot(null);
    setIsFormOpen(false);
  };

  const validateForm = () => {
    if (!formData.startTime || !formData.endTime) {
      return 'Start time and end time are required.';
    }

    if (formData.startTime >= formData.endTime) {
      return 'End time must be after start time.';
    }

    if (toMinutes(formData.endTime) - toMinutes(formData.startTime) !== 120) {
      return 'Reservation slots must be exactly 2 hours long.';
    }

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

    try {
      if (editingSlot) {
        const response = await axiosInstance.put(
          `/api/time-slots/${editingSlot._id}`,
          formData,
          authConfig
        );
        setTimeSlots((currentSlots) =>
          currentSlots.map((slot) => (slot._id === response.data._id ? response.data : slot))
        );
        setMessage({ type: 'success', text: 'Time slot updated successfully.' });
      } else {
        const response = await axiosInstance.post('/api/time-slots', formData, authConfig);
        setTimeSlots((currentSlots) =>
          [...currentSlots, response.data].sort((a, b) => a.startTime.localeCompare(b.startTime))
        );
        setMessage({ type: 'success', text: 'Time slot added successfully.' });
      }

      resetForm();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save time slot.',
      });
    }
  };

  const handleEdit = (timeSlot) => {
    setEditingSlot(timeSlot);
    setFormData({
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      isAvailable: timeSlot.isAvailable,
    });
    setIsFormOpen(true);
    setMessage({ type: '', text: '' });
  };

  const handleDelete = async (slotId) => {
    try {
      await axiosInstance.delete(`/api/time-slots/${slotId}`, authConfig);
      setTimeSlots((currentSlots) => currentSlots.filter((slot) => slot._id !== slotId));
      setMessage({ type: 'success', text: 'Time slot deleted successfully.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete time slot.',
      });
    }
  };

  return (
    <main className="restaurant-admin-page px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-5xl font-semibold text-stone-950">
              Manage Time Slots
            </h1>
            <p className="mt-4 text-xl text-stone-700">
              Add, view, edit, or remove reservation time slots.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(true);
              setEditingSlot(null);
              setFormData(emptyForm);
              setMessage({ type: '', text: '' });
            }}
            className="restaurant-button w-full md:w-[280px]"
          >
            Add Time Slot
          </button>
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

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="restaurant-card mb-8 grid gap-5 p-6 md:grid-cols-4">
            <label className="restaurant-field">
              <span>Start Time</span>
              <input
                type="time"
                value={formData.startTime}
                onChange={(event) => setFormData({ ...formData, startTime: event.target.value })}
              />
            </label>
            <label className="restaurant-field">
              <span>End Time</span>
              <input
                type="time"
                value={formData.endTime}
                onChange={(event) => setFormData({ ...formData, endTime: event.target.value })}
              />
            </label>
            <label className="flex min-h-[82px] items-center gap-3 text-base font-semibold text-stone-900">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(event) =>
                  setFormData({ ...formData, isAvailable: event.target.checked })
                }
                className="h-6 w-6"
              />
              <span>Available</span>
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <button type="submit" className="restaurant-button">
                {editingSlot ? 'Update Time Slot' : 'Create Time Slot'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="restaurant-button restaurant-button-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="restaurant-admin-table">
          <div className="time-slot-admin-row restaurant-admin-head">
            <span>Start Time</span>
            <span>End Time</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="p-6 text-xl text-stone-700">Loading time slots...</div>
          ) : timeSlots.length ? (
            timeSlots.map((timeSlot) => (
              <div key={timeSlot._id} className="time-slot-admin-row">
                <span>{timeSlot.startTime}</span>
                <span>{timeSlot.endTime}</span>
                <span className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(timeSlot)}
                    className="restaurant-icon-button"
                    aria-label={`Edit time slot ${timeSlot.startTime}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(timeSlot._id)}
                    className="restaurant-icon-button restaurant-danger-button"
                    aria-label={`Delete time slot ${timeSlot.startTime}`}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-xl text-stone-700">No time slots have been added yet.</div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ManageTimeSlots;

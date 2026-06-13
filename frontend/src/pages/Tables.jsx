import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  tableNumber: '',
  capacity: '',
  location: '',
  isAvailable: true,
};

const Tables = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingTable, setEditingTable] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const authConfig = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  const loadTables = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axiosInstance.get('/api/tables', authConfig);
      setTables(response.data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to fetch tables.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingTable(null);
    setIsFormOpen(false);
  };

  const validateForm = () => {
    const tableNumber = Number(formData.tableNumber);
    const capacity = Number(formData.capacity);

    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      return 'Table number must be a positive whole number.';
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      return 'Table capacity must be a positive whole number.';
    }

    if (!formData.location.trim()) {
      return 'Table location is required.';
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

    const payload = {
      tableNumber: Number(formData.tableNumber),
      capacity: Number(formData.capacity),
      location: formData.location.trim(),
      isAvailable: formData.isAvailable,
    };

    try {
      if (editingTable) {
        const response = await axiosInstance.put(
          `/api/tables/${editingTable._id}`,
          payload,
          authConfig
        );
        setTables((currentTables) =>
          currentTables.map((table) => (table._id === response.data._id ? response.data : table))
        );
        setMessage({ type: 'success', text: 'Table updated successfully.' });
      } else {
        const response = await axiosInstance.post('/api/tables', payload, authConfig);
        setTables((currentTables) =>
          [...currentTables, response.data].sort((a, b) => a.tableNumber - b.tableNumber)
        );
        setMessage({ type: 'success', text: 'Table added successfully.' });
      }

      resetForm();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save table.',
      });
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: String(table.tableNumber),
      capacity: String(table.capacity),
      location: table.location,
      isAvailable: table.isAvailable,
    });
    setIsFormOpen(true);
    setMessage({ type: '', text: '' });
  };

  const handleDelete = async (tableId) => {
    try {
      await axiosInstance.delete(`/api/tables/${tableId}`, authConfig);
      setTables((currentTables) => currentTables.filter((table) => table._id !== tableId));
      setMessage({ type: 'success', text: 'Table deleted successfully.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete table.',
      });
    }
  };

  return (
    <main className="restaurant-page px-6 py-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-5xl font-semibold text-stone-950">Manage Tables</h1>
            <p className="mt-4 text-xl text-stone-700">Add, view, edit or delete restaurant tables</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(true);
              setEditingTable(null);
              setFormData(emptyForm);
              setMessage({ type: '', text: '' });
            }}
            className="restaurant-button w-full md:w-[323px]"
          >
            Add Table
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
          <form onSubmit={handleSubmit} className="restaurant-card mb-8 grid gap-5 p-6 md:grid-cols-5">
            <input
              type="number"
              min="1"
              placeholder="Table Number"
              value={formData.tableNumber}
              onChange={(event) => setFormData({ ...formData, tableNumber: event.target.value })}
              className="restaurant-input"
            />
            <input
              type="number"
              min="1"
              placeholder="Capacity"
              value={formData.capacity}
              onChange={(event) => setFormData({ ...formData, capacity: event.target.value })}
              className="restaurant-input"
            />
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(event) => setFormData({ ...formData, location: event.target.value })}
              className="restaurant-input"
            />
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
                {editingTable ? 'Update Table' : 'Create Table'}
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
          <div className="table-admin-row restaurant-admin-head">
            <span>Table Number</span>
            <span>Capacity</span>
            <span>Location</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="p-6 text-xl text-stone-700">Loading tables...</div>
          ) : tables.length ? (
            tables.map((table) => (
              <div key={table._id} className="table-admin-row">
                <span>{table.tableNumber}</span>
                <span>{table.capacity}</span>
                <span>{table.location}</span>
                <span className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(table)}
                    className="restaurant-icon-button"
                    aria-label={`Edit table ${table.tableNumber}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(table._id)}
                    className="restaurant-icon-button restaurant-danger-button"
                    aria-label={`Delete table ${table.tableNumber}`}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-xl text-stone-700">No tables have been added yet.</div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Tables;

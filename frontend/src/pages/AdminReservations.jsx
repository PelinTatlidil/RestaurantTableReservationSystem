import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  date: '',
  timeSlot: '',
  table: '',
  guests: '',
  status: 'Pending',
  tablePreference: '',
  requests: '',
};

const reservationStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'No-show'];

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateValue));

const reservationTime = (reservation) => {
  if (reservation.timeSlot) {
    return `${reservation.timeSlot.startTime} - ${reservation.timeSlot.endTime}`;
  }

  return reservation.time || 'Not assigned';
};

const reservedStatuses = ['Pending', 'Confirmed'];

const getReservationDate = (reservation) => (reservation.date ? reservation.date.slice(0, 10) : '');

const getReservationTableId = (reservation) =>
  typeof reservation.table === 'string' ? reservation.table : reservation.table?._id || reservation.table?.id;

const getReservationTimeSlotId = (reservation) =>
  typeof reservation.timeSlot === 'string'
    ? reservation.timeSlot
    : reservation.timeSlot?._id || reservation.timeSlot?.id;

const reservationToFormData = (reservation) => ({
  customerName: reservation.customer?.name || reservation.customerName || '',
  customerEmail: reservation.customer?.email || reservation.customerEmail || '',
  customerPhone: reservation.customer?.phone || reservation.customerPhone || '',
  date: getReservationDate(reservation),
  timeSlot: getReservationTimeSlotId(reservation) || '',
  table: getReservationTableId(reservation) || '',
  guests: reservation.guests ? String(reservation.guests) : '',
  status: reservation.isDeleted ? 'Deleted' : reservation.status || 'Pending',
  tablePreference: reservation.tablePreference || '',
  requests: reservation.requests || '',
});

const getReservationErrorMessage = (error) => {
  const apiMessage = error.response?.data?.message;

  if (apiMessage) {
    return apiMessage;
  }

  if (error.response?.status === 404) {
    return 'Reservation API was not found. Restart the backend server so the latest reservation routes are loaded.';
  }

  if (error.response?.status) {
    return `Reservation could not be saved. Server returned status ${error.response.status}.`;
  }

  if (error.request) {
    return 'Reservation could not be saved because the server did not respond.';
  }

  return 'Reservation could not be saved. Please check the details and try again.';
};

const statusClassName = (status) => {
  if (status === 'Deleted') {
    return 'restaurant-status restaurant-status-canceled';
  }

  if (status === 'Confirmed' || status === 'Completed') {
    return 'restaurant-status';
  }

  if (status === 'Pending') {
    return 'restaurant-status restaurant-status-pending';
  }

  return 'restaurant-status restaurant-status-canceled';
};

const displayStatus = (reservation) => (reservation.isDeleted ? 'Deleted' : reservation.status);

const AdminReservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const authConfig = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  const bookedTableIds = useMemo(() => {
    if (!formData.date || !formData.timeSlot) {
      return new Set();
    }

    return new Set(
      reservations
        .filter(
          (reservation) =>
            reservation._id !== editingReservation?._id &&
            !reservation.isDeleted &&
            reservedStatuses.includes(reservation.status) &&
            getReservationDate(reservation) === formData.date &&
            getReservationTimeSlotId(reservation) === formData.timeSlot
        )
        .map(getReservationTableId)
        .filter(Boolean)
    );
  }, [editingReservation, formData.date, formData.timeSlot, reservations]);

  const availableTables = tables.filter(
    (table) =>
      (table.isAvailable && !bookedTableIds.has(table._id)) ||
      (editingReservation && table._id === formData.table)
  );
  const availableTimeSlots = timeSlots.filter((timeSlot) => timeSlot.isAvailable);
  const timeSlotOptions = useMemo(() => {
    if (!editingReservation || !formData.timeSlot) {
      return availableTimeSlots;
    }

    const hasCurrentTimeSlot = availableTimeSlots.some(
      (timeSlot) => timeSlot._id === formData.timeSlot
    );

    if (hasCurrentTimeSlot || typeof editingReservation.timeSlot !== 'object') {
      return availableTimeSlots;
    }

    return [editingReservation.timeSlot, ...availableTimeSlots];
  }, [availableTimeSlots, editingReservation, formData.timeSlot]);
  const tableOptions = useMemo(() => {
    if (!editingReservation || !formData.table) {
      return availableTables;
    }

    const hasCurrentTable = availableTables.some((table) => table._id === formData.table);

    if (hasCurrentTable || typeof editingReservation.table !== 'object') {
      return availableTables;
    }

    return [editingReservation.table, ...availableTables];
  }, [availableTables, editingReservation, formData.table]);
  const selectedTable = tables.find((table) => table._id === formData.table);

  useEffect(() => {
    const loadReservationData = async () => {
      setLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const [reservationResponse, tableResponse, timeSlotResponse] = await Promise.all([
          axiosInstance.get('/api/reservations/admin', authConfig),
          axiosInstance.get('/api/tables', authConfig),
          axiosInstance.get('/api/time-slots', authConfig),
        ]);
        setReservations(reservationResponse.data);
        setTables(tableResponse.data);
        setTimeSlots(timeSlotResponse.data);
      } catch (error) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to fetch reservation data.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadReservationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReservations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const customerName = reservation.customer?.name || '';
      const customerEmail = reservation.customer?.email || reservation.customerEmail || '';
      const storedCustomerName = reservation.customerName || '';
      const reservationDate = reservation.date ? reservation.date.slice(0, 10) : '';
      const shownStatus = displayStatus(reservation);
      const matchesSearch =
        !normalizedSearch ||
        customerName.toLowerCase().includes(normalizedSearch) ||
        storedCustomerName.toLowerCase().includes(normalizedSearch) ||
        customerEmail.toLowerCase().includes(normalizedSearch) ||
        shownStatus.toLowerCase().includes(normalizedSearch);
      const matchesDate = !dateFilter || reservationDate === dateFilter;
      const matchesStatus = !statusFilter || shownStatus === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [dateFilter, reservations, searchTerm, statusFilter]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingReservation(null);
    setIsFormOpen(false);
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      return 'Customer name is required.';
    }

    if (!formData.customerEmail.trim()) {
      return 'Customer email is required.';
    }

    if (!formData.customerPhone.trim()) {
      return 'Customer phone is required.';
    }

    if (!formData.date) {
      return 'Reservation date is required.';
    }

    if (!formData.timeSlot) {
      return 'Time slot is required.';
    }

    if (!formData.table) {
      return 'Table is required.';
    }

    const guestCount = Number(formData.guests);
    if (!Number.isInteger(guestCount) || guestCount < 1) {
      return 'Guests must be a positive whole number.';
    }

    if (selectedTable && selectedTable.capacity < guestCount) {
      return 'Guest count exceeds selected table capacity.';
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
      const payload = {
        ...formData,
        status: formData.status === 'Deleted' ? editingReservation?.status || 'Pending' : formData.status,
        guests: Number(formData.guests),
      };
      const response = editingReservation
        ? await axiosInstance.put(
            `/api/reservations/admin/${editingReservation._id}`,
            payload,
            authConfig
          )
        : await axiosInstance.post('/api/reservations/admin', payload, authConfig);

      setReservations((currentReservations) => {
        const nextReservations = editingReservation
          ? currentReservations.map((reservation) =>
              reservation._id === response.data._id ? response.data : reservation
            )
          : [...currentReservations, response.data];

        return nextReservations.sort((first, second) => new Date(first.date) - new Date(second.date));
      });
      resetForm();
      setSelectedReservation(null);
      setMessage({
        type: 'success',
        text: editingReservation
          ? 'Reservation updated successfully.'
          : 'Reservation created successfully.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: getReservationErrorMessage(error),
      });
    }
  };

  const handleEdit = (reservation) => {
    setEditingReservation(reservation);
    setFormData(reservationToFormData(reservation));
    setSelectedReservation(null);
    setIsFormOpen(true);
    setMessage({ type: '', text: '' });
  };

  const openReservationDetails = (reservation) => {
    setSelectedReservation(reservation);
  };

  const handleDelete = async (reservation) => {
    setDeleteConfirmation(reservation);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) {
      return;
    }

    try {
      const response = await axiosInstance.delete(
        `/api/reservations/admin/${deleteConfirmation._id}`,
        authConfig
      );
      setReservations((currentReservations) =>
        currentReservations.map((item) =>
          item._id === response.data.reservation._id ? response.data.reservation : item
        )
      );
      setSelectedReservation(null);
      setDeleteConfirmation(null);
      setMessage({ type: 'success', text: 'Reservation deleted successfully.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: getReservationErrorMessage(error),
      });
    }
  };

  const handleRecover = async (reservation) => {
    try {
      const response = await axiosInstance.patch(
        `/api/reservations/admin/${reservation._id}/recover`,
        {},
        authConfig
      );
      setReservations((currentReservations) =>
        currentReservations.map((item) =>
          item._id === response.data.reservation._id ? response.data.reservation : item
        )
      );
      setSelectedReservation(null);
      setMessage({ type: 'success', text: 'Reservation recovered successfully.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: getReservationErrorMessage(error),
      });
    }
  };

  return (
    <main className="restaurant-admin-page px-6 py-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-5xl font-semibold text-stone-950">
              Reservation Management
            </h1>
            <p className="mt-4 text-xl text-stone-700">
              Search, filter, create, and review customer booking details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(true);
              setEditingReservation(null);
              setFormData(emptyForm);
              setMessage({ type: '', text: '' });
            }}
            className="restaurant-button w-full md:w-[280px]"
          >
            Add Reservation
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
            {message.type === 'error' ? `Reason: ${message.text}` : message.text}
          </p>
        )}

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="restaurant-card mb-8 grid gap-5 p-6 lg:grid-cols-3">
            <label className="restaurant-field">
              <span>Customer Name</span>
              <input
                type="text"
                value={formData.customerName}
                onChange={(event) =>
                  setFormData({ ...formData, customerName: event.target.value })
                }
              />
            </label>
            <label className="restaurant-field">
              <span>Customer Email</span>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(event) =>
                  setFormData({ ...formData, customerEmail: event.target.value })
                }
              />
            </label>
            <label className="restaurant-field">
              <span>Customer Phone</span>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(event) =>
                  setFormData({ ...formData, customerPhone: event.target.value })
                }
              />
            </label>
            <label className="restaurant-field">
              <span>Date</span>
              <input
                type="date"
                value={formData.date}
                onChange={(event) =>
                  setFormData({ ...formData, date: event.target.value, table: '' })
                }
              />
            </label>
            <label className="restaurant-field">
              <span>Guests</span>
              <input
                type="number"
                min="1"
                value={formData.guests}
                onChange={(event) => setFormData({ ...formData, guests: event.target.value })}
              />
            </label>
            <label className="restaurant-field">
              <span>Time Slot</span>
              <select
                value={formData.timeSlot}
                onChange={(event) =>
                  setFormData({ ...formData, timeSlot: event.target.value, table: '' })
                }
              >
                <option value="">Select time slot</option>
                {timeSlotOptions.map((timeSlot) => (
                  <option key={timeSlot._id} value={timeSlot._id}>
                    {timeSlot.startTime} - {timeSlot.endTime}
                  </option>
                ))}
              </select>
            </label>
            <label className="restaurant-field">
              <span>Table</span>
              <select
                value={formData.table}
                onChange={(event) => setFormData({ ...formData, table: event.target.value })}
              >
                <option value="">Select table</option>
                {tableOptions.map((table) => (
                  <option key={table._id} value={table._id}>
                    Table {table.tableNumber} - {table.capacity} guests - {table.location}
                  </option>
                ))}
                {!tableOptions.length && formData.date && formData.timeSlot && (
                  <option value="" disabled>
                    No tables available for this date and time
                  </option>
                )}
              </select>
            </label>
            <label className="restaurant-field">
              <span>Status</span>
              <select
                value={formData.status}
                onChange={(event) => setFormData({ ...formData, status: event.target.value })}
              >
                {reservationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
                {editingReservation?.isDeleted && (
                  <option value="Deleted">Deleted</option>
                )}
              </select>
            </label>
            <label className="restaurant-field">
              <span>Table Preference</span>
              <input
                type="text"
                value={formData.tablePreference}
                onChange={(event) =>
                  setFormData({ ...formData, tablePreference: event.target.value })
                }
              />
            </label>
            <label className="restaurant-field lg:col-span-2">
              <span>Requests</span>
              <textarea
                value={formData.requests}
                onChange={(event) => setFormData({ ...formData, requests: event.target.value })}
              />
            </label>
            <div className="flex flex-wrap items-end gap-3 lg:col-span-3">
              <button type="submit" className="restaurant-button">
                {editingReservation ? 'Update Reservation' : 'Create Reservation'}
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

        <section className="admin-panel mb-8 grid gap-5 lg:grid-cols-[1fr_220px_220px]">
          <input
            type="search"
            placeholder="Search customer or status"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="restaurant-input"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="restaurant-input"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="restaurant-input"
          >
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
            <option value="No-show">No-show</option>
            <option value="Deleted">Deleted</option>
          </select>
        </section>

        <div className="restaurant-admin-table">
          <div className="reservation-admin-row restaurant-admin-head">
            <span>Customer</span>
            <span>Date</span>
            <span>Time</span>
            <span>Guests</span>
            <span>Table</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="p-6 text-xl text-stone-700">Loading reservations...</div>
          ) : filteredReservations.length ? (
            filteredReservations.map((reservation) => (
              <div
                key={reservation._id}
                onClick={() => openReservationDetails(reservation)}
                className="reservation-admin-row cursor-pointer"
              >
                <span>
                  {reservation.customer?.name || reservation.customerName || 'Unknown customer'}
                </span>
                <span>{formatDate(reservation.date)}</span>
                <span>{reservationTime(reservation)}</span>
                <span>{reservation.guests}</span>
                <span>
                  {reservation.table
                    ? `Table ${reservation.table.tableNumber}`
                    : 'Not assigned'}
                </span>
                <span>
                  <span
                    className={statusClassName(displayStatus(reservation))}
                  >
                    {displayStatus(reservation)}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  {reservation.isDeleted ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRecover(reservation);
                      }}
                      className="restaurant-icon-button"
                    >
                      Recover
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEdit(reservation);
                        }}
                        className="restaurant-icon-button"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(reservation);
                        }}
                        className="restaurant-icon-button restaurant-danger-button"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-xl text-stone-700">No reservations match your filters.</div>
          )}
        </div>

        {selectedReservation && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/45 px-4 py-8">
            <section className="admin-panel max-h-[90vh] w-full max-w-4xl overflow-auto">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-serif text-3xl font-semibold text-stone-950">
                  Reservation Details
                </h2>
                <div className="flex flex-wrap gap-3">
                  {selectedReservation.isDeleted ? (
                    <button
                      type="button"
                      onClick={() => handleRecover(selectedReservation)}
                      className="restaurant-button"
                    >
                      Recover
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEdit(selectedReservation)}
                        className="restaurant-button"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedReservation)}
                        className="restaurant-button restaurant-danger-button"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReservation(null);
                    }}
                    className="restaurant-button restaurant-button-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-5 text-xl text-stone-800 md:grid-cols-2">
                <p>
                  <strong>Customer:</strong>{' '}
                  {selectedReservation.customer?.name || selectedReservation.customerName}
                </p>
                <p>
                  <strong>Email:</strong>{' '}
                  {selectedReservation.customer?.email || selectedReservation.customerEmail}
                </p>
                <p>
                  <strong>Phone:</strong>{' '}
                  {selectedReservation.customer?.phone ||
                    selectedReservation.customerPhone ||
                    'Not provided'}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(selectedReservation.date)}
                </p>
                <p>
                  <strong>Time:</strong> {reservationTime(selectedReservation)}
                </p>
                <p>
                  <strong>Guests:</strong> {selectedReservation.guests}
                </p>
                <p>
                  <strong>Status:</strong> {displayStatus(selectedReservation)}
                </p>
                <p>
                  <strong>Table:</strong>{' '}
                  {selectedReservation.table
                    ? `Table ${selectedReservation.table.tableNumber}, ${selectedReservation.table.location}, capacity ${selectedReservation.table.capacity}`
                    : 'Not assigned'}
                </p>
                <p>
                  <strong>Table Preference:</strong>{' '}
                  {selectedReservation.tablePreference || 'No preference'}
                </p>
                <p>
                  <strong>Requests:</strong> {selectedReservation.requests || 'None'}
                </p>
              </div>
            </section>
          </div>
        )}

        {deleteConfirmation && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/45 px-4 py-8">
            <section className="admin-panel w-full max-w-xl">
              <h2 className="font-serif text-3xl font-semibold text-stone-950">
                Delete Reservation
              </h2>
              <p className="mt-4 text-lg text-stone-800">
                Delete reservation for{' '}
                <strong>
                  {deleteConfirmation.customer?.name ||
                    deleteConfirmation.customerName ||
                    'this customer'}
                </strong>
                ?
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="restaurant-button restaurant-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="restaurant-button restaurant-danger-button"
                >
                  Delete
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminReservations;

import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
];

const userRoleClassName = (role) =>
  role === 'admin'
    ? 'restaurant-status restaurant-status-pending'
    : 'restaurant-status';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: 'customer',
  university: '',
  address: '',
};

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const authConfig = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${user.token}` },
    }),
    [user.token]
  );

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const response = await axiosInstance.get('/api/users/admin', {
          ...authConfig,
          params: {
            page,
            limit: 10,
            search: searchTerm.trim(),
            sortBy,
            sortOrder,
          },
        });

        setUsers(response.data.users || []);
        setPagination({
          total: response.data.total || 0,
          pages: response.data.pages || 1,
          limit: response.data.limit || 10,
        });
      } catch (error) {
        setUsers([]);
        setPagination({ total: 0, pages: 1, limit: 10 });
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to fetch users.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [authConfig, page, searchTerm, sortBy, sortOrder]);

  const openUserDetails = async (userRecord) => {
    setDetailsLoading(true);
    setSelectedUser(userRecord);
    setMessage({ type: '', text: '' });

    try {
      const response = await axiosInstance.get(`/api/users/admin/${userRecord._id}`, authConfig);
      setSelectedUser(response.data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to fetch user details.',
      });
      setSelectedUser(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openEditForm = (userRecord) => {
    setEditingUser(userRecord);
    setFormData({
      name: userRecord.name || '',
      email: userRecord.email || '',
      phone: userRecord.phone || '',
      role: userRecord.role || 'customer',
      university: userRecord.university || '',
      address: userRecord.address || '',
    });
    setSelectedUser(null);
    setMessage({ type: '', text: '' });
  };

  const closeEditForm = () => {
    setEditingUser(null);
    setFormData(emptyForm);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Name is required.';
    }

    if (!formData.email.trim()) {
      return 'Email is required.';
    }

    if (!formData.phone.trim()) {
      return 'Phone number is required.';
    }

    if (!['customer', 'admin'].includes(formData.role)) {
      return 'User role is invalid.';
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
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      university: formData.university.trim(),
      address: formData.address.trim(),
    };

    try {
      const response = await axiosInstance.put(
        `/api/users/admin/${editingUser._id}`,
        payload,
        authConfig
      );
      setUsers((currentUsers) =>
        currentUsers.map((userRecord) =>
          userRecord._id === response.data._id ? response.data : userRecord
        )
      );
      setSelectedUser((currentUser) =>
        currentUser?._id === response.data._id ? response.data : currentUser
      );
      closeEditForm();
      setMessage({ type: 'success', text: 'User updated successfully.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update user.',
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/users/admin/${deleteConfirmation._id}`, authConfig);
      setUsers((currentUsers) =>
        currentUsers.filter((userRecord) => userRecord._id !== deleteConfirmation._id)
      );
      setPagination((currentPagination) => ({
        ...currentPagination,
        total: Math.max(currentPagination.total - 1, 0),
      }));
      setSelectedUser(null);
      setDeleteConfirmation(null);
      setMessage({ type: 'success', text: 'User deleted successfully.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete user.',
      });
      setDeleteConfirmation(null);
    }
  };

  const resetToFirstPage = (nextAction) => {
    setPage(1);
    nextAction();
  };

  const firstItem = pagination.total ? (page - 1) * pagination.limit + 1 : 0;
  const lastItem = Math.min(page * pagination.limit, pagination.total);

  return (
    <main className="restaurant-admin-page px-6 py-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="font-serif text-5xl font-semibold text-stone-950">
            User Management
          </h1>
          <p className="mt-4 text-xl text-stone-700">
            View registered customer and admin account details.
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

        <section className="admin-panel mb-8 grid gap-5 lg:grid-cols-[1fr_220px_180px]">
          <input
            type="search"
            placeholder="Search name, email, phone, or role"
            value={searchTerm}
            onChange={(event) =>
              resetToFirstPage(() => setSearchTerm(event.target.value))
            }
            className="restaurant-input"
          />
          <select
            value={sortBy}
            onChange={(event) => resetToFirstPage(() => setSortBy(event.target.value))}
            className="restaurant-input"
            aria-label="Sort users by"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Sort by {option.label}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(event) => resetToFirstPage(() => setSortOrder(event.target.value))}
            className="restaurant-input"
            aria-label="Sort order"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </section>

        <div className="restaurant-admin-table">
          <div className="user-admin-row restaurant-admin-head">
            <span>Name</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Role</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="p-6 text-xl text-stone-700">Loading users...</div>
          ) : users.length ? (
            users.map((userRecord) => (
              <div
                key={userRecord._id}
                onClick={() => openUserDetails(userRecord)}
                className="user-admin-row cursor-pointer"
              >
                <span>{userRecord.name}</span>
                <span>{userRecord.email}</span>
                <span>{userRecord.phone}</span>
                <span>
                  <span className={userRoleClassName(userRecord.role)}>{userRecord.role}</span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditForm(userRecord);
                    }}
                    className="restaurant-icon-button"
                    aria-label={`Edit ${userRecord.name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteConfirmation(userRecord);
                    }}
                    className="restaurant-icon-button restaurant-danger-button"
                    aria-label={`Delete ${userRecord.name}`}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-xl text-stone-700">
              {searchTerm.trim()
                ? 'No users match your search.'
                : 'No registered users were found.'}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-4 text-lg text-stone-800 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {firstItem}-{lastItem} of {pagination.total} users
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
              disabled={page <= 1 || loading}
              className="restaurant-button restaurant-button-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((currentPage) => Math.min(currentPage + 1, pagination.pages))
              }
              disabled={page >= pagination.pages || loading}
              className="restaurant-button restaurant-button-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {selectedUser && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/45 px-4 py-8">
            <section className="admin-panel max-h-[90vh] w-full max-w-3xl overflow-auto">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-serif text-3xl font-semibold text-stone-950">
                  User Details
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openEditForm(selectedUser)}
                    className="restaurant-button"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmation(selectedUser)}
                    className="restaurant-button restaurant-danger-button"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="restaurant-button restaurant-button-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>

              {detailsLoading ? (
                <p className="mt-6 text-xl text-stone-700">Loading user details...</p>
              ) : (
                <div className="mt-6 grid gap-5 text-xl text-stone-800 md:grid-cols-2">
                  <p>
                    <strong>Name:</strong> {selectedUser.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedUser.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedUser.phone}
                  </p>
                  <p>
                    <strong>Role:</strong> {selectedUser.role}
                  </p>
                  <p>
                    <strong>University:</strong> {selectedUser.university || 'Not provided'}
                  </p>
                  <p>
                    <strong>Address:</strong> {selectedUser.address || 'Not provided'}
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/45 px-4 py-8">
            <section className="admin-panel max-h-[90vh] w-full max-w-4xl overflow-auto">
              <h2 className="font-serif text-3xl font-semibold text-stone-950">
                Edit User
              </h2>
              <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="restaurant-field">
                  <span>Name</span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  />
                </label>
                <label className="restaurant-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  />
                </label>
                <label className="restaurant-field">
                  <span>Phone</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  />
                </label>
                <label className="restaurant-field">
                  <span>Role</span>
                  <select
                    value={formData.role}
                    onChange={(event) => setFormData({ ...formData, role: event.target.value })}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="restaurant-field">
                  <span>University</span>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(event) =>
                      setFormData({ ...formData, university: event.target.value })
                    }
                  />
                </label>
                <label className="restaurant-field">
                  <span>Address</span>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                  />
                </label>
                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button type="submit" className="restaurant-button">
                    Update User
                  </button>
                  <button
                    type="button"
                    onClick={closeEditForm}
                    className="restaurant-button restaurant-button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-4 py-8">
            <section className="admin-panel w-full max-w-xl">
              <h2 className="font-serif text-3xl font-semibold text-stone-950">
                Delete User
              </h2>
              <p className="mt-4 text-lg text-stone-800">
                Delete user account for <strong>{deleteConfirmation.name}</strong>?
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

export default AdminUsers;

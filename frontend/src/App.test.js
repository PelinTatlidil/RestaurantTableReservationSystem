import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import axiosInstance from './axiosConfig';

jest.mock('./axiosConfig', () => ({
  delete: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

let container;
let root;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const renderAppAt = async (path) => {
  window.history.pushState({}, '', path);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
  });
};

const waitFor = async (assertion) => {
  let lastError;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }
  }

  throw lastError;
};

const changeInputValue = (input, value) => {
  const valueSetter = Object.getOwnPropertyDescriptor(input, 'value')?.set;
  const prototype = Object.getPrototypeOf(input);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(input, value);
  } else if (valueSetter) {
    valueSetter.call(input, value);
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const changeCheckboxValue = (input, checked) => {
  const checkedSetter = Object.getOwnPropertyDescriptor(input, 'checked')?.set;
  const prototype = Object.getPrototypeOf(input);
  const prototypeCheckedSetter = Object.getOwnPropertyDescriptor(prototype, 'checked')?.set;

  if (prototypeCheckedSetter && checkedSetter !== prototypeCheckedSetter) {
    prototypeCheckedSetter.call(input, checked);
  } else if (checkedSetter) {
    checkedSetter.call(input, checked);
  } else {
    input.checked = checked;
  }

  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const changeSelectValue = (select, value) => {
  const valueSetter = Object.getOwnPropertyDescriptor(select, 'value')?.set;
  const prototype = Object.getPrototypeOf(select);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(select, value);
  } else if (valueSetter) {
    valueSetter.call(select, value);
  } else {
    select.value = value;
  }

  select.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('logout and protected access', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    root = null;
    container = null;
  });

  test('user can open the login page and enter credentials', async () => {
    await renderAppAt('/login');

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[type="password"]');

    act(() => {
      changeInputValue(emailInput, 'customer@example.com');
      changeInputValue(passwordInput, 'secret123');
    });

    expect(container.textContent).toContain('Log In');
    expect(emailInput.value).toBe('customer@example.com');
    expect(passwordInput.value).toBe('secret123');
  });

  test('protected customer dashboard redirects to login without a session', async () => {
    await renderAppAt('/profile');

    await waitFor(() => {
      expect(container.textContent).toContain('Log In');
    });
  });

  test('customer can logout from dashboard, clearing the session and returning to login', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get.mockResolvedValue({
      data: {
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
      },
    });

    await renderAppAt('/profile');

    await waitFor(() => {
      expect(container.textContent).toContain('Manage your restaurant bookings');
    });

    const logoutButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Logout'
    );

    act(() => {
      logoutButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(localStorage.getItem('user')).toBeNull();
      expect(container.textContent).toContain('Log In');
    });
  });
});

describe('restaurant information page', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    root = null;
    container = null;
  });

  test('customer can view restaurant details, opening hours, and booking policy', async () => {
    axiosInstance.get.mockResolvedValue({
      data: {
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
        bookingPolicy: 'Bookings are recommended and held for 15 minutes.',
      },
    });

    await renderAppAt('/');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/restaurant-info');
      expect(container.textContent).toContain('Digi Meat Restaurant');
      expect(container.textContent).toContain('123 Food Street');
      expect(container.textContent).toContain('Phone: 0400 123 456');
      expect(container.textContent).toContain('Mon to Fri 11:00 AM to 10:00 PM');
      expect(container.textContent).toContain('Bookings are recommended and held for 15 minutes.');
    });
  });
});

describe('admin restaurant information management', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    root = null;
    container = null;
  });

  const setAdminSession = () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
  };

  test('admin can view and update restaurant information', async () => {
    setAdminSession();
    axiosInstance.get.mockResolvedValue({
      data: {
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
        openingHours: ['Mon to Fri 11:00 AM to 10:00 PM'],
        bookingPolicy: 'Bookings are recommended.',
      },
    });
    axiosInstance.put.mockResolvedValue({
      data: {
        name: 'Updated Restaurant',
        address: {
          street: '456 New Street',
          city: 'Brisbane',
          state: 'QLD',
          postcode: '4001',
        },
        contact: {
          phone: '0400 999 888',
          email: 'bookings@example.com',
        },
        openingHours: ['Mon to Fri 10:00 AM to 9:00 PM', 'Sat 11:00 AM to 10:00 PM'],
        bookingPolicy: 'Bookings can be changed up to two hours before arrival.',
      },
    });

    await renderAppAt('/admin/restaurant-info');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/restaurant-info');
      expect(container.textContent).toContain('Restaurant Information Management');
      expect(container.querySelector('input').value).toBe('Digi Meat Restaurant');
    });

    await act(async () => {
      const inputs = container.querySelectorAll('form input');
      const textareas = container.querySelectorAll('form textarea');
      changeInputValue(inputs[0], 'Updated Restaurant');
      changeInputValue(inputs[1], '456 New Street');
      changeInputValue(inputs[2], 'Brisbane');
      changeInputValue(inputs[3], 'QLD');
      changeInputValue(inputs[4], '4001');
      changeInputValue(inputs[5], '0400 999 888');
      changeInputValue(inputs[6], 'bookings@example.com');
      changeInputValue(textareas[0], 'Mon to Fri 10:00 AM to 9:00 PM\nSat 11:00 AM to 10:00 PM');
      changeInputValue(textareas[1], 'Bookings can be changed up to two hours before arrival.');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/restaurant-info',
        {
          name: 'Updated Restaurant',
          address: {
            street: '456 New Street',
            city: 'Brisbane',
            state: 'QLD',
            postcode: '4001',
          },
          contact: {
            phone: '0400 999 888',
            email: 'bookings@example.com',
          },
          openingHours: ['Mon to Fri 10:00 AM to 9:00 PM', 'Sat 11:00 AM to 10:00 PM'],
          bookingPolicy: 'Bookings can be changed up to two hours before arrival.',
        },
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('Restaurant information updated successfully.');
      expect(container.querySelector('input').value).toBe('Updated Restaurant');
    });
  });

  test('admin sees validation errors before saving incomplete restaurant information', async () => {
    setAdminSession();
    axiosInstance.get.mockResolvedValue({
      data: {
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
        openingHours: ['Mon to Fri 11:00 AM to 10:00 PM'],
        bookingPolicy: 'Bookings are recommended.',
      },
    });

    await renderAppAt('/admin/restaurant-info');

    await waitFor(() => {
      expect(container.querySelector('input').value).toBe('Digi Meat Restaurant');
    });

    await act(async () => {
      changeInputValue(container.querySelector('input'), '');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(axiosInstance.put).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Restaurant name is required.');
  });

  test('customer cannot access restaurant information management', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get.mockResolvedValue({
      data: {
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
      },
    });

    await renderAppAt('/admin/restaurant-info');

    await waitFor(() => {
      expect(container.textContent).not.toContain('Restaurant Information Management');
      expect(container.textContent).toContain('Manage your restaurant bookings');
    });
  });
});

describe('admin dashboard access and navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    root = null;
    container = null;
  });

  test('admin can access dashboard and see management links', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'reservation-1',
            customerName: 'Live Customer',
            customerEmail: 'live@example.com',
            customerPhone: '0400111222',
            date: '2026-05-31T00:00:00.000Z',
            timeSlot: { startTime: '18:00', endTime: '19:00' },
            guests: 2,
            status: 'Confirmed',
          },
          {
            _id: 'reservation-2',
            customerName: 'Pending Customer',
            customerEmail: 'pending@example.com',
            customerPhone: '0400333444',
            date: '2026-06-01T00:00:00.000Z',
            timeSlot: { startTime: '19:00', endTime: '20:00' },
            guests: 4,
            status: 'Pending',
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          { _id: 'table-1', tableNumber: 1, capacity: 4, location: 'Indoor', isAvailable: true },
          { _id: 'table-2', tableNumber: 2, capacity: 2, location: 'Patio', isAvailable: false },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          { _id: 'slot-1', startTime: '18:00', endTime: '19:00', isAvailable: true },
          { _id: 'slot-2', startTime: '19:00', endTime: '20:00', isAvailable: false },
        ],
      });

    await renderAppAt('/admin-dashboard');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/reservations/admin', {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/tables', {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/time-slots', {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(container.textContent).toContain('Admin Dashboard');
      expect(container.textContent).toContain('Total Reservations');
      expect(container.textContent).toContain('Live Customer');
      expect(container.textContent).toContain('Pending Customer');
      expect(container.textContent).toContain('01 June 2026, 19:00 - 20:00');
      expect(container.textContent).not.toContain('R2345678');
    });

    expect(container.querySelector('a[href="/admin/reservations"]')).toBeTruthy();
    expect(container.querySelector('a[href="/tasks"]')).toBeTruthy();
    expect(container.querySelector('a[href="/admin/time-slots"]')).toBeTruthy();
    expect(container.querySelector('a[href="/admin/users"]')).toBeTruthy();
    expect(container.querySelector('a[href="/admin/restaurant-info"]')).toBeTruthy();
  });

  test('customer cannot access admin dashboard', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get.mockResolvedValue({
      data: {
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
      },
    });

    await renderAppAt('/admin-dashboard');

    await waitFor(() => {
      expect(container.textContent).not.toContain('Admin Dashboard');
      expect(container.textContent).toContain('Manage your restaurant bookings');
    });
  });
});

describe('admin user management', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    root = null;
    container = null;
  });

  const setAdminSession = () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
  };

  test('admin can view registered users and open user details', async () => {
    setAdminSession();
    axiosInstance.get
      .mockResolvedValueOnce({
        data: {
          users: [
            {
              _id: '507f1f77bcf86cd799439011',
              name: 'Pelin Tatlidil',
              email: 'pelin@example.com',
              phone: '0400123456',
              role: 'customer',
            },
            {
              _id: '507f1f77bcf86cd799439012',
              name: 'Admin A',
              email: 'admin@example.com',
              phone: '0400654321',
              role: 'admin',
            },
          ],
          total: 2,
          page: 1,
          pages: 1,
          limit: 10,
        },
      })
      .mockResolvedValueOnce({
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Pelin Tatlidil',
          email: 'pelin@example.com',
          phone: '0400123456',
          role: 'customer',
          university: 'QUT',
          address: 'Brisbane',
        },
      });

    await renderAppAt('/admin/users');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/admin', {
        headers: { Authorization: 'Bearer admin-token' },
        params: {
          page: 1,
          limit: 10,
          search: '',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      });
      expect(container.textContent).toContain('User Management');
      expect(container.textContent).toContain('Pelin Tatlidil');
      expect(container.textContent).toContain('pelin@example.com');
      expect(container.textContent).toContain('0400123456');
      expect(container.textContent).toContain('customer');
      expect(container.textContent).toContain('Admin A');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('.user-admin-row:not(.restaurant-admin-head)'))
        .find((row) => row.textContent.includes('Pelin Tatlidil'))
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith(
        '/api/users/admin/507f1f77bcf86cd799439011',
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('User Details');
      expect(container.textContent).toContain('University: QUT');
      expect(container.textContent).toContain('Address: Brisbane');
    });
  });

  test('admin can search, sort, and paginate user list', async () => {
    setAdminSession();
    axiosInstance.get
      .mockResolvedValueOnce({
        data: {
          users: [
            {
              _id: '507f1f77bcf86cd799439011',
              name: 'Customer A',
              email: 'customer@example.com',
              phone: '0400123456',
              role: 'customer',
            },
          ],
          total: 11,
          page: 1,
          pages: 2,
          limit: 10,
        },
      })
      .mockResolvedValueOnce({
        data: {
          users: [
            {
              _id: '507f1f77bcf86cd799439012',
              name: 'Customer B',
              email: 'customerb@example.com',
              phone: '0400654321',
              role: 'customer',
            },
          ],
          total: 11,
          page: 2,
          pages: 2,
          limit: 10,
        },
      })
      .mockResolvedValue({
        data: {
          users: [],
          total: 0,
          page: 1,
          pages: 1,
          limit: 10,
        },
      });

    await renderAppAt('/admin/users');

    await waitFor(() => {
      expect(container.textContent).toContain('Customer A');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Next')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenLastCalledWith('/api/users/admin', {
        headers: { Authorization: 'Bearer admin-token' },
        params: {
          page: 2,
          limit: 10,
          search: '',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      });
      expect(container.textContent).toContain('Customer B');
    });

    await act(async () => {
      changeInputValue(container.querySelector('input[type="search"]'), 'admin');
    });

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenLastCalledWith('/api/users/admin', {
        headers: { Authorization: 'Bearer admin-token' },
        params: {
          page: 1,
          limit: 10,
          search: 'admin',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      });
      expect(container.textContent).toContain('No users match your search.');
    });

    await act(async () => {
      changeSelectValue(container.querySelector('select[aria-label="Sort users by"]'), 'email');
    });

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenLastCalledWith('/api/users/admin', {
        headers: { Authorization: 'Bearer admin-token' },
        params: {
          page: 1,
          limit: 10,
          search: 'admin',
          sortBy: 'email',
          sortOrder: 'asc',
        },
      });
    });
  });

  test('admin can edit and delete users', async () => {
    setAdminSession();
    axiosInstance.get.mockResolvedValue({
      data: {
        users: [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'Customer A',
            email: 'customer@example.com',
            phone: '0400123456',
            role: 'customer',
            university: '',
            address: '',
          },
        ],
        total: 1,
        page: 1,
        pages: 1,
        limit: 10,
      },
    });
    axiosInstance.put.mockResolvedValue({
      data: {
        _id: '507f1f77bcf86cd799439011',
        name: 'Updated Customer',
        email: 'updated@example.com',
        phone: '0400999888',
        role: 'admin',
        university: 'QUT',
        address: 'Brisbane',
        message: 'User updated successfully',
      },
    });
    axiosInstance.delete.mockResolvedValue({
      data: { message: 'User deleted successfully' },
    });

    await renderAppAt('/admin/users');

    await waitFor(() => {
      expect(container.textContent).toContain('Customer A');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.getAttribute('aria-label') === 'Edit Customer A')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      const form = container.querySelector('form');
      const inputs = form.querySelectorAll('input');
      const roleSelect = form.querySelector('select');
      changeInputValue(inputs[0], 'Updated Customer');
      changeInputValue(inputs[1], 'Updated@Example.com');
      changeInputValue(inputs[2], '0400999888');
      changeSelectValue(roleSelect, 'admin');
      changeInputValue(inputs[3], 'QUT');
      changeInputValue(inputs[4], 'Brisbane');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/users/admin/507f1f77bcf86cd799439011',
        {
          name: 'Updated Customer',
          email: 'Updated@Example.com',
          phone: '0400999888',
          role: 'admin',
          university: 'QUT',
          address: 'Brisbane',
        },
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('User updated successfully.');
      expect(container.textContent).toContain('Updated Customer');
      expect(container.textContent).toContain('updated@example.com');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.getAttribute('aria-label') === 'Delete Updated Customer')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Delete user account for Updated Customer?');

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .filter((button) => button.textContent === 'Delete')
        .at(-1)
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.delete).toHaveBeenCalledWith(
        '/api/users/admin/507f1f77bcf86cd799439011',
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('User deleted successfully.');
      expect(container.textContent).toContain('No registered users were found.');
    });
  });

  test('user management shows API errors and empty state', async () => {
    setAdminSession();
    axiosInstance.get.mockRejectedValueOnce({
      response: {
        data: { message: 'Admin access required' },
      },
    });

    await renderAppAt('/admin/users');

    await waitFor(() => {
      expect(container.textContent).toContain('Admin access required');
      expect(container.textContent).toContain('No registered users were found.');
    });
  });

  test('customer cannot access admin user management', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get.mockResolvedValue({
      data: {
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
      },
    });

    await renderAppAt('/admin/users');

    await waitFor(() => {
      expect(container.textContent).not.toContain('User Management');
      expect(container.textContent).toContain('Manage your restaurant bookings');
    });
  });
});

describe('admin table management', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    root = null;
    container = null;
  });

  const setAdminSession = () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
  };

  test('admin can add, update, and delete tables without a status column in the list', async () => {
    setAdminSession();
    axiosInstance.get.mockResolvedValue({
      data: [
        {
          _id: 'table-1',
          tableNumber: 1,
          capacity: 2,
          location: 'Indoor',
          isAvailable: true,
        },
      ],
    });
    axiosInstance.post.mockResolvedValue({
      data: {
        _id: 'table-2',
        tableNumber: 2,
        capacity: 4,
        location: 'Patio',
        isAvailable: true,
      },
    });
    axiosInstance.put.mockResolvedValue({
      data: {
        _id: 'table-1',
        tableNumber: 1,
        capacity: 6,
        location: 'Window',
        isAvailable: false,
      },
    });
    axiosInstance.delete.mockResolvedValue({ data: { message: 'Table deleted successfully' } });

    await renderAppAt('/tasks');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/tables', {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(container.textContent).toContain('Indoor');
      expect(container.querySelector('.restaurant-admin-head').textContent).not.toContain('Status');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Add Table')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      changeInputValue(container.querySelector('input[placeholder="Table Number"]'), '2');
      changeInputValue(container.querySelector('input[placeholder="Capacity"]'), '4');
      changeInputValue(container.querySelector('input[placeholder="Location"]'), 'Patio');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/tables',
        {
          tableNumber: 2,
          capacity: 4,
          location: 'Patio',
          isAvailable: true,
        },
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('Table added successfully.');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.getAttribute('aria-label') === 'Edit table 1')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      changeInputValue(container.querySelector('input[placeholder="Capacity"]'), '6');
      changeInputValue(container.querySelector('input[placeholder="Location"]'), 'Window');
      changeCheckboxValue(container.querySelector('input[type="checkbox"]'), false);
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/tables/table-1',
        {
          tableNumber: 1,
          capacity: 6,
          location: 'Window',
          isAvailable: true,
        },
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('Table updated successfully.');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.getAttribute('aria-label') === 'Delete table 2')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/tables/table-2', {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(container.textContent).toContain('Table deleted successfully.');
    });
  });
});

describe('admin time slot management', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    root = null;
    container = null;
  });

  const setAdminSession = () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
  };

  test('admin can add, update, and delete time slots without a status column in the list', async () => {
    setAdminSession();
    axiosInstance.get.mockResolvedValue({
      data: [
        {
          _id: 'slot-1',
          startTime: '17:00',
          endTime: '19:00',
          isAvailable: true,
        },
      ],
    });
    axiosInstance.post.mockResolvedValue({
      data: {
        _id: 'slot-2',
        startTime: '19:00',
        endTime: '21:00',
        isAvailable: true,
      },
    });
    axiosInstance.put.mockResolvedValue({
      data: {
        _id: 'slot-1',
        startTime: '18:00',
        endTime: '20:00',
        isAvailable: true,
      },
    });
    axiosInstance.delete.mockResolvedValue({ data: { message: 'Time slot deleted successfully' } });

    await renderAppAt('/admin/time-slots');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/time-slots', {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(container.textContent).toContain('17:00');
      expect(container.querySelector('.restaurant-admin-head').textContent).not.toContain('Status');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Add Time Slot')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      const timeInputs = container.querySelectorAll('input[type="time"]');
      changeInputValue(timeInputs[0], '19:00');
      changeInputValue(timeInputs[1], '21:00');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/time-slots',
        {
          startTime: '19:00',
          endTime: '21:00',
          isAvailable: true,
        },
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('Time slot added successfully.');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.getAttribute('aria-label') === 'Edit time slot 17:00')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      const timeInputs = container.querySelectorAll('input[type="time"]');
      changeInputValue(timeInputs[0], '18:00');
      changeInputValue(timeInputs[1], '20:00');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/time-slots/slot-1',
        {
          startTime: '18:00',
          endTime: '20:00',
          isAvailable: true,
        },
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('Time slot updated successfully.');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.getAttribute('aria-label') === 'Delete time slot 19:00')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/time-slots/slot-2', {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(container.textContent).toContain('Time slot deleted successfully.');
    });
  });
});

describe('admin reservation management', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    root = null;
    container = null;
  });

  test('admin can view, filter, and open reservation details', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'reservation-1',
            customer: { name: 'Pelin Tatlidil', email: 'pelin@example.com' },
            date: '2026-05-31T00:00:00.000Z',
            timeSlot: { startTime: '18:00', endTime: '19:00' },
            table: { tableNumber: 3, capacity: 4, location: 'Window' },
            guests: 4,
            status: 'Confirmed',
            tablePreference: 'Window seat',
            requests: 'Anniversary',
          },
          {
            _id: 'reservation-2',
            customer: { name: 'Noah Chen', email: 'noah@example.com' },
            date: '2026-06-02T00:00:00.000Z',
            timeSlot: { startTime: '19:00', endTime: '20:00' },
            table: { tableNumber: 4, capacity: 2, location: 'Patio' },
            guests: 2,
            status: 'Pending',
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    await renderAppAt('/admin/reservations');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/reservations/admin', {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(container.textContent).toContain('Pelin Tatlidil');
      expect(container.textContent).toContain('Noah Chen');
      expect(container.textContent).toContain('18:00 - 19:00');
    });

    await act(async () => {
      changeInputValue(container.querySelector('input[type="search"]'), 'Pelin');
    });

    expect(container.textContent).toContain('Pelin Tatlidil');
    expect(container.textContent).not.toContain('Noah Chen');

    await act(async () => {
      Array.from(container.querySelectorAll('.reservation-admin-row'))
        .find((row) => row.textContent.includes('Pelin Tatlidil'))
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Reservation Details');
    expect(container.textContent).toContain('Window seat');
    expect(container.textContent).toContain('Anniversary');
  });

  test('admin can update reservation status from the edit form', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({
        data: [
          {
            _id: '507f1f77bcf86cd799439013',
            customerName: 'Status Customer',
            customerEmail: 'status@example.com',
            customerPhone: '0400111222',
            date: '2026-05-31T00:00:00.000Z',
            timeSlot: { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
            table: { _id: 'table-1', tableNumber: 1, capacity: 4, location: 'Indoor' },
            guests: 2,
            status: 'Confirmed',
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });
    axiosInstance.put.mockResolvedValue({
      data: {
        _id: '507f1f77bcf86cd799439013',
        customerName: 'Status Customer',
        customerEmail: 'status@example.com',
        customerPhone: '0400111222',
        date: '2026-05-31T00:00:00.000Z',
        timeSlot: { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
        table: { _id: 'table-1', tableNumber: 1, capacity: 4, location: 'Indoor' },
        guests: 2,
        status: 'No-show',
      },
    });

    await renderAppAt('/admin/reservations');

    await waitFor(() => {
      expect(container.textContent).toContain('Status Customer');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('.reservation-admin-row'))
        .find((row) => row.textContent.includes('Status Customer'))
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Reservation Details');

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Edit')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      const selects = container.querySelectorAll('form select');
      expect(selects[0].value).toBe('slot-1');
      expect(selects[0].textContent).toContain('18:00 - 19:00');
      expect(selects[1].value).toBe('table-1');
      expect(selects[1].textContent).toContain('Table 1');
    });

    await act(async () => {
      const selects = container.querySelectorAll('form select');
      changeSelectValue(selects[2], 'No-show');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/reservations/admin/507f1f77bcf86cd799439013',
        {
          customerName: 'Status Customer',
          customerEmail: 'status@example.com',
          customerPhone: '0400111222',
          date: '2026-05-31',
          timeSlot: 'slot-1',
          table: 'table-1',
          guests: 2,
          status: 'No-show',
          tablePreference: '',
          requests: '',
        },
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('Reservation updated successfully.');
      expect(container.textContent).toContain('No-show');
      expect(container.textContent).not.toContain('Reservation Details');
    });
  });

  test('admin can create a reservation with an available table and time slot', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'table-1',
            tableNumber: 1,
            capacity: 4,
            location: 'Indoor',
            isAvailable: true,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'slot-1',
            startTime: '18:00',
            endTime: '19:00',
            isAvailable: true,
          },
        ],
      });
    axiosInstance.post.mockResolvedValue({
      data: {
        _id: 'reservation-1',
        customer: { name: 'Pelin Tatlidil', email: 'pelin@example.com' },
        customerName: 'Pelin Tatlidil',
        customerEmail: 'pelin@example.com',
        customerPhone: '0400123456',
        date: '2026-05-31T00:00:00.000Z',
        timeSlot: { startTime: '18:00', endTime: '19:00' },
        table: { tableNumber: 1, capacity: 4, location: 'Indoor' },
        guests: 3,
        status: 'Confirmed',
        tablePreference: 'Indoor',
        requests: 'Birthday',
      },
    });

    await renderAppAt('/admin/reservations');

    await waitFor(() => {
      expect(container.textContent).toContain('Add Reservation');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Add Reservation')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      const inputs = container.querySelectorAll('form input');
      const selects = container.querySelectorAll('form select');
      changeInputValue(inputs[0], 'Pelin Tatlidil');
      changeInputValue(inputs[1], 'pelin@example.com');
      changeInputValue(inputs[2], '0400123456');
      changeInputValue(inputs[3], '2026-05-31');
      changeInputValue(inputs[4], '3');
      changeSelectValue(selects[0], 'slot-1');
      changeSelectValue(selects[1], 'table-1');
      changeSelectValue(selects[2], 'Confirmed');
      changeInputValue(inputs[5], 'Indoor');
      changeInputValue(container.querySelector('form textarea'), 'Birthday');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/reservations/admin',
        {
          customerName: 'Pelin Tatlidil',
          customerEmail: 'pelin@example.com',
          customerPhone: '0400123456',
          date: '2026-05-31',
          timeSlot: 'slot-1',
          table: 'table-1',
          guests: 3,
          status: 'Confirmed',
          tablePreference: 'Indoor',
          requests: 'Birthday',
        },
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('Reservation created successfully.');
      expect(container.textContent).toContain('Pelin Tatlidil');
      expect(container.textContent).toContain('Table 1');
    });
  });

  test('admin sees the reason when reservation creation fails', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'table-1',
            tableNumber: 1,
            capacity: 4,
            location: 'Indoor',
            isAvailable: true,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'slot-1',
            startTime: '18:00',
            endTime: '19:00',
            isAvailable: true,
          },
        ],
      });
    axiosInstance.post.mockRejectedValue({
      response: {
        data: { message: 'Selected table is already booked for this time' },
      },
    });

    await renderAppAt('/admin/reservations');

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Add Reservation')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      const inputs = container.querySelectorAll('form input');
      const selects = container.querySelectorAll('form select');
      changeInputValue(inputs[0], 'Walk In Customer');
      changeInputValue(inputs[1], 'walkin@example.com');
      changeInputValue(inputs[2], '0400111222');
      changeInputValue(inputs[3], '2026-05-31');
      changeInputValue(inputs[4], '2');
      changeSelectValue(selects[0], 'slot-1');
      changeSelectValue(selects[1], 'table-1');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(container.textContent).toContain(
        'Reason: Selected table is already booked for this time'
      );
    });
  });

  test('admin table dropdown excludes pending or confirmed booked tables for selected date and time', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'reservation-1',
            customerName: 'Booked Customer',
            customerEmail: 'booked@example.com',
            customerPhone: '0400111222',
            date: '2026-05-31T00:00:00.000Z',
            timeSlot: { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
            table: { _id: 'table-1', tableNumber: 1, capacity: 4, location: 'Indoor' },
            guests: 2,
            status: 'Pending',
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'table-1',
            tableNumber: 1,
            capacity: 4,
            location: 'Indoor',
            isAvailable: true,
          },
          {
            _id: 'table-2',
            tableNumber: 2,
            capacity: 4,
            location: 'Patio',
            isAvailable: true,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'slot-1',
            startTime: '18:00',
            endTime: '19:00',
            isAvailable: true,
          },
        ],
      });

    await renderAppAt('/admin/reservations');

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Add Reservation')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      const inputs = container.querySelectorAll('form input');
      const selects = container.querySelectorAll('form select');
      changeInputValue(inputs[3], '2026-05-31');
      changeSelectValue(selects[0], 'slot-1');
    });

    const tableOptions = Array.from(container.querySelectorAll('form select')[1].options).map(
      (option) => option.textContent
    );

    expect(tableOptions).not.toContain('Table 1 - 4 guests - Indoor');
    expect(tableOptions).toContain('Table 2 - 4 guests - Patio');
  });

  test('admin can update, soft delete, and recover an existing reservation', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({
        data: [
          {
            _id: '507f1f77bcf86cd799439013',
            customerName: 'Original Customer',
            customerEmail: 'original@example.com',
            customerPhone: '0400111222',
            date: '2026-05-31T00:00:00.000Z',
            timeSlot: { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
            table: { _id: 'table-1', tableNumber: 1, capacity: 4, location: 'Indoor' },
            guests: 2,
            status: 'Pending',
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'table-1',
            tableNumber: 1,
            capacity: 4,
            location: 'Indoor',
            isAvailable: true,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'slot-1',
            startTime: '18:00',
            endTime: '19:00',
            isAvailable: true,
          },
        ],
      });
    axiosInstance.put.mockResolvedValue({
      data: {
        _id: '507f1f77bcf86cd799439013',
        customerName: 'Updated Customer',
        customerEmail: 'updated@example.com',
        customerPhone: '0400999888',
        date: '2026-05-31T00:00:00.000Z',
        timeSlot: { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
        table: { _id: 'table-1', tableNumber: 1, capacity: 4, location: 'Indoor' },
        guests: 3,
        status: 'Confirmed',
      },
    });
    axiosInstance.delete.mockResolvedValue({
      data: {
        message: 'Reservation deleted successfully',
        reservation: {
          _id: '507f1f77bcf86cd799439013',
          customerName: 'Updated Customer',
          customerEmail: 'updated@example.com',
          customerPhone: '0400999888',
          date: '2026-05-31T00:00:00.000Z',
          timeSlot: { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
          table: { _id: 'table-1', tableNumber: 1, capacity: 4, location: 'Indoor' },
          guests: 3,
          status: 'Confirmed',
          isDeleted: true,
        },
      },
    });
    axiosInstance.patch.mockResolvedValue({
      data: {
        message: 'Reservation recovered successfully',
        reservation: {
          _id: '507f1f77bcf86cd799439013',
          customerName: 'Updated Customer',
          customerEmail: 'updated@example.com',
          customerPhone: '0400999888',
          date: '2026-05-31T00:00:00.000Z',
          timeSlot: { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
          table: { _id: 'table-1', tableNumber: 1, capacity: 4, location: 'Indoor' },
          guests: 3,
          status: 'Confirmed',
          isDeleted: false,
        },
      },
    });

    await renderAppAt('/admin/reservations');

    await waitFor(() => {
      expect(container.textContent).toContain('Original Customer');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Edit')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      const inputs = container.querySelectorAll('form input');
      const selects = container.querySelectorAll('form select');
      changeInputValue(inputs[0], 'Updated Customer');
      changeInputValue(inputs[1], 'updated@example.com');
      changeInputValue(inputs[2], '0400999888');
      changeInputValue(inputs[4], '3');
      changeSelectValue(selects[2], 'Confirmed');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/reservations/admin/507f1f77bcf86cd799439013',
        {
          customerName: 'Updated Customer',
          customerEmail: 'updated@example.com',
          customerPhone: '0400999888',
          date: '2026-05-31',
          timeSlot: 'slot-1',
          table: 'table-1',
          guests: 3,
          status: 'Confirmed',
          tablePreference: '',
          requests: '',
        },
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('Reservation updated successfully.');
      expect(container.textContent).toContain('Updated Customer');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Delete')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Delete Reservation');
    expect(container.textContent).toContain('Delete reservation for Updated Customer?');

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .filter((button) => button.textContent === 'Delete')
        .at(-1)
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.delete).toHaveBeenCalledWith(
        '/api/reservations/admin/507f1f77bcf86cd799439013',
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('Reservation deleted successfully.');
      expect(container.textContent).toContain('Updated Customer');
      expect(container.textContent).toContain('Deleted');
      expect(container.textContent).toContain('Recover');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Recover')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.patch).toHaveBeenCalledWith(
        '/api/reservations/admin/507f1f77bcf86cd799439013/recover',
        {},
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('Reservation recovered successfully.');
      const reservationRows = Array.from(
        container.querySelectorAll('.reservation-admin-row:not(.restaurant-admin-head)')
      );
      const updatedReservationRow = reservationRows.find((row) =>
        row.textContent.includes('Updated Customer')
      );
      expect(updatedReservationRow.textContent).toContain('Confirmed');
      expect(updatedReservationRow.textContent).not.toContain('Deleted');
      expect(updatedReservationRow.textContent).not.toContain('Recover');
    });
  });

  test('customer cannot access admin reservation management', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get.mockResolvedValue({
      data: {
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
      },
    });

    await renderAppAt('/admin/reservations');

    await waitFor(() => {
      expect(container.textContent).not.toContain('Reservation Management');
      expect(container.textContent).toContain('Manage your restaurant bookings');
    });
  });
});

describe('customer reservation time slots', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    root = null;
    container = null;
  });

  test('customer can only select available time slots', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get.mockResolvedValue({
      data: [
        {
          _id: 'slot-1',
          startTime: '17:00',
          endTime: '18:00',
          isAvailable: true,
        },
      ],
    });

    await renderAppAt('/make-reservation');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/time-slots/available', {
        headers: { Authorization: 'Bearer customer-token' },
      });
      expect(container.textContent).toContain('17:00 - 18:00');
    });

    await act(async () => {
      changeSelectValue(container.querySelector('select'), 'slot-1');
    });

    expect(container.querySelector('select').value).toBe('slot-1');
  });

  test('customer can create a confirmed reservation and see confirmation details', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'slot-1',
            startTime: '18:00',
            endTime: '19:00',
            isAvailable: true,
          },
        ],
      })
      .mockResolvedValue({
        data: {
          available: true,
          message: 'A table is available for this reservation',
          table: {
            _id: 'table-2',
            tableNumber: 2,
            capacity: 4,
            location: 'Window',
          },
        },
      });
    axiosInstance.post.mockResolvedValue({
      data: {
        message: 'Reservation confirmed successfully',
        reservation: {
          _id: '507f1f77bcf86cd799439013',
          date: '2026-05-31T00:00:00.000Z',
          timeSlot: { startTime: '18:00', endTime: '19:00' },
          table: { tableNumber: 2, capacity: 4 },
          guests: 4,
          status: 'Confirmed',
          requests: 'Window seat',
        },
      },
    });

    await renderAppAt('/make-reservation');

    await waitFor(() => {
      expect(container.textContent).toContain('18:00 - 19:00');
    });

    await act(async () => {
      const inputs = container.querySelectorAll('form input');
      changeInputValue(inputs[0], '2026-05-31');
      changeSelectValue(container.querySelector('select'), 'slot-1');
      changeInputValue(inputs[1], '4');
      changeInputValue(inputs[2], 'Window');
      changeInputValue(container.querySelector('textarea'), 'Window seat');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/reservations/availability', {
        headers: { Authorization: 'Bearer customer-token' },
        params: {
          date: '2026-05-31',
          timeSlotId: 'slot-1',
          guests: 4,
        },
      });
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/reservations',
        {
          date: '2026-05-31',
          timeSlotId: 'slot-1',
          guests: 4,
          tablePreference: 'Window',
          requests: 'Window seat',
        },
        {
          headers: { Authorization: 'Bearer customer-token' },
        }
      );
      expect(container.textContent).toContain('Reservation Confirmed');
      expect(container.textContent).toContain('Reservation confirmed successfully');
      expect(container.textContent).toContain('18:00 - 19:00');
      expect(container.textContent).toContain('Table 2 (4 guests)');
      expect(container.textContent).toContain('Confirmed');
    });
  });

  test('customer sees unavailable reservation errors without leaving the form', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'slot-1',
            startTime: '18:00',
            endTime: '19:00',
            isAvailable: true,
          },
        ],
      })
      .mockResolvedValue({
        data: {
          available: false,
          message: 'No tables are available for this date, time, and guest count',
          table: null,
        },
      });
    axiosInstance.post.mockRejectedValue({
      response: {
        data: {
          message: 'No tables are available for this date, time, and guest count',
        },
      },
    });

    await renderAppAt('/make-reservation');

    await waitFor(() => {
      expect(container.textContent).toContain('18:00 - 19:00');
    });

    await act(async () => {
      const inputs = container.querySelectorAll('form input');
      changeInputValue(inputs[0], '2026-05-31');
      changeSelectValue(container.querySelector('select'), 'slot-1');
      changeInputValue(inputs[1], '8');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/reservations/availability', {
        headers: { Authorization: 'Bearer customer-token' },
        params: {
          date: '2026-05-31',
          timeSlotId: 'slot-1',
          guests: 8,
        },
      });
      expect(container.textContent).toContain(
        'No tables are available for this date, time, and guest count'
      );
      expect(container.textContent).toContain('Make a Reservation');
      expect(container.textContent).not.toContain('Reservation Confirmed');
    });
  });
});

describe('customer reservation status view', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    root = null;
    container = null;
  });

  test('customer can see updated reservation status and notification', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get.mockResolvedValue({
      data: [
        {
          _id: 'reservation-1',
          date: '2026-05-31T00:00:00.000Z',
          timeSlot: { startTime: '18:00', endTime: '19:00' },
          table: { tableNumber: 1 },
          guests: 2,
          status: 'Completed',
          customerNotification: {
            message: 'Your reservation status has been updated to Completed.',
          },
        },
      ],
    });

    await renderAppAt('/my-reservations');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/reservations/my', {
        headers: { Authorization: 'Bearer customer-token' },
      });
      expect(container.querySelector('[role="table"]')).toBeTruthy();
      expect(container.textContent).toContain('31 May 2026');
      expect(container.textContent).toContain('18:00 - 19:00');
      expect(container.textContent).toContain('2');
      expect(container.textContent).toContain('Table 1');
      expect(container.textContent).toContain('Completed');
      expect(container.textContent).toContain(
        'Your reservation status has been updated to Completed.'
      );
    });
  });

  test('customer sees an empty message when they have no reservations', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get.mockResolvedValue({ data: [] });

    await renderAppAt('/my-reservations');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/reservations/my', {
        headers: { Authorization: 'Bearer customer-token' },
      });
      expect(container.textContent).toContain('You do not have any reservations yet.');
    });
  });

  test('customer can update one of their existing reservations', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({
        data: [
          {
            _id: '507f1f77bcf86cd799439013',
            date: '2026-05-31T00:00:00.000Z',
            timeSlot: { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
            table: { tableNumber: 1 },
            guests: 2,
            status: 'Confirmed',
            tablePreference: 'Window',
            requests: 'Birthday',
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
          { _id: 'slot-2', startTime: '19:00', endTime: '20:00' },
        ],
      });
    axiosInstance.put.mockResolvedValue({
      data: {
        message: 'Reservation updated successfully',
        reservation: {
          _id: '507f1f77bcf86cd799439013',
          date: '2026-06-01T00:00:00.000Z',
          timeSlot: { _id: 'slot-2', startTime: '19:00', endTime: '20:00' },
          table: { tableNumber: 3 },
          guests: 4,
          status: 'Confirmed',
          tablePreference: 'Patio',
          requests: 'Anniversary',
        },
      },
    });

    await renderAppAt('/my-reservations');

    await waitFor(() => {
      expect(container.textContent).toContain('31 May 2026');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Update')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Update Reservation');
      expect(container.querySelector('form input[type="date"]').value).toBe('2026-05-31');
    });

    await act(async () => {
      const form = container.querySelector('form');
      const inputs = form.querySelectorAll('input');
      const select = form.querySelector('select');
      changeInputValue(inputs[0], '2026-06-01');
      changeSelectValue(select, 'slot-2');
      changeInputValue(inputs[1], '4');
      changeInputValue(inputs[2], 'Patio');
      changeInputValue(form.querySelector('textarea'), 'Anniversary');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/reservations/507f1f77bcf86cd799439013',
        {
          date: '2026-06-01',
          timeSlotId: 'slot-2',
          guests: 4,
          tablePreference: 'Patio',
          requests: 'Anniversary',
        },
        {
          headers: { Authorization: 'Bearer customer-token' },
        }
      );
      expect(container.textContent).toContain('Reservation updated successfully');
      expect(container.textContent).toContain('01 June 2026');
      expect(container.textContent).toContain('19:00 - 20:00');
      expect(container.textContent).toContain('Table 3');
    });
  });

  test('customer sees an error when updated reservation details are unavailable', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({
        data: [
          {
            _id: '507f1f77bcf86cd799439013',
            date: '2026-05-31T00:00:00.000Z',
            timeSlot: { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
            table: { tableNumber: 1 },
            guests: 2,
            status: 'Confirmed',
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [{ _id: 'slot-1', startTime: '18:00', endTime: '19:00' }],
      });
    axiosInstance.put.mockRejectedValue({
      response: {
        data: { message: 'No tables are available for this date, time, and guest count' },
      },
    });

    await renderAppAt('/my-reservations');

    await waitFor(() => {
      expect(container.textContent).toContain('31 May 2026');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Update')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      const form = container.querySelector('form');
      const inputs = form.querySelectorAll('input');
      changeInputValue(inputs[1], '8');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(container.textContent).toContain(
        'No tables are available for this date, time, and guest count'
      );
      expect(container.textContent).toContain('Update Reservation');
    });
  });

  test('customer can cancel one of their existing reservations after confirmation', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get.mockResolvedValue({
      data: [
        {
          _id: '507f1f77bcf86cd799439013',
          date: '2026-05-31T00:00:00.000Z',
          timeSlot: { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
          table: { tableNumber: 1 },
          guests: 2,
          status: 'Confirmed',
        },
      ],
    });
    axiosInstance.patch.mockResolvedValue({
      data: {
        message: 'Reservation cancelled successfully',
        reservation: {
          _id: '507f1f77bcf86cd799439013',
          date: '2026-05-31T00:00:00.000Z',
          timeSlot: { _id: 'slot-1', startTime: '18:00', endTime: '19:00' },
          table: { tableNumber: 1 },
          guests: 2,
          status: 'Cancelled',
          customerNotification: {
            message: 'Your reservation has been cancelled.',
          },
        },
      },
    });

    await renderAppAt('/my-reservations');

    await waitFor(() => {
      expect(container.textContent).toContain('31 May 2026');
      expect(container.textContent).toContain('Confirmed');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.getAttribute('aria-label') === 'Cancel reservation on 31 May 2026')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Cancel your reservation on');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Cancel Reservation')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.patch).toHaveBeenCalledWith(
        '/api/reservations/507f1f77bcf86cd799439013/cancel',
        {},
        {
          headers: { Authorization: 'Bearer customer-token' },
        }
      );
      expect(container.textContent).toContain('Reservation cancelled successfully');
      expect(container.textContent).toContain('Cancelled');
      expect(container.textContent).toContain('Your reservation has been cancelled.');
    });
  });

  test('admin cannot access customer my reservations page', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        token: 'admin-token',
      })
    );
    axiosInstance.get.mockResolvedValue({
      data: {
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
        openingHours: ['Mon to Fri 11:00 AM to 10:00 PM'],
        bookingPolicy: 'Bookings are recommended.',
      },
    });

    await renderAppAt('/my-reservations');

    await waitFor(() => {
      expect(container.textContent).not.toContain('My Reservations');
      expect(container.textContent).toContain('Digi Meat Restaurant');
    });
  });
});

describe('customer profile management', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    root = null;
    container = null;
  });

  test('customer can view and update name and phone number', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Pelin',
        email: 'pelin@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get.mockResolvedValue({
      data: {
        name: 'Pelin',
        email: 'pelin@example.com',
        phone: '0400123456',
        role: 'customer',
      },
    });
    axiosInstance.put.mockResolvedValue({
      data: {
        id: 'customer-id',
        name: 'Pelin Tatlidil',
        email: 'pelin@example.com',
        phone: '0400987654',
        role: 'customer',
        message: 'Profile updated successfully',
      },
    });

    await renderAppAt('/profile');

    await waitFor(() => {
      expect(container.textContent).toContain('Name');
      expect(container.textContent).toContain('Email');
      expect(container.textContent).toContain('Phone');
      expect(container.querySelector('input[placeholder="Name"]').value).toBe('Pelin');
      expect(container.querySelector('input[placeholder="Phone"]').value).toBe('0400123456');
    });

    const nameInput = container.querySelector('input[placeholder="Name"]');
    const phoneInput = container.querySelector('input[placeholder="Phone"]');
    const form = container.querySelector('form');

    await act(async () => {
      changeInputValue(nameInput, 'Pelin Tatlidil');
      changeInputValue(phoneInput, '0400987654');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/auth/profile',
        {
          name: 'Pelin Tatlidil',
          phone: '0400987654',
        },
        {
          headers: { Authorization: 'Bearer customer-token' },
        }
      );
      expect(container.textContent).toContain('Profile updated successfully');
    });
  });

  test('customer dashboard shows reservation list instead of navigation tiles', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'customer-id',
        name: 'Pelin',
        email: 'pelin@example.com',
        phone: '0400123456',
        role: 'customer',
        token: 'customer-token',
      })
    );
    axiosInstance.get
      .mockResolvedValueOnce({
        data: {
          name: 'Pelin',
          email: 'pelin@example.com',
          phone: '0400123456',
          role: 'customer',
        },
      })
      .mockResolvedValueOnce({
        data: [
          {
            _id: 'reservation-1',
            date: '2026-05-31T00:00:00.000Z',
            timeSlot: { startTime: '18:00', endTime: '19:00' },
            table: { tableNumber: 2 },
            guests: 4,
            status: 'Confirmed',
            tablePreference: 'Window',
            requests: 'Birthday',
            customerNotification: {
              message: 'Your reservation is confirmed.',
            },
          },
        ],
      });

    await renderAppAt('/profile');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/reservations/my', {
        headers: { Authorization: 'Bearer customer-token' },
      });
      expect(container.querySelector('[role="table"]')).toBeTruthy();
      expect(container.textContent).toContain('31 May 2026');
      expect(container.textContent).toContain('18:00 - 19:00');
      expect(container.textContent).toContain('Table 2');
      expect(container.textContent).toContain('Confirmed');
      expect(container.textContent).not.toContain('Book now');
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.getAttribute('aria-label') === 'View details for reservation on 31 May 2026')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(window.location.pathname).toBe('/profile');
      expect(container.textContent).toContain('Reservation Details');
      expect(container.textContent).toContain('Date: 31 May 2026');
      expect(container.textContent).toContain('Time: 18:00 - 19:00');
      expect(container.textContent).toContain('Guests: 4');
      expect(container.textContent).toContain('Table Preference: Window');
      expect(container.textContent).toContain('Special Requests: Birthday');
      expect(container.textContent).toContain('Notification: Your reservation is confirmed.');
    });
  });
});

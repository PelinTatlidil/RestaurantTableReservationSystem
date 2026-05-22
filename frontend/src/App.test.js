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

    await renderAppAt('/admin-dashboard');

    expect(container.textContent).toContain('Admin Dashboard');
    expect(container.textContent).toContain('Total Reservations');
    expect(container.textContent).toContain('Open Time Slots');
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

  test('admin can add, update, delete, and toggle table availability', async () => {
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
    axiosInstance.patch.mockResolvedValue({
      data: {
        _id: 'table-1',
        tableNumber: 1,
        capacity: 6,
        location: 'Window',
        isAvailable: true,
      },
    });
    axiosInstance.delete.mockResolvedValue({ data: { message: 'Table deleted successfully' } });

    await renderAppAt('/tasks');

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/tables', {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(container.textContent).toContain('Indoor');
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
        .find((button) => button.textContent === 'Unavailable')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(axiosInstance.patch).toHaveBeenCalledWith(
        '/api/tables/table-1/toggle-availability',
        {},
        {
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(container.textContent).toContain('Available');
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
});

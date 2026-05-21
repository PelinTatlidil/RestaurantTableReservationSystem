import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import axiosInstance from './axiosConfig';

jest.mock('./axiosConfig', () => ({
  get: jest.fn(),
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

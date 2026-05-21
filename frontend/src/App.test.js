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
      emailInput.value = 'customer@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.value = 'secret123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
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

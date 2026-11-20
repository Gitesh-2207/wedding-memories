import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token if available in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('royal_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for consistent error handling and 401 redirect
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';

    if (
      error.response?.status === 401 &&
      window.location.pathname.startsWith('/admin') &&
      !window.location.pathname.includes('/admin/login')
    ) {
      localStorage.removeItem('royal_admin_token');
      localStorage.removeItem('royal_admin_user');
      localStorage.removeItem('royal_admin_wedding');
      window.location.href = '/admin/login';
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

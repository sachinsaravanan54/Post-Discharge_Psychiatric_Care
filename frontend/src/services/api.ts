import axios from 'axios';

// Configurable via environment variables (e.g. VITE_API_URL or VITE_API_BASE_URL)
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user_info');
      // Redirect to login if in browser environment
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error: any): string => {
  if (!error) return 'An unexpected error occurred.';
  if (error.response) {
    const detail = error.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
    }
    return error.response.statusText || `Server error (${error.response.status})`;
  }
  if (error.request) {
    return 'Network error: Unable to connect to the backend server. Please verify FastAPI is running.';
  }
  return error.message || 'Request failed';
};


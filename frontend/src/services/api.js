import axios from 'axios';

// Empty VITE_API_URL => same-origin (/api via Vite proxy in dev, or Express serving the build).
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true, // admin session cookie (httpOnly)
  timeout: 20000,
});

export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please check your connection.';
  if (!err?.response) return 'Cannot reach the server. Please check your connection.';
  return err.response.data?.message || fallback;
};

/** Field-level validation errors from the API: { 'customer.phone': 'msg' } */
export const getFieldErrors = (err) => err?.response?.data?.errors || {};

// Let the admin auth store react when a session expires mid-use.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && error.config?.url?.startsWith('/admin') && !error.config.url.includes('/admin/login')) {
      window.dispatchEvent(new Event('cw:admin-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;

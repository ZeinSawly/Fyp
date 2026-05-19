import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || '';
      // Only redirect to login if it's an auth/deactivation issue
      if (message.includes('deactivated') || message.includes('token') || message.includes('Invalid')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.108:3000';

const api = axios.create({
  baseURL: API_URL,
});

// Attach token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle expired/invalid token globally
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // JWT expired or invalid — clear session
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      console.warn('Session expired. Token cleared.');
      // The app should detect missing token and redirect to login on next render
    }
    if (error.response?.status === 403) {
      // Forbidden — usually account deactivated
      console.warn('Account deactivated or access denied.');
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
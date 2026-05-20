import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.112:3000';

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

// Handle expired token globally
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 403) {
      await AsyncStorage.removeItem('token');
      console.warn('Account deactivated or token expired.');
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
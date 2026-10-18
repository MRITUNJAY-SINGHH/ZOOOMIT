import axios from 'axios';
import { Platform, DeviceEventEmitter } from 'react-native';
import Constants from 'expo-constants';
import { authStorage } from './authStorage';

export const getBaseUrl = () => {
  // 1. Primary source of truth: environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    const configured = process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    return configured.endsWith('/api') ? configured : `${configured}/api`;
  }

  // 2. Default to hosted Render backend
  return 'https://zooomit-backend.onrender.com/api';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

api.interceptors.request.use(async (config) => {
  const token = await authStorage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[DeliveryAPI] 401 Unauthorized for:', error.config?.url);
      await authStorage.clearAuth();
      DeviceEventEmitter.emit('auth_unauthorized');
    }
    return Promise.reject(error);
  }
);

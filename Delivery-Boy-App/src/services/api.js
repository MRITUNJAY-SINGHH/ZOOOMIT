import axios from 'axios';
import { Platform, DeviceEventEmitter } from 'react-native';
import Constants from 'expo-constants';
import { authStorage } from './authStorage';

const getBaseUrl = () => {
  // 1. Auto-detect Metro host IP (works on emulator and real devices on LAN)
  const hostUri = Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api`;
    }
  }

  // 2. Configured env URL
  if (process.env.EXPO_PUBLIC_API_URL) {
    const configured = process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    return configured.endsWith('/api') ? configured : `${configured}/api`;
  }

  // 3. Android emulator loopback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
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

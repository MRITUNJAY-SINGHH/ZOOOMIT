import axios from 'axios';
import { Platform } from 'react-native';
import { authStorage } from './authStorage';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Android emulator loopback vs iOS simulator / Web
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/storefront';
  }
  return 'http://localhost:5000/api/storefront';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Attach JWT token automatically
api.interceptors.request.use(async (config) => {
  const token = await authStorage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle global 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Don't log sensitive payload
      await authStorage.clearAuth();
    }
    return Promise.reject(error);
  }
);

/* ==========================================================================
   Storefront API Service Calls
   ========================================================================== */

export const StorefrontAPI = {
  // Auth
  register: (data) =>
    api.post('/auth/register', data),
  login: (data) =>
    api.post('/auth/login', data),
  forgotPassword: (data) =>
    api.post('/auth/forgot-password', data),
  resetPassword: (data) =>
    api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) =>
    api.put('/auth/profile', data),

  // Addresses
  getAddresses: () => api.get('/addresses'),
  addAddress: (data) => api.post('/addresses', data),
  updateAddress: (id, data) => api.put(`/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/addresses/${id}`),
  setDefaultAddress: (id) => api.patch(`/addresses/${id}/default`),

  // Catalog
  getBanners: () => api.get('/banners'),
  getCategories: () => api.get('/categories'),
  getProducts: (params) =>
    api.get('/products', { params }),
  getProductDetails: (idOrSlug) => api.get(`/products/${idOrSlug}`),

  // Persistent Cart CRUD
  getCart: () => api.get('/cart'),
  addToCart: (data) =>
    api.post('/cart/items', data),
  updateCartItem: (id, qty) =>
    api.patch(`/cart/items/${id}`, { qty }),
  removeCartItem: (id) => api.delete(`/cart/items/${id}`),
  clearCart: () => api.delete('/cart'),
  applyCoupon: (code) => api.post('/cart/coupon', { code }),
  removeCoupon: () => api.delete('/cart/coupon'),

  // Serviceability & Checkout
  checkServiceability: (data) =>
    api.post('/checkout/serviceability', data),
  validateCheckout: () => api.post('/checkout/validate'),
  createPaymentIntent: () => api.post('/checkout/create-intent'),
  placeOrder: (data) =>
    api.post('/checkout/place-order', data),

  // Orders & Tracking
  getOrders: (params) =>
    api.get('/orders', { params }),
  getOrderDetails: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) =>
    api.post(`/orders/${id}/cancel`, { reason }),
  reorder: (id) => api.post(`/orders/${id}/reorder`),

  // Support Tickets
  createSupportTicket: (data) =>
    api.post('/issues', data),
  getSupportTickets: () => api.get('/issues'),

  // Notifications & Push Tokens
  registerPushToken: (token) => api.post('/notifications/push-token', { token }),
  deletePushToken: () => api.delete('/notifications/push-token'),
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch('/notifications/read-all')
};

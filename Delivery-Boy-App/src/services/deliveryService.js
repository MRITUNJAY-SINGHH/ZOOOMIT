import { api } from './api';

export const deliveryService = {
  // Authentication
  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    if (res.data && res.data.role !== 'DeliveryBoy' && res.data.role !== 'Admin') {
      throw new Error('Access denied. This app is exclusively for authorized delivery partners.');
    }
    return res.data;
  },

  // Profile & Status
  async getProfile() {
    const res = await api.get('/delivery/profile');
    return res.data;
  },

  async toggleOnline(isOnline) {
    const res = await api.put('/delivery/toggle-online', { isOnline });
    return res.data;
  },

  async updatePushToken(pushToken) {
    const res = await api.put('/delivery/push-token', { pushToken });
    return res.data;
  },

  async updateLocation(latitude, longitude) {
    const res = await api.put('/delivery/location', { latitude, longitude });
    return res.data;
  },

  // Dashboard & Analytics
  async getDashboard() {
    const res = await api.get('/delivery/dashboard');
    return res.data;
  },

  async getEarnings(period = 'today') {
    const res = await api.get('/delivery/earnings', { params: { period } });
    return res.data;
  },

  // Orders
  async getAvailableOrders() {
    const res = await api.get('/delivery/orders/available');
    return res.data;
  },

  async getOrders(status = 'all', page = 1, limit = 20) {
    const res = await api.get('/delivery/orders', {
      params: { status, page, limit }
    });
    return res.data;
  },

  async getOrderDetails(orderId) {
    const res = await api.get(`/delivery/orders/${orderId}`);
    return res.data;
  },

  // Order Actions
  async acceptOrder(orderId) {
    const res = await api.post(`/delivery/orders/${orderId}/accept`);
    return res.data;
  },

  async rejectOrder(orderId, reason) {
    const res = await api.post(`/delivery/orders/${orderId}/reject`, { reason });
    return res.data;
  },

  async updateOrderStatus(orderId, status, note = '') {
    const res = await api.put(`/delivery/orders/${orderId}/status`, { status, note });
    return res.data;
  },

  async verifyDeliveryOtp(orderId, otp) {
    const res = await api.post(`/delivery/orders/${orderId}/verify-otp`, { otp });
    return res.data;
  },

  async cancelOrder(orderId, reason, details = '') {
    const res = await api.post(`/delivery/orders/${orderId}/cancel`, { reason, details });
    return res.data;
  }
};

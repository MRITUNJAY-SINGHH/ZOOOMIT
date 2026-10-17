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

  async updateProfile(data) {
    const res = await api.put('/delivery/profile', data);
    return res.data;
  },

  async submitFeedback(category, message, orderId = '') {
    const res = await api.post('/delivery/feedback', { category, message, orderId });
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

  async getEarnings(period = 'overview') {
    const res = await api.get('/delivery/earnings', { params: { period } });
    return res.data;
  },

  async getSettlements() {
    const res = await api.get('/delivery/settlements');
    return res.data;
  },

  async confirmStoreCashSettlement(riderId, amountCollected, notes = '', storeName = '') {
    const res = await api.post('/delivery/settlements/confirm', {
      riderId,
      amountCollected,
      notes,
      storeName
    });
    return res.data;
  },

  // Orders
  async getAvailableOrders() {
    const res = await api.get('/delivery/orders/available');
    return res.data;
  },

  async getOrders(status = 'in_progress', page = 1, limit = 20, search = '') {
    const res = await api.get('/delivery/orders', {
      params: { status, page, limit, search }
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

  async regenerateDeliveryOtp(orderId) {
    const res = await api.post(`/delivery/orders/${orderId}/regenerate-otp`);
    return res.data;
  },

  async cancelOrder(orderId, reason, details = '') {
    const res = await api.post(`/delivery/orders/${orderId}/cancel`, { reason, details });
    return res.data;
  },

  // Notifications
  async getNotifications() {
    const res = await api.get('/notifications');
    return res.data;
  },

  async markNotificationRead(notificationId) {
    const res = await api.put(`/notifications/${notificationId}/read`);
    return res.data;
  },

  async markAllNotificationsRead() {
    const res = await api.post('/notifications/mark-all');
    return res.data;
  },

  async clearAllNotifications() {
    const res = await api.delete('/notifications/clear-all');
    return res.data;
  }
};

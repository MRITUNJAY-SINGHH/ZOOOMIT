import Notification from '../models/Notification.js';

class NotificationService {
  async createNotification({ type, message, product, batch, order }) {
    try {
      await Notification.create({
        type,
        message,
        product: product || null,
        batch: batch || null,
        order: order || null
      });
    } catch (error) {
      console.error('Notification System Error:', error.message);
    }
  }
}

export default new NotificationService();

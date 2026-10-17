import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, clearAllNotifications } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getNotifications)
  .delete(protect, clearAllNotifications);

router.route('/mark-all')
  .post(protect, markAllAsRead)
  .put(protect, markAllAsRead);

router.route('/clear-all')
  .post(protect, clearAllNotifications)
  .delete(protect, clearAllNotifications);

router.route('/:id/read')
  .put(protect, markAsRead)
  .patch(protect, markAsRead);

export default router;

import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getNotifications);

router.route('/mark-all')
  .post(protect, markAllAsRead);

router.route('/:id/read')
  .put(protect, markAsRead);

export default router;

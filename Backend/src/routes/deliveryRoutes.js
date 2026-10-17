import express from 'express';
import {
  getDeliveryProfile,
  toggleOnline,
  updatePushToken,
  updateLocation,
  getDashboardStats,
  getAvailableOrders,
  acceptOrder,
  rejectOrder,
  updateOrderStatusStep,
  verifyOtpAndDeliver,
  cancelOrderWithReason,
  getRiderOrders,
  getRiderOrderDetails,
  getRiderEarnings
} from '../controllers/deliveryController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All delivery partner routes require authentication and DeliveryBoy role
router.use(protect, restrictTo('DeliveryBoy', 'Admin'));

// Profile & Status
router.get('/profile', getDeliveryProfile);
router.put('/toggle-online', toggleOnline);
router.put('/push-token', updatePushToken);
router.put('/location', updateLocation);

// Dashboard & Stats
router.get('/dashboard', getDashboardStats);
router.get('/earnings', getRiderEarnings);

// Orders Management
router.get('/orders/available', getAvailableOrders);
router.get('/orders', getRiderOrders);
router.get('/orders/:id', getRiderOrderDetails);

// Order Actions
router.post('/orders/:id/accept', acceptOrder);
router.post('/orders/:id/reject', rejectOrder);
router.put('/orders/:id/status', updateOrderStatusStep);
router.post('/orders/:id/verify-otp', verifyOtpAndDeliver);
router.post('/orders/:id/cancel', cancelOrderWithReason);

export default router;

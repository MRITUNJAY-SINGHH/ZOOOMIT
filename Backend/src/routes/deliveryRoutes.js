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
  regenerateDeliveryOtp,
  cancelOrderWithReason,
  getRiderOrders,
  getRiderOrderDetails,
  getRiderEarnings,
  getRiderSettlements,
  confirmStoreCashSettlement,
  updateDeliveryProfile,
  submitPartnerFeedback
} from '../controllers/deliveryController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All delivery partner routes require authentication and DeliveryBoy role
router.use(protect, restrictTo('DeliveryBoy', 'Admin'));

// Profile & Status
router.get('/profile', getDeliveryProfile);
router.put('/profile', updateDeliveryProfile);
router.put('/toggle-online', toggleOnline);
router.put('/push-token', updatePushToken);
router.put('/location', updateLocation);

// Partner Feedback & Support
router.post('/feedback', submitPartnerFeedback);

// Dashboard, Earnings & Store Cash Settlements
router.get('/dashboard', getDashboardStats);
router.get('/earnings', getRiderEarnings);
router.get('/settlements', getRiderSettlements);
router.post('/settlements/confirm', confirmStoreCashSettlement);

// Orders Management
router.get('/orders/available', getAvailableOrders);
router.get('/orders', getRiderOrders);
router.get('/orders/:id', getRiderOrderDetails);

// Order Actions
router.post('/orders/:id/accept', acceptOrder);
router.post('/orders/:id/reject', rejectOrder);
router.put('/orders/:id/status', updateOrderStatusStep);
router.post('/orders/:id/verify-otp', verifyOtpAndDeliver);
router.post('/orders/:id/regenerate-otp', regenerateDeliveryOtp);
router.post('/orders/:id/cancel', cancelOrderWithReason);

export default router;

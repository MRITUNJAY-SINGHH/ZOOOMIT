import express from 'express';
import { getOrders, getOrderById, createOrder, updateOrderStatus, assignRider, cancelOrder, getOrderTimeline, getMyDeliveries, updateDeliveryStatus } from '../controllers/orderController.js';
import { protect, authorize, restrictTo } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15,
  message: { message: 'Too many order requests, please try again later.' }
});

const router = express.Router();

router.route('/')
  .get(protect, authorize('orders', 'view'), getOrders)
  .post(protect, orderLimiter, createOrder);

// Delivery boy endpoints must come before /:id to avoid matching :id to 'delivery'
router.route('/delivery/my-orders')
  .get(protect, restrictTo('DeliveryBoy'), getMyDeliveries);

router.route('/delivery/:id/status')
  .put(protect, restrictTo('DeliveryBoy'), updateDeliveryStatus);

router.route('/:id')
  .get(protect, authorize('orders', 'view'), getOrderById)
  .put(protect, authorize('orders', 'edit'), updateOrderStatus);

router.route('/:id/assign')
  .put(protect, authorize('orders', 'edit'), assignRider);

router.route('/:id/cancel')
  .post(protect, cancelOrder);

router.route('/:id/timeline')
  .get(protect, authorize('orders', 'view'), getOrderTimeline);

export default router;

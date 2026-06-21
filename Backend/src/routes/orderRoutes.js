import express from 'express';
import { getOrders, getOrderById, createOrder, updateOrderStatus, assignRider, cancelOrder, getOrderTimeline } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('orders'), getOrders)
  .post(protect, createOrder);

router.route('/:id')
  .get(protect, authorize('orders'), getOrderById)
  .put(protect, authorize('orders'), updateOrderStatus);

router.route('/:id/assign')
  .put(protect, authorize('orders'), assignRider);

router.route('/:id/cancel')
  .post(protect, cancelOrder);

router.route('/:id/timeline')
  .get(protect, authorize('orders'), getOrderTimeline);

export default router;

import express from 'express';
import { getSalesReport, getInventoryReport, getPaymentsReport, getCustomerReport, getDashboardStats } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/dashboard').get(protect, authorize('reports'), getDashboardStats);
router.route('/sales').get(protect, authorize('reports'), getSalesReport);
router.route('/inventory').get(protect, authorize('reports'), getInventoryReport);
router.route('/payments').get(protect, authorize('reports'), getPaymentsReport);
router.route('/customer').get(protect, authorize('reports'), getCustomerReport);

export default router;

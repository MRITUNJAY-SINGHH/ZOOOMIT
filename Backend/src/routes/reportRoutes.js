import express from 'express';
import { getDashboardStats, getSalesChart, getSalesReport, getInventoryReport, getPaymentsReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/dashboard').get(protect, authorize('reports'), getDashboardStats);
router.route('/sales-chart').get(protect, authorize('reports'), getSalesChart);
router.route('/sales').get(protect, authorize('reports'), getSalesReport);
router.route('/inventory').get(protect, authorize('reports'), getInventoryReport);
router.route('/payments').get(protect, authorize('reports'), getPaymentsReport);

export default router;

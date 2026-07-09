import express from 'express';
import { getSalesReport, getInventoryReport, getPaymentsReport, getCustomerReport, getDashboardStats, getSalesChart, getOrdersChart, getTopSellingProducts } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.route('/dashboard').get(protect, authorize('reports', 'view'), cacheMiddleware(300), getDashboardStats);
router.route('/sales').get(protect, authorize('reports', 'view'), cacheMiddleware(300), getSalesReport);
router.route('/inventory').get(protect, authorize('reports', 'view'), cacheMiddleware(300), getInventoryReport);
router.route('/payments').get(protect, authorize('reports', 'view'), cacheMiddleware(300), getPaymentsReport);
router.route('/customer').get(protect, authorize('reports', 'view'), cacheMiddleware(300), getCustomerReport);
router.route('/sales-chart').get(protect, authorize('reports', 'view'), cacheMiddleware(300), getSalesChart);
router.route('/orders-chart').get(protect, authorize('reports', 'view'), cacheMiddleware(300), getOrdersChart);
router.route('/top-selling').get(protect, authorize('reports', 'view'), cacheMiddleware(300), getTopSellingProducts);

export default router;

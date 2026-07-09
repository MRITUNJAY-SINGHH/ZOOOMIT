import express from 'express';
import { addStockEntry, getInventoryLogs, getExpiringProducts, getLowStockProducts } from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/stock-entry')
  .post(protect, authorize('inventory', 'create'), addStockEntry);

router.route('/logs')
  .get(protect, authorize('inventory', 'view'), getInventoryLogs);

router.route('/expiring')
  .get(protect, authorize('inventory', 'view'), getExpiringProducts);

router.route('/low-stock')
  .get(protect, authorize('inventory', 'view'), getLowStockProducts);

export default router;

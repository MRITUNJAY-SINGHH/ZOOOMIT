import express from 'express';
import { addStockEntry, getInventoryLogs, getExpiringProducts, getLowStockProducts } from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/stock-entry')
  .post(protect, authorize('inventory'), addStockEntry);

router.route('/logs')
  .get(protect, authorize('inventory'), getInventoryLogs);

router.route('/expiring')
  .get(protect, authorize('inventory'), getExpiringProducts);

router.route('/low-stock')
  .get(protect, authorize('inventory'), getLowStockProducts);

export default router;

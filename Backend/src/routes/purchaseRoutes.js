import express from 'express';
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseEntries,
  getPurchaseEntry,
  createPurchaseEntry,
  updatePurchaseEntry,
  finalizePurchaseEntry,
  getPurchaseReturns,
  createPurchaseReturn
} from '../controllers/purchaseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all purchase routes
router.use(protect);

// ========================
// PURCHASE ORDERS
// ========================
router.get('/orders', authorize('purchase', 'view'), getPurchaseOrders);
router.get('/orders/:id', authorize('purchase', 'view'), getPurchaseOrder);
router.post('/orders', authorize('purchase', 'create'), createPurchaseOrder);
router.put('/orders/:id', authorize('purchase', 'edit'), updatePurchaseOrder);

// ========================
// PURCHASE ENTRY (GRN)
// ========================
router.get('/entries', authorize('purchase', 'view'), getPurchaseEntries);
router.get('/entries/:id', authorize('purchase', 'view'), getPurchaseEntry);
router.post('/entries', authorize('purchase', 'create'), createPurchaseEntry);
router.put('/entries/:id', authorize('purchase', 'edit'), updatePurchaseEntry);
router.post('/entries/:id/finalize', authorize('purchase', 'finalize'), finalizePurchaseEntry);

// ========================
// PURCHASE RETURNS
// ========================
router.get('/returns', authorize('purchase', 'view'), getPurchaseReturns);
router.post('/returns', authorize('purchase', 'return'), createPurchaseReturn);

export default router;

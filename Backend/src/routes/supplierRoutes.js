import express from 'express';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('inventory'), getSuppliers)
  .post(protect, authorize('inventory'), createSupplier);

router.route('/:id')
  .put(protect, authorize('inventory'), updateSupplier)
  .delete(protect, authorize('inventory'), deleteSupplier);

export default router;

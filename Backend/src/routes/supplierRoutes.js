import express from 'express';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('inventory', 'view'), getSuppliers)
  .post(protect, authorize('inventory', 'create'), createSupplier);

router.route('/:id')
  .put(protect, authorize('inventory', 'edit'), updateSupplier)
  .delete(protect, authorize('inventory', 'delete'), deleteSupplier);

export default router;

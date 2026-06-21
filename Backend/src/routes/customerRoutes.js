import express from 'express';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('pos'), getCustomers) // POS usually needs customer search
  .post(protect, authorize('pos'), createCustomer);

router.route('/:id')
  .put(protect, authorize('pos'), updateCustomer)
  .delete(protect, authorize('pos'), deleteCustomer);

export default router;

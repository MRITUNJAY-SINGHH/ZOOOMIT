import express from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('pos'), getCustomers) // POS usually needs customer search
  .post(protect, authorize('pos'), createCustomer);

router.route('/:id')
  .get(protect, authorize('pos'), getCustomerById)
  .put(protect, authorize('pos'), updateCustomer)
  .delete(protect, authorize('pos'), deleteCustomer);

export default router;

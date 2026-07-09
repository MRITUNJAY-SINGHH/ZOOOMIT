import express from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('customers', 'view'), getCustomers)
  .post(protect, authorize('customers', 'create'), createCustomer);

router.route('/:id')
  .get(protect, authorize('customers', 'view'), getCustomerById)
  .put(protect, authorize('customers', 'edit'), updateCustomer)
  .delete(protect, authorize('customers', 'delete'), deleteCustomer);

export default router;

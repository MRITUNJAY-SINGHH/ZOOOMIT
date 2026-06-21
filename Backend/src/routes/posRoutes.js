import express from 'express';
import { holdBill, getHeldBills, resumeBill, deleteHeldBill, posCheckout, posReturn } from '../controllers/posController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Hold Bills CRUD
router.route('/hold')
  .post(protect, authorize('pos'), holdBill)
  .get(protect, authorize('pos'), getHeldBills);

router.route('/hold/:id')
  .get(protect, authorize('pos'), resumeBill)
  .delete(protect, authorize('pos'), deleteHeldBill);

// POS Checkout & Returns
router.route('/checkout')
  .post(protect, authorize('pos'), posCheckout);

router.route('/return')
  .post(protect, authorize('pos'), posReturn);

export default router;

import express from 'express';
import { holdBill, getHeldBills, resumeBill, deleteHeldBill, posCheckout, posReturn, posSync } from '../controllers/posController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const checkoutLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 checkout requests per `window`
  message: { message: 'Too many checkout attempts, please try again later.' }
});

const router = express.Router();

// Hold Bills CRUD
router.route('/hold')
  .post(protect, authorize('pos', 'create'), holdBill)
  .get(protect, authorize('pos', 'view'), getHeldBills);

router.route('/hold/:id')
  .get(protect, authorize('pos', 'view'), resumeBill)
  .delete(protect, authorize('pos', 'delete'), deleteHeldBill);

// POS Checkout & Returns
router.route('/checkout')
  .post(protect, authorize('pos', 'create'), checkoutLimiter, posCheckout);

router.route('/return')
  .post(protect, authorize('pos', 'create'), checkoutLimiter, posReturn);

router.route('/sync')
  .post(protect, authorize('pos', 'create'), posSync);

export default router;

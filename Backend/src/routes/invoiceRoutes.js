import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  bulkDeleteInvoices,
  generateInvoicePdf
} from '../controllers/invoiceController.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('payments'), getInvoices)
  .post(protect, authorize('payments'), createInvoice);

router.post('/bulk-delete', protect, authorize('payments'), bulkDeleteInvoices);

router.route('/:id/pdf')
  .get(protect, generateInvoicePdf);

router.route('/:id')
  .get(protect, authorize('payments'), getInvoiceById)
  .put(protect, authorize('payments'), updateInvoice)
  .delete(protect, authorize('payments'), deleteInvoice);

export default router;

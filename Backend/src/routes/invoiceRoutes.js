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
  .get(protect, authorize('payments', 'view'), getInvoices)
  .post(protect, authorize('payments', 'create'), createInvoice);

router.post('/bulk-delete', protect, authorize('payments', 'create'), bulkDeleteInvoices);

// PDF routes moved to documentRoutes

router.route('/:id/pdf')
  .get(protect, generateInvoicePdf);

router.route('/:id')
  .get(protect, authorize('payments', 'view'), getInvoiceById)
  .put(protect, authorize('payments', 'edit'), updateInvoice)
  .delete(protect, authorize('payments', 'delete'), deleteInvoice);

export default router;

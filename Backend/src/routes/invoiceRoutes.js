import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  bulkDeleteInvoices,
  downloadInvoicePdf
} from '../controllers/invoiceController.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('payments', 'view'), getInvoices)
  .post(protect, authorize('payments', 'create'), createInvoice);

router.post('/bulk-delete', protect, authorize('payments', 'create'), bulkDeleteInvoices);

router.get('/:id/pdf', protect, authorize('payments', 'view'), downloadInvoicePdf);

router.route('/:id')
  .get(protect, authorize('payments', 'view'), getInvoiceById)
  .put(protect, authorize('payments', 'edit'), updateInvoice)
  .delete(protect, authorize('payments', 'delete'), deleteInvoice);

export default router;

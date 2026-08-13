import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  downloadInvoicePdf,
  downloadCancelledPdf,
  downloadReturnPdf,
  emailInvoicePdf,
  emailCancelledPdf,
  emailReturnPdf
} from '../controllers/pdfController.js';

const router = express.Router();

router.get('/invoice/:id/pdf', protect, authorize('payments', 'view'), downloadInvoicePdf);
router.get('/cancellation/:id/pdf', protect, authorize('payments', 'view'), downloadCancelledPdf);
router.get('/return/:id/pdf', protect, authorize('payments', 'view'), downloadReturnPdf);

router.post('/invoice/:id/email', protect, authorize('payments', 'view'), emailInvoicePdf);
router.post('/cancellation/:id/email', protect, authorize('payments', 'view'), emailCancelledPdf);
router.post('/return/:id/email', protect, authorize('payments', 'view'), emailReturnPdf);

export default router;

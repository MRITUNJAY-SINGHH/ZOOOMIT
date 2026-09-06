import mongoose from 'mongoose';

const cancelledDocumentSchema = new mongoose.Schema({
  documentNumber: { type: String, required: true, unique: true }, // e.g., CAN-2026-000001
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }, // Optional, if invoice was generated
  originalInvoiceNumber: { type: String },

  // Exact snapshot of the order/invoice at the time of cancellation
  snapshot: { type: Object, required: true },

  cancellationReason: { type: String, required: true },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  refundStatus: { type: String, enum: ['Not Required', 'Pending', 'Completed', 'Failed'], default: 'Not Required' },
  refundAmount: { type: Number, default: 0 },
  razorpayRefundId: { type: String },

  date: { type: Date, default: Date.now }
}, { timestamps: true });

const CancelledDocument = mongoose.model('CancelledDocument', cancelledDocumentSchema);
export default CancelledDocument;

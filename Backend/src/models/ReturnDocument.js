import mongoose from 'mongoose';

const returnDocumentSchema = new mongoose.Schema({
  documentNumber: { type: String, required: true, unique: true }, // e.g., RET-2026-000001
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  originalInvoiceNumber: { type: String },

  // The actual backend-calculated return snapshot
  returnedItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String },
    originalQty: { type: Number },
    returnedQty: { type: Number },
    price: { type: Number },
    amount: { type: Number }
  }],

  returnAmount: { type: Number, required: true },
  returnReason: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  refundStatus: { type: String, enum: ['Not Required', 'Pending', 'Completed', 'Failed'], default: 'Completed' },
  refundMethod: { type: String }, // e.g., 'Cash', 'Source'
  razorpayRefundId: { type: String },

  date: { type: Date, default: Date.now }
}, { timestamps: true });

const ReturnDocument = mongoose.model('ReturnDocument', returnDocumentSchema);
export default ReturnDocument;

import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true }, // System generated or gateway ID
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  
  orderType: { type: String, enum: ['ONLINE', 'OFFLINE'], required: true },
  
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'NetBanking', 'Wallet'], required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'PartiallyRefunded', 'Refunded'], required: true },
  refundStatus: { type: String, enum: ['None', 'Pending', 'Processed', 'Failed'], default: 'None' },
  
  amount: { type: Number, required: true },
  refundAmount: { type: Number, default: 0 },
  
  referenceNumber: { type: String }, // e.g. UPI UTR number or Card auth code
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpayRefundId: { type: String },
  paidAt: { type: Date },
  
}, { timestamps: true });

transactionSchema.index({ order: 1 });
transactionSchema.index({ paymentStatus: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;

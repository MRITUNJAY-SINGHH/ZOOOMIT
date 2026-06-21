import mongoose from 'mongoose';

const refundQueueSchema = new mongoose.Schema({
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Retrying', 'Processed', 'Failed'], default: 'Pending' },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: { type: Date },
  errorReason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const RefundQueue = mongoose.model('RefundQueue', refundQueueSchema);
export default RefundQueue;

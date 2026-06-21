import mongoose from 'mongoose';

const heldBillSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null }, // Walk-in if null
  referenceName: { type: String, required: true }, // e.g. "Table 5" or "Waiting Customer"
  items: { type: Array, required: true }, // cart items snapshot
  totals: {
    subTotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, required: true },
    amount: { type: Number, required: true }
  }
}, { timestamps: true });

const HeldBill = mongoose.model('HeldBill', heldBillSchema);
export default HeldBill;

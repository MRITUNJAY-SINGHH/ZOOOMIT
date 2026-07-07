import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true }, // e.g., INV-2026-00001 or POS-2026-00001
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  dueDate: { type: Date },
  paymentMethod: { type: String },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled'], default: 'Paid' },

  // Snapshots to prevent breaking historical records if product details change
  customerSnapshot: { type: Object, required: true }, // Name, Phone, Email
  productSnapshot: { type: Array, required: true }, // [ { productName, sku, qty, price, total } ]
  billingAddressSnapshot: { type: Object },
  shippingAddressSnapshot: { type: Object },

  totalsSnapshot: {
    subTotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, required: true },
    amount: { type: Number, required: true }
  },

  isCancelled: { type: Boolean, default: false }, // To add watermark later
  notes: { type: String },

  date: { type: Date, default: Date.now }
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;

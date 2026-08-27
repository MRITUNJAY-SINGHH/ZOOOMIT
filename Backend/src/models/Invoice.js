import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date },
  
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  isCancelled: { type: Boolean, default: false },
  
  paymentMethod: { type: String, default: 'Cash' },
  status: { type: String, enum: ['Paid', 'Unpaid', 'Partially Paid', 'Overdue', 'Cancelled'], default: 'Paid' },
  currency: { type: String, default: 'INR' },
  
  // Snapshots
  customerSnapshot: {
    name: String,
    phone: String,
    email: String,
    gstNumber: String
  },
  billingAddressSnapshot: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  shippingAddressSnapshot: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  productSnapshot: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    sku: String,
    unit: { type: String, default: 'PCS' },
    hsnCode: String,
    qty: Number,
    price: Number,
    taxRate: { type: Number, default: 0 },
    taxableAmount: Number,
    taxAmount: { type: Number, default: 0 },
    total: Number
  }],
  totalsSnapshot: {
    subTotal: Number,
    taxableAmount: Number,
    tax: Number,
    cgst: Number,
    sgst: Number,
    igst: Number,
    discount: Number,
    amount: Number
  },
  
  notes: String
}, { timestamps: true });

invoiceSchema.index({ date: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;

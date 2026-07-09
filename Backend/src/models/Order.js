import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  // Snapshots
  productName: { type: String, required: true },
  productImage: { type: String }, // Added for image snapshot
  sku: { type: String },
  barcode: { type: String },
  qty: { type: Number, required: true },
  returnedQty: { type: Number, default: 0 }, // For partial returns
  price: { type: Number, required: true },
  total: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true }, // Main system order number
  billNumber: { type: String, unique: true, sparse: true }, // Retail POS bill number (e.g. POS-2026-00001)
  orderType: { type: String, enum: ['ONLINE', 'OFFLINE'], required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Optional for walk-ins
  offlineId: { type: String, unique: true, sparse: true }, // Idempotency key for offline POS syncing
  
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Assigned', 'Accepted', 'Picked Up', 'OutForDelivery', 'Out For Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'],
    default: 'Pending'
  },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Failed', 'PartiallyRefunded', 'Refunded'], 
    default: 'Pending' 
  },
  refundStatus: { 
    type: String, 
    enum: ['None', 'Pending', 'Processed', 'Failed'], 
    default: 'None' 
  },
  
  items: [orderItemSchema],
  
  subTotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  amount: { type: Number, required: true }, // Final Total
  
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  
  // Rider Assignment
  assignedRider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date },
  deliveredAt: { type: Date },
  
  // Cancellation Details
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Or Customer if customer cancelled
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  
  date: { type: Date, default: Date.now }
}, { timestamps: true });

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderType: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;

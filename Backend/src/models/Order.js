import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  productName: { type: String, required: true },
  productImage: { type: String },
  sku: { type: String },
  barcode: { type: String },
  unit: { type: String, default: 'PCS' }, // e.g. KG, PCS, PACK
  qty: { type: Number, required: true }, // Supports decimals (e.g. 1.20 KG)
  returnedQty: { type: Number, default: 0 },
  price: { type: Number, required: true },
  taxRate: { type: Number, default: 0 }, // GST %
  taxableAmount: { type: Number },
  taxAmount: { type: Number, default: 0 },
  hsnCode: { type: String },
  total: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  billNumber: { type: String, unique: true, sparse: true },
  orderType: { type: String, enum: ['ONLINE', 'OFFLINE'], required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  offlineId: { type: String, unique: true, sparse: true },
  
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
  taxableAmount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 }, // Total GST
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  amount: { type: Number, required: true }, // Final Total
  
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  
  // Shipping / Delivery Address
  shippingAddress: {
    label: { type: String, default: 'Home' },
    street: { type: String },
    landmark: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String, default: 'India' },
    formattedAddress: { type: String },
    contactName: { type: String },
    contactPhone: { type: String }
  },

  // Payment Tracking
  paymentMethod: { type: String, enum: ['Cash', 'Online', 'COD', 'Razorpay'], default: 'COD' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },

  // Secure Delivery OTP
  deliveryOtp: {
    hash: { type: String },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 },
    verifiedAt: { type: Date }
  },
  
  // Rider Assignment
  assignedRider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date },
  deliveredAt: { type: Date },
  
  // Cancellation Details
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledByCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  
  date: { type: Date, default: Date.now }
}, { timestamps: true });

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderType: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;

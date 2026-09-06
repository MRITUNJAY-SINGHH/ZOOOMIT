import mongoose from 'mongoose';

const orderActivitySchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  
  status: { 
    type: String, 
    enum: ['Order Created', 'Payment Received', 'Pending', 'Confirmed', 'Assigned', 'Assigned To Rider', 'Accepted', 'Picked Up', 'OutForDelivery', 'Out For Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded', 'Rejected'],
    required: true 
  },
  
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The staff/admin/rider who triggered this
  system: { type: Boolean, default: false }, // True if triggered automatically
  
  note: { type: String }, // Optional context
  timestamp: { type: Date, default: Date.now }
});

const OrderActivity = mongoose.model('OrderActivity', orderActivitySchema);
export default OrderActivity;

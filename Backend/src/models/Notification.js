import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, default: 'Notification' },
  type: { 
    type: String, 
    enum: [
      'Low Stock', 'Expiring Product', 'New Order', 'Cancelled Order', 'Returned Order', 
      'Refund Failure', 'Stock Adjustment', 'Rider Assigned',
      'Order Placed', 'Order Confirmed', 'Order Out For Delivery', 'Order Delivered', 
      'Order Cancelled', 'Refund Update', 'Support Update', 'Promotion'
    ],
    required: true
  },
  
  message: { type: String, required: true },
  
  // Recipient
  recipientType: { type: String, enum: ['User', 'Customer'], default: 'User' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  
  // Optional links to relevant documents
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  
  // Deep link payload (e.g. { screen: 'OrderDetails', params: { orderId: '...' } })
  data: { type: mongoose.Schema.Types.Mixed },
  
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
}, { timestamps: true });

notificationSchema.index({ isRead: 1 });
notificationSchema.index({ customer: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

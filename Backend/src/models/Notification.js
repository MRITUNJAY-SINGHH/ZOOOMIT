import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['Low Stock', 'Expiring Product', 'New Order', 'Cancelled Order', 'Returned Order', 'Refund Failure', 'Stock Adjustment', 'Rider Assigned'],
    required: true
  },
  
  message: { type: String, required: true },
  
  // Optional links to relevant documents
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Specific user this notification is for (e.g. rider)
  
  isRead: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Which admins/staff have read it
  
}, { timestamps: true });

notificationSchema.index({ isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderItemId: { type: mongoose.Schema.Types.ObjectId }, // Specific line item in Order.items
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  
  issueType: { 
    type: String, 
    enum: ['Damaged Item', 'Missing Item', 'Expired Product', 'Wrong Item', 'Quality Issue', 'Delivery Delay', 'Return Request', 'Other'],
    required: true 
  },
  description: { type: String, required: true, trim: true },
  images: [{ type: String }],
  
  // Return / Partial Refund Workflow
  eligibleQty: { type: Number, default: 0 },
  requestedReturnQty: { type: Number, default: 0 },
  refundAmount: { type: Number, default: 0 },
  
  status: { 
    type: String, 
    enum: ['Requested', 'Approved', 'Processing', 'Refunded', 'Rejected', 'Closed'], 
    default: 'Requested' 
  },
  resolutionNote: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date }
}, { timestamps: true });

supportTicketSchema.index({ customer: 1, createdAt: -1 });
supportTicketSchema.index({ order: 1 });
supportTicketSchema.index({ status: 1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;

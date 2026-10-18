import mongoose from 'mongoose';

const partnerSupportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    riderName: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: [
        'Order not assigned',
        'Pickup or store issue',
        'Delivery OTP problem',
        'Customer or address issue',
        'Earnings or cash-collection issue',
        'App or login issue',
        'Other'
      ],
      required: true
    },
    orderId: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved'],
      default: 'Open'
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ['rider', 'support', 'system'],
          default: 'rider'
        },
        senderName: {
          type: String,
          default: ''
        },
        text: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

partnerSupportTicketSchema.index({ rider: 1, createdAt: -1 });
partnerSupportTicketSchema.index({ status: 1 });

const PartnerSupportTicket = mongoose.model('PartnerSupportTicket', partnerSupportTicketSchema);
export default PartnerSupportTicket;

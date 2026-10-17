import mongoose from 'mongoose';

const partnerFeedbackSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  riderName: { type: String, default: '' },
  category: {
    type: String,
    enum: ['delivery_issue', 'app_problem', 'suggestion', 'general_feedback'],
    required: true
  },
  orderId: { type: String, default: '', trim: true },
  message: { type: String, required: true, maxlength: 500, trim: true },
  status: {
    type: String,
    enum: ['Received', 'Under Review', 'Resolved'],
    default: 'Received'
  }
}, { timestamps: true });

partnerFeedbackSchema.index({ rider: 1, createdAt: -1 });
partnerFeedbackSchema.index({ category: 1 });

const PartnerFeedback = mongoose.model('PartnerFeedback', partnerFeedbackSchema);
export default PartnerFeedback;

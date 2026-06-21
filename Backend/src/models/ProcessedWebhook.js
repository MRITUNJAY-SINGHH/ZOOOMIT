import mongoose from 'mongoose';

const processedWebhookSchema = new mongoose.Schema({
  webhookId: { type: String, required: true, unique: true },
  event: { type: String, required: true },
  processedAt: { type: Date, default: Date.now }
});

const ProcessedWebhook = mongoose.model('ProcessedWebhook', processedWebhookSchema);
export default ProcessedWebhook;

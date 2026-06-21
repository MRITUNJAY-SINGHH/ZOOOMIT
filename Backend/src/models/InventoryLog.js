import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch' },
  
  type: { 
    type: String, 
    enum: ['SALE', 'PURCHASE', 'RETURN', 'CANCELLED_ORDER', 'STOCK_ADJUSTMENT', 'EXPIRED', 'DAMAGED'], 
    required: true 
  },
  
  previousStock: { type: Number, required: true },
  quantityChanged: { type: Number, required: true }, // + or - depending on type
  newStock: { type: Number, required: true },
  
  reason: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Staff/Admin who made the change
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Related order if applicable
  
  date: { type: Date, default: Date.now }
}, { timestamps: true });

inventoryLogSchema.index({ product: 1 });
inventoryLogSchema.index({ date: 1 });

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
export default InventoryLog;

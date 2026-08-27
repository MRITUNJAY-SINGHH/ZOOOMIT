import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  
  type: { 
    type: String, 
    enum: ['SALE', 'PURCHASE', 'RETURN', 'CANCELLED_ORDER', 'STOCK_ADJUSTMENT', 'DAMAGED', 'SUPPLIER_RETURN'], 
    required: true 
  },
  
  unit: { type: String, default: 'PCS' },
  previousStock: { type: Number, required: true },
  quantityChanged: { type: Number, required: true }, // + or - (supports decimals)
  newStock: { type: Number, required: true },
  
  unitCost: { type: Number },
  totalCost: { type: Number },
  
  reason: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  
  date: { type: Date, default: Date.now }
}, { timestamps: true });

inventoryLogSchema.index({ product: 1, date: -1 });
inventoryLogSchema.index({ type: 1, date: -1 });

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
export default InventoryLog;

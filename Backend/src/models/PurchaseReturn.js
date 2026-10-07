import mongoose from 'mongoose';

const purchaseReturnItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch', required: true }, // Batch being returned
  
  returnQty: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true }, // Inherited from GRN
  returnAmount: { type: Number, required: true, min: 0 },
  reason: { type: String }
});

const purchaseReturnSchema = new mongoose.Schema({
  returnNumber: { type: String, required: true, unique: true }, // PR-2026-000001
  purchaseEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseEntry', required: true }, // GRN reference
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  
  returnDate: { type: Date, default: Date.now },
  items: [purchaseReturnItemSchema],
  
  // Financials
  totalReturnAmount: { type: Number, required: true, default: 0 },
  returnType: { 
    type: String, 
    enum: ['REFUND', 'SUPPLIER_CREDIT'], 
    required: true 
  },
  
  notes: { type: String }
}, { timestamps: true });

purchaseReturnSchema.index({ supplier: 1 });
purchaseReturnSchema.index({ purchaseEntry: 1 });


const PurchaseReturn = mongoose.model('PurchaseReturn', purchaseReturnSchema);
export default PurchaseReturn;

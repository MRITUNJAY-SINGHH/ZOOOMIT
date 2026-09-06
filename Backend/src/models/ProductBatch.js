import mongoose from 'mongoose';

const productBatchSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  batchNumber: { type: String, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  
  // Base Inventory Stock
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String, default: 'PCS' }, // Base inventory unit (e.g. KG, PCS)
  
  // Cost breakdown
  unitCost: { type: Number, required: true }, // Cost per 1 base unit (e.g. ₹42 / KG)
  totalCost: { type: Number, required: true }, // Total purchase cost for batch (e.g. ₹4200)
  costPrice: { type: Number }, // Maintained for legacy compatibility (equals unitCost)
  
  // Purchase Inward Context (if received in commercial units like BAG, BOX)
  purchaseUnit: { type: String }, // e.g. 'BAG'
  purchaseQty: { type: Number }, // e.g. 10
  purchaseUnitCost: { type: Number }, // e.g. ₹2100 / BAG
  
  // Dates
  manufacturingDate: { type: Date },
  expiryDate: { type: Date, default: null } // null when product hasExpiryTracking is false
}, { timestamps: true });

productBatchSchema.index({ product: 1, stock: 1, expiryDate: 1 });
productBatchSchema.index({ batchNumber: 1 });

const ProductBatch = mongoose.model('ProductBatch', productBatchSchema);
export default ProductBatch;

import mongoose from 'mongoose';

const productBatchSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' }, // Optional, if product has variants
  batchNumber: { type: String, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  
  stock: { type: Number, required: true, default: 0 },
  costPrice: { type: Number },
  
  manufacturingDate: { type: Date },
  expiryDate: { type: Date }
}, { timestamps: true });

productBatchSchema.index({ product: 1, stock: 1, expiryDate: 1 });

const ProductBatch = mongoose.model('ProductBatch', productBatchSchema);
export default ProductBatch;

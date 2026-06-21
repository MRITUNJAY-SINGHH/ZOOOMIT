import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true }, // e.g., "128GB Black"
  sku: { type: String, required: true, unique: true },
  
  // Variant specific pricing
  mrp: { type: Number },
  costPrice: { type: Number },
  sellingPrice: { type: Number },
  
  // Variant specific inventory
  stock: { type: Number, default: 0 },
  
  // Variant specific attributes
  attributes: [{
    key: String,   // e.g., "Color", "Size"
    value: String  // e.g., "Black", "XL"
  }],
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
export default ProductVariant;

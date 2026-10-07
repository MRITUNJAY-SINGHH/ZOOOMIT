import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true }, // e.g., "500 GM Pack", "Box of 12"
  sku: { type: String, required: true, unique: true },
  barcode: { 
    type: String, 
    unique: true, 
    sparse: true,
    set: v => v === '' ? undefined : v
  },
  
  // Pack & Unit Conversion mapping to Base Product
  conversionFactor: { type: Number, default: 1 }, // e.g. 0.5 for 500g in KG base, or 12 for Box of 12 PCS
  conversionUnit: { type: String, default: 'PCS' }, // e.g. 'KG', 'PCS'
  
  // Variant specific pricing
  mrp: { type: Number },
  costPrice: { type: Number },
  sellingPrice: { type: Number },
  
  // Variant specific inventory (if tracked separately from base bulk)
  stock: { type: Number, default: 0 },
  
  // Attributes
  attributes: [{
    key: String,   // e.g., "Weight", "Volume", "Color"
    value: String  // e.g., "500g", "1L", "Red"
  }],
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
export default ProductVariant;

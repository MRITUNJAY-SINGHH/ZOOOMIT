import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  tags: [{ type: String }],
  brand: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  
  // Base Identifiers
  baseSku: { type: String },
  barcode: { type: String, unique: true, sparse: true },
  
  // Pricing (can be overridden by variants)
  mrp: { type: Number },
  costPrice: { type: Number },
  sellingPrice: { type: Number },
  
  // Description & Media
  description: { type: String },
  featuredImage: { type: String },
  galleryImages: [{ type: String }],
  
  // Inventory (aggregated from batches/variants)
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  isTrackInventory: { type: Boolean, default: true },
  
  // Display
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.index({ baseSku: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;

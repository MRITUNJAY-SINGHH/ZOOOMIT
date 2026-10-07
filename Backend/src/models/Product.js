import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  tags: [{ type: String }],
  brand: { type: String, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  
  // Product Classification & Units
  productType: { 
    type: String, 
    enum: ['WEIGHT', 'VOLUME', 'PIECE', 'PACK'], 
    default: 'PIECE' 
  },
  baseUnit: { 
    type: String, 
    enum: ['KG', 'GM', 'LTR', 'ML', 'PCS', 'PACK', 'BOX', 'BAG'], 
    default: 'PCS' 
  },
  purchaseUnit: { type: String, default: 'PCS' },
  purchaseToStockFactor: { type: Number, default: 1 }, // e.g. 1 BAG = 50 KG -> factor is 50
  sellingUnit: { type: String, default: 'PCS' },
  
  // Online Sale Quantity Rules
  minSaleQty: { type: Number, default: 1 },
  maxSaleQty: { type: Number, default: 100 },
  qtyStep: { type: Number, default: 1 },

  // Supplier Relationship
  preferredSupplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },

  // Taxation & Compliance
  taxRate: { type: Number, enum: [0, 5, 12, 18, 28], default: 0 }, // GST %
  hsnCode: { type: String, trim: true },

  // Base Identifiers
  baseSku: { type: String },
  barcode: { 
    type: String, 
    unique: true, 
    sparse: true,
    set: v => v === '' ? undefined : v
  },
  
  // Pricing (can be overridden by variants)
  mrp: { type: Number },
  costPrice: { type: Number },
  sellingPrice: { type: Number },
  
  // Description & Media
  description: { type: String },
  shortDescription: { type: String },
  featuredImage: { type: String },
  galleryImages: [{ type: String }],
  
  // Inventory (aggregated from batches/variants)
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  isTrackInventory: { type: Boolean, default: true },
  hasExpiryTracking: { type: Boolean, default: false },
  
  // Display & Migration Flags
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  needsReview: { type: Boolean, default: false }, // Tag for migrated items requiring admin review
  sortOrder: { type: Number, default: 0 },

  // Quick-Commerce Details & Metadata
  subtitle: { type: String }, // e.g. "Zero Sprouting, Zero Smut"
  isVeg: { type: Boolean, default: true },
  deliveryTime: { type: String, default: '17 MINS' },
  highlights: [{ key: String, value: String }], // e.g. [{ key: "Pack Size", value: "1 kg" }]
  healthBenefits: { type: String },
  storageInfo: { type: String },
  sellerDetails: {
    name: { type: String, default: 'PJIT TECHNOLOGIES PVT LTD' },
    fssaiNumber: { type: String, default: '12725052000372' },
    address: { type: String }
  },
  countryOfOrigin: { type: String, default: 'India' },
  ean: { type: String }
}, { timestamps: true });

productSchema.index({ baseSku: 1 });
productSchema.index({ category: 1, subcategory: 1, isActive: 1 });
productSchema.index({ name: 'text', brand: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;

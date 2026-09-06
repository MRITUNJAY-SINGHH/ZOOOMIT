import mongoose from 'mongoose';

const purchaseEntryItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  batchNumber: { type: String, required: true },
  
  // Purchase unit (e.g. BAG, BOX)
  purchaseUnit: { type: String, required: true },
  purchaseQty: { type: Number, required: true, min: 0 },
  
  // Base inventory unit (e.g. KG, PCS)
  conversionFactor: { type: Number, required: true, default: 1 },
  stockUnit: { type: String, required: true },
  stockQty: { type: Number, required: true, min: 0 }, // purchaseQty * conversionFactor
  
  // Costs
  unitCost: { type: Number, required: true, min: 0 }, // Actual cost per purchaseUnit
  receivedMrp: { type: Number, min: 0 }, // Snapshot of MRP received on the batch
  discount: { type: Number, default: 0, min: 0 },
  gst: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 }, // Item total
  
  // Dates
  manufacturingDate: { type: Date },
  expiryDate: { type: Date }
});

const purchaseEntrySchema = new mongoose.Schema({
  entryNumber: { type: String, required: true, unique: true }, // GRN-2026-000001
  purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  
  supplierInvoiceNo: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  receivedDate: { type: Date, default: Date.now },
  
  status: { type: String, enum: ['Draft', 'Finalized'], default: 'Draft' },
  
  items: [purchaseEntryItemSchema],
  
  // Financials
  subtotal: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  charges: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  
  // Payment Snapshot
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['UNPAID', 'PARTIAL', 'PAID'], 
    default: 'UNPAID' 
  },
  paymentMethod: { type: String },
  
  notes: { type: String }
}, { timestamps: true });

// Prevent duplicate supplier invoices
purchaseEntrySchema.index({ supplier: 1, supplierInvoiceNo: 1, invoiceDate: 1 }, { unique: true, partialFilterExpression: { supplierInvoiceNo: { $type: "string" } } });
purchaseEntrySchema.index({ entryNumber: 1 });

const PurchaseEntry = mongoose.model('PurchaseEntry', purchaseEntrySchema);
export default PurchaseEntry;

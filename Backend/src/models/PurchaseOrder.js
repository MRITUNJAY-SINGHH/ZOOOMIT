import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  purchaseUnit: { type: String, required: true },
  requestedQty: { type: Number, required: true, min: 1 },
  receivedQty: { type: Number, default: 0 },
  unitCost: { type: Number, required: true, min: 0 }, // Planned unit cost
  discount: { type: Number, default: 0, min: 0 }, // Item level discount
  gst: { type: Number, default: 0, min: 0 }, // GST percentage
  total: { type: Number, required: true, min: 0 } // Item total
});

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  orderDate: { type: Date, default: Date.now },
  expectedDate: { type: Date },
  status: { 
    type: String, 
    enum: ['Draft', 'Sent', 'Partially Received', 'Received', 'Cancelled'], 
    default: 'Draft' 
  },
  items: [purchaseOrderItemSchema],
  
  // Financials
  subtotal: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 }, // Overall discount
  tax: { type: Number, default: 0 },
  charges: { type: Number, default: 0 }, // Shipping/Other charges
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  
  notes: { type: String }
}, { timestamps: true });

purchaseOrderSchema.index({ supplier: 1, status: 1 });


const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
export default PurchaseOrder;

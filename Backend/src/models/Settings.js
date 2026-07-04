import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Kuiklo' },
  storeLogo: { type: String },
  storePhone: { type: String },
  storeEmail: { type: String },
  address: { type: String },
  gstNumber: { type: String },
  
  authorizedSignature: { type: String },
  
  invoicePrefixOnline: { type: String, default: 'INV-2026-' },
  invoicePrefixOffline: { type: String, default: 'POS-2026-' },
  invoiceFooter: { type: String, default: 'Thank you for shopping with us!' },
  termsAndConditions: { type: String, default: '1. All sales are final.\n2. Goods once sold cannot be returned without valid reason.' },
  
  bankDetails: {
    accountName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String }
  },
  
  lowStockThresholdDefault: { type: Number, default: 10 },
  expiryAlertDays: { type: [Number], default: [30, 15, 10, 5] }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;

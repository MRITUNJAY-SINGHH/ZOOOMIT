import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Kuiklo' },
  storeLogo: { type: String },
  address: { type: String },
  gstNumber: { type: String },
  
  invoicePrefixOnline: { type: String, default: 'INV-2026-' },
  invoicePrefixOffline: { type: String, default: 'POS-2026-' },
  invoiceFooter: { type: String, default: 'Thank you for shopping with us!' },
  
  lowStockThresholdDefault: { type: Number, default: 10 },
  expiryAlertDays: { type: [Number], default: [30, 15, 10, 5] }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;

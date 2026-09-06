import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyName: { type: String },
  contactPerson: { type: String },
  phone: { type: String, required: true },
  alternatePhone: { type: String },
  email: { type: String },
  
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String, default: 'India' },
  pincode: { type: String },
  
  gstNumber: { type: String },
  pan: { type: String },
  supplierCode: { type: String },
  
  paymentTerms: { type: String, default: 'Immediate' }, // e.g. Immediate, Net 15, Net 30, Net 60
  creditLimit: { type: Number, default: 0 },
  
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branch: String
  },
  
  notes: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;

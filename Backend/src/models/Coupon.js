import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['Fixed', 'Percentage'], required: true },
  value: { type: Number, required: true },
  
  expiryDate: { type: Date, required: true },
  
  minimumOrderValue: { type: Number, default: 0 },
  maximumDiscount: { type: Number }, // For percentage type
  
  usagePerUser: { type: Number, default: 1 },
  usageLimit: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;

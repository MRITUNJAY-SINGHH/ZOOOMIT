import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' }, // Home, Work, Other
  street: { type: String },
  landmark: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String, default: 'India' },
  formattedAddress: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  password: { type: String, select: false }, // Only set for app accounts, hashed via bcrypt
  addresses: [addressSchema],
  status: { type: String, enum: ['Active', 'Inactive', 'Blocked'], default: 'Active' },
  customerType: { type: String, enum: ['APP', 'WALK_IN'], default: 'WALK_IN' },
  pushToken: { type: String, trim: true },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  
  // Cached fields managed by OrderService
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 }
}, { timestamps: true });

// Hash password before saving if modified
customerSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
customerSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
customerSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetToken;
};

customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ name: 'text', email: 'text', phone: 'text' });
customerSchema.index({ customerType: 1, status: 1 });
customerSchema.index({ resetPasswordToken: 1 });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;


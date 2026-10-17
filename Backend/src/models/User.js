import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const crudPermissions = {
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false }
};

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Staff', 'DeliveryBoy'], default: 'Staff' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  permissions: {
    products: crudPermissions,
    inventory: crudPermissions,
    orders: crudPermissions,
    coupons: crudPermissions,
    pos: crudPermissions,
    reports: crudPermissions,
    payments: crudPermissions,
    staff: crudPermissions,
    customers: crudPermissions,
    suppliers: crudPermissions,
    settings: crudPermissions
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // Delivery Partner Specific Fields
  isOnline: { type: Boolean, default: false },
  expoPushToken: { type: String, default: '' },
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    updatedAt: { type: Date }
  },
  vehicleDetails: {
    vehicleType: { type: String, default: 'Motorcycle' },
    vehicleNumber: { type: String, default: '' }
  },
  bankDetails: {
    accountHolderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    upiId: { type: String, default: '' }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);
export default User;

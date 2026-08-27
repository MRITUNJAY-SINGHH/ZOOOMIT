import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true }, // Not unique, walk-ins might just give name
  email: { type: String },
  addresses: [addressSchema],
  status: { type: String, enum: ['Active', 'Inactive', 'Blocked'], default: 'Active' },
  customerType: { type: String, enum: ['APP', 'WALK_IN'], default: 'WALK_IN' },
  // Cached fields managed by OrderService
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 }
}, { timestamps: true });

customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ name: 'text', email: 'text', phone: 'text' });
customerSchema.index({ customerType: 1, status: 1 });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;

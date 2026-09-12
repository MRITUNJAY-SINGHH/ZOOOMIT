import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
  qty: { type: Number, required: true, min: 0.001 },
  unit: { type: String, default: 'PCS' }
}, { _id: true, timestamps: true });

const cartSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
  items: [cartItemSchema],
  appliedCoupon: { type: String, uppercase: true, trim: true, default: null }
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;

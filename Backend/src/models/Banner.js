import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true },
  imageUrl: { type: String, required: true },
  linkType: { 
    type: String, 
    enum: ['PRODUCT', 'CATEGORY', 'COUPON', 'EXTERNAL', 'NONE'], 
    default: 'NONE' 
  },
  linkId: { type: String, trim: true },
  backgroundColor: { type: String, default: '#0284c7' },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

bannerSchema.index({ isActive: 1, sortOrder: 1 });

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;

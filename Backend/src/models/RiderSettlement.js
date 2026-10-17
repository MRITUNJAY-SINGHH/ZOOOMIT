import mongoose from 'mongoose';

const riderSettlementSchema = new mongoose.Schema({
  rider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  orders: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  }],
  period: { 
    type: String, 
    default: 'Daily' 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  totalEarned: { 
    type: Number, 
    required: true 
  },
  amountCollected: { 
    type: Number, 
    default: 0 
  },
  remainingToCollect: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String,
    enum: ['Awaiting Collection', 'Partially Collected', 'Collected'],
    default: 'Awaiting Collection',
    index: true
  },
  confirmedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  confirmedAt: { 
    type: Date 
  },
  storeName: { 
    type: String, 
    default: 'ZOOOMIT Store Hub' 
  },
  notes: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

riderSettlementSchema.index({ rider: 1, date: -1 });

const RiderSettlement = mongoose.model('RiderSettlement', riderSettlementSchema);
export default RiderSettlement;

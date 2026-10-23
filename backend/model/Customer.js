import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  city: { type: String, default: '' },
  country: { type: String, default: '' },
  totalSpent: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 },
  avgOrderValue: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  joinedAt: { type: Date, default: Date.now },
  lastOrder: { type: Date, default: null },
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Customer', CustomerSchema);

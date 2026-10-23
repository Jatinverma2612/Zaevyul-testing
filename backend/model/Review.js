import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '' },
  comment: { type: String, required: true },
  verified: { type: Boolean, default: false },
  fit: { type: String, enum: ['True to Size', 'Runs Small', 'Runs Large', ''], default: '' },
  photos: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

ReviewSchema.index({ product: 1, status: 1 });

export default mongoose.model('Review', ReviewSchema);

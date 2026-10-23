import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name:          { type: String, required: true },
  slug:          { type: String, required: true, unique: true },
  description:   { type: String, default: '' },
  parent:        { type: String, default: '' },
  sortOrder:     { type: Number, default: 0 },
  status:        { type: String, enum: ['active', 'inactive'], default: 'active' },
  banner:        { type: String, default: null },
  featured:      { type: Boolean, default: false },
  featuredOrder: { type: Number, default: null, min: 1, max: 4 },
  mainImage: {
    id:  { type: String, default: null },
    name: { type: String, default: null },
    url:  { type: String, default: null }
  },
  sizeChartImage: { type: String, default: "" },
  seo: {
    title:       { type: String, default: '' },
    description: { type: String, default: '' },
    url:         { type: String, default: '' }
  }
}, { timestamps: true });

export default mongoose.model('Category', CategorySchema);

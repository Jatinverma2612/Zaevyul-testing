import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.Mixed, ref: 'Product' },
  name: { type: String, required: true },
  qty: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  image: { type: String, default: '' },
  img: { type: String, default: '' },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded', 'return_requested', 'returned'], default: 'pending' },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxName: { type: String, default: '' },
  taxType: { type: String, default: '' },
  taxJurisdiction: { type: String, default: '' },
  shipping: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentMethod: { type: String, default: 'Credit Card' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  trackingNumber: { type: String, default: null },
  returnRequest: {
    reason: { type: String, default: '' },
    details: { type: String, default: '' },
    requestedAt: { type: Date },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' }
  },
  shippingAddress: {
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    stateCode: { type: String, default: '' },
    country: { type: String, required: true },
    countryCode: { type: String, default: '' },
    zip: { type: String, required: true },
    phone: { type: String, default: '' },
    phoneCountryCode: { type: String, default: '' },
    recipientName: { type: String, default: '' },
    landmark: { type: String, default: '' }
  },
  notes: { type: String, default: '' },
  invoice: {
    invoiceNumber: { type: String, default: null },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
    generatedAt: { type: Date, default: null },
    pdfUrl: { type: String, default: null },
    status: { type: String, enum: ['none', 'generated', 'failed'], default: 'none' }
  }
}, { timestamps: true });

// Indexes for reports & order-list queries
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customer: 1 });

export default mongoose.model('Order', OrderSchema);

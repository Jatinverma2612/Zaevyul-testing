import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    sequenceNumber: { type: Number, required: true },
    year: { type: Number, required: true },
    snapshot: {
      seller: {
        storeName: { type: String, default: "Zaevyul" },
        tagline: { type: String, default: "Timeless · Authentic · Handcrafted" },
        email: { type: String, default: "hello@zaevyul.com" },
        phone: { type: String, default: "+91 194 123 4567" },
        address: {
          type: String,
          default: "Residency Road, Srinagar, Jammu & Kashmir 190001",
        },
        gstin: { type: String, default: "22AAAAA0000A1Z5" },
        currencySymbol: { type: String, default: "₹" },
        currency: { type: String, default: "INR" },
      },
      customer: {
        name: { type: String, required: true },
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        shippingAddress: {
          recipientName: { type: String, default: "" },
          line1: { type: String, required: true },
          line2: { type: String, default: "" },
          city: { type: String, required: true },
          state: { type: String, default: "" },
          country: { type: String, required: true },
          zip: { type: String, required: true },
          phone: { type: String, default: "" },
        },
        billingAddress: {
          recipientName: { type: String, default: "" },
          line1: { type: String, default: "" },
          line2: { type: String, default: "" },
          city: { type: String, default: "" },
          state: { type: String, default: "" },
          country: { type: String, default: "" },
          zip: { type: String, default: "" },
          phone: { type: String, default: "" },
        },
      },
      order: {
        orderId: { type: String, required: true },
        orderDate: { type: Date, required: true },
        invoiceDate: { type: Date, required: true },
        paymentMethod: { type: String, default: "Online" },
        paymentStatus: { type: String, default: "paid" },
      },
      items: [
        {
          product: { type: mongoose.Schema.Types.Mixed },
          name: { type: String, required: true },
          sku: { type: String, default: "" },
          size: { type: String, default: "" },
          color: { type: String, default: "" },
          qty: { type: Number, required: true },
          unitPrice: { type: Number, required: true },
          discount: { type: Number, default: 0 },
          taxRate: { type: Number, default: 0 },
          taxAmount: { type: Number, default: 0 },
          lineTotal: { type: Number, required: true },
        },
      ],
      totals: {
        subtotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        shipping: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        currencySymbol: { type: String, default: "₹" },
      },
    },
    pdfPath: { type: String, default: "" },
    status: {
      type: String,
      enum: ["generated", "failed"],
      default: "generated",
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", InvoiceSchema);

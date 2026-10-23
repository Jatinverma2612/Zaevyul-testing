import mongoose from "mongoose";

const TaxRuleSchema = new mongoose.Schema(
  {
    countryCode: { type: String, required: true, uppercase: true },
    countryName: { type: String, required: true },
    taxName: { type: String, required: true },
    taxType: {
      type: String,
      enum: ["GST", "VAT", "Sales Tax", "Other"],
      default: "GST",
    },
    rate: { type: Number, required: true }, // Standard rate percentage
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevent duplicate rules per country at database level
TaxRuleSchema.index({ countryCode: 1 }, { unique: true });

export default mongoose.model("TaxRule", TaxRuleSchema);

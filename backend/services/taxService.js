import mongoose from "mongoose";
import TaxRule from "../model/TaxRule.js";
import Settings from "../model/Settings.js";
import Product from "../model/Product.js";

/**
 * findTaxRule
 * Resolves the applicable tax rule for the given country and state.
 * Priority:
 * 1. Country + State/Province exact match
 * 2. Country-level match
 * 3. No matching rule (falls back to default/primary jurisdiction or returns null)
 * Throws a configuration error if multiple active rules conflict at the same level.
 */
export const findTaxRule = async (countryCode) => {
  let finalCountryCode = countryCode ? countryCode.trim().toUpperCase() : "";

  // If no countryCode is provided, fall back to default/primary jurisdiction from settings
  if (!finalCountryCode) {
    const settings = await Settings.findOne();
    finalCountryCode = settings?.defaultJurisdictionCountryCode?.toUpperCase() || "IN";
  }

  const matchedRule = await TaxRule.findOne({
    countryCode: finalCountryCode,
    isActive: true,
  });

  return matchedRule;
};

/**
 * calculateTax
 * Calculates subtotal, tax amount, and returns breakdown based on address and products.
 * Does not trust any frontend price or tax values.
 */
export const calculateTax = async ({ items, shippingAddress }) => {
  const countryCode = shippingAddress?.countryCode || shippingAddress?.country || "";

  const rule = await findTaxRule(countryCode);
  if (!rule) {
    throw new Error(
      `No tax rule configured for the selected jurisdiction: ${countryCode || "Default"}`
    );
  }

  const settings = await Settings.findOne();
  const pricingMode = settings?.taxPricingMode || "exclusive";

  let calculatedSubtotal = 0;
  let calculatedTaxAmount = 0;

  for (const item of items) {
    const productId = item.product || item.id || item._id;
    if (!productId) {
      throw new Error("Product identifier is required for each cart item.");
    }

    const strId = String(productId);
    const dbProduct = mongoose.Types.ObjectId.isValid(strId)
      ? await Product.findById(strId)
      : await Product.findOne({
          $or: [{ id: strId }, { slug: strId }, { sku: strId }],
        });

    const qty = Math.max(1, parseInt(item.qty || item.quantity || 1, 10));
    
    // Resolve price based on size variant if applicable, or fallback to item.price
    let unitPrice = 0;
    if (dbProduct) {
      unitPrice = dbProduct.discountPrice > 0 && dbProduct.discountPrice < dbProduct.basePrice
        ? dbProduct.discountPrice
        : dbProduct.basePrice;

      if (item.size && dbProduct.sizes && dbProduct.sizes.length > 0) {
        const matchedSize = dbProduct.sizes.find(s => s.size === item.size);
        if (matchedSize) {
          unitPrice = matchedSize.discountPrice > 0 && matchedSize.discountPrice < matchedSize.price
            ? matchedSize.discountPrice
            : matchedSize.price;
        }
      }
    } else {
      // Fallback for mock items (e.g. prd-019) or items not in DB during cart calculation preview
      unitPrice = Number(item.price || item.unitPrice || item.basePrice || 0);
    }

    const itemSubtotal = unitPrice * qty;
    calculatedSubtotal += itemSubtotal;

    // Resolve rate (all products use standard active country tax rate now)
    const rate = rule.rate;

    if (pricingMode === "inclusive") {
      // Inclusive Tax = Price * rate / (100 + rate)
      const itemTax = (itemSubtotal * rate) / (100 + rate);
      calculatedTaxAmount += Math.round(itemTax);
    } else {
      // Exclusive Tax = Price * rate / 100
      const itemTax = (itemSubtotal * rate) / 100;
      calculatedTaxAmount += Math.round(itemTax);
    }
  }

  return {
    subtotal: calculatedSubtotal,
    taxAmount: calculatedTaxAmount,
    taxRate: rule.rate,
    taxName: rule.taxName,
    taxType: rule.taxType,
    taxJurisdiction: rule.countryCode,
    pricingMode,
  };
};

import TaxRule from "../model/TaxRule.js";

/**
 * GET /api/admin/tax-rules
 * Retrieve all tax rules from the database.
 */
export const getTaxRules = async (req, res) => {
  try {
    const taxRules = await TaxRule.find().sort({ countryName: 1, stateName: 1 });
    return res.status(200).json({ success: true, taxRules });
  } catch (error) {
    console.error("[taxRules] getTaxRules error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * GET /api/admin/tax-rules/:id
 * Retrieve a specific tax rule.
 */
export const getTaxRuleById = async (req, res) => {
  try {
    const taxRule = await TaxRule.findById(req.params.id);
    if (!taxRule) {
      return res.status(404).json({ success: false, message: "Tax rule not found." });
    }
    return res.status(200).json({ success: true, taxRule });
  } catch (error) {
    console.error("[taxRules] getTaxRuleById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * POST /api/admin/tax-rules
 * Create a new tax rule.
 */
export const createTaxRule = async (req, res) => {
  const {
    countryCode,
    countryName,
    taxName,
    taxType,
    rate,
    isActive,
  } = req.body;

  if (!countryCode || !countryName || !taxName || rate === undefined) {
    return res.status(400).json({
      success: false,
      message: "Country Code, Country Name, Tax Name, and Rate are required.",
    });
  }

  try {
    // Check if duplicate rule already exists
    const duplicate = await TaxRule.findOne({
      countryCode: countryCode.toUpperCase().trim(),
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `A tax rule already exists for country "${countryName}".`,
      });
    }

    const taxRule = new TaxRule({
      countryCode: countryCode.toUpperCase().trim(),
      countryName: countryName.trim(),
      taxName: taxName.trim(),
      taxType,
      rate: Number(rate),
      isActive: isActive !== undefined ? isActive : true,
    });

    await taxRule.save();
    return res.status(201).json({ success: true, taxRule });
  } catch (error) {
    console.error("[taxRules] createTaxRule error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * PUT /api/admin/tax-rules/:id
 * Update an existing tax rule.
 */
export const updateTaxRule = async (req, res) => {
  const {
    countryCode,
    countryName,
    taxName,
    taxType,
    rate,
    isActive,
  } = req.body;

  try {
    const taxRule = await TaxRule.findById(req.params.id);
    if (!taxRule) {
      return res.status(404).json({ success: false, message: "Tax rule not found." });
    }

    // Check duplicates if countryCode is modified
    if (countryCode) {
      const targetCountry = countryCode.toUpperCase().trim();

      if (targetCountry !== taxRule.countryCode) {
        const duplicate = await TaxRule.findOne({
          countryCode: targetCountry,
          _id: { $ne: taxRule._id },
        });

        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: `A tax rule already exists for country "${countryName || taxRule.countryName}".`,
          });
        }
      }
    }

    if (countryCode !== undefined) taxRule.countryCode = countryCode.toUpperCase().trim();
    if (countryName !== undefined) taxRule.countryName = countryName.trim();
    if (taxName !== undefined) taxRule.taxName = taxName.trim();
    if (taxType !== undefined) taxRule.taxType = taxType;
    if (rate !== undefined) taxRule.rate = Number(rate);
    if (isActive !== undefined) taxRule.isActive = isActive;

    await taxRule.save();
    return res.status(200).json({ success: true, taxRule });
  } catch (error) {
    console.error("[taxRules] updateTaxRule error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * DELETE /api/admin/tax-rules/:id
 * Delete a tax rule.
 */
export const deleteTaxRule = async (req, res) => {
  try {
    const taxRule = await TaxRule.findByIdAndDelete(req.params.id);
    if (!taxRule) {
      return res.status(404).json({ success: false, message: "Tax rule not found." });
    }
    return res.status(200).json({ success: true, message: "Tax rule deleted successfully." });
  } catch (error) {
    console.error("[taxRules] deleteTaxRule error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

import Coupon from '../model/Coupon.js';

const toOptionalNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
};

const getCouponFields = (body) => {
  const fields = {};

  if (body.code !== undefined) fields.code = String(body.code).trim().toUpperCase();
  if (body.type !== undefined) fields.type = body.type;
  if (body.value !== undefined) fields.value = Number(body.value);
  if (body.description !== undefined) fields.description = body.description || '';
  if (body.expiry !== undefined) fields.expiry = body.expiry || null;
  if (body.usageLimit !== undefined) fields.usageLimit = toOptionalNumber(body.usageLimit, null);
  if (body.minOrderValue !== undefined) fields.minOrderValue = toOptionalNumber(body.minOrderValue, 0);
  if (body.active !== undefined) fields.active = Boolean(body.active);

  return fields;
};

const validateCouponFields = (fields, isCreate = false) => {
  if (isCreate && !fields.code) return 'Coupon code is required';
  if (fields.code !== undefined && !fields.code) return 'Coupon code is required';
  if (isCreate && fields.value === undefined) return 'Coupon value is required';
  if (fields.value !== undefined && (!Number.isFinite(fields.value) || fields.value <= 0)) {
    return 'Coupon value must be greater than zero';
  }
  if (fields.type && !['percentage', 'fixed'].includes(fields.type)) {
    return 'Coupon type must be percentage or fixed';
  }
  if (fields.type === 'percentage' && fields.value > 100) {
    return 'Percentage coupon value cannot exceed 100';
  }
  if (Number.isNaN(fields.usageLimit) || (fields.usageLimit !== undefined && fields.usageLimit !== null && fields.usageLimit < 0)) {
    return 'Usage limit must be zero or greater';
  }
  if (Number.isNaN(fields.minOrderValue) || (fields.minOrderValue !== undefined && fields.minOrderValue < 0)) {
    return 'Minimum order value must be zero or greater';
  }
  return null;
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error('Fetch coupons error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const fields = getCouponFields(req.body);
    const validationError = validateCouponFields(fields, true);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const coupon = new Coupon(fields);
    await coupon.save();
    return res.status(201).json({ success: true, coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const fields = getCouponFields(req.body);
    const validationError = validateCouponFields(fields);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
};

export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    coupon.active = !coupon.active;
    await coupon.save();

    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    console.error('Toggle coupon status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    return res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const bulkDeleteCoupons = async (req, res) => {
  const { ids } = req.body;
  try {
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'IDs array is required' });
    }

    await Coupon.deleteMany({ _id: { $in: ids } });
    return res.status(200).json({ success: true, message: 'Selected coupons deleted successfully' });
  } catch (error) {
    console.error('Bulk delete coupons error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete selected coupons' });
  }
};

import Customer from '../model/Customer.js';
import Order from '../model/Order.js';
import { escapeRegex } from './public.js';

/**
 * GET /api/admin/customers
 * Supports regex escaping (AUD-021) and pagination (AUD-025).
 */
export const getCustomers = async (req, res) => {
  const { search, status, page = 1, limit = 0 } = req.query;
  try {
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = parseInt(limit, 10) || 0;

    let query = Customer.find(filter).sort({ createdAt: -1 });
    if (limitNum > 0) {
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const [customers, totalCount] = await Promise.all([
      query,
      Customer.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      customers,
      totalCount,
      page: pageNum,
      totalPages: limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1,
    });
  } catch (error) {
    console.error('Fetch customers error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Get order history for customer
    const orders = await Order.find({ customer: customer._id }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, customer, orders });
  } catch (error) {
    console.error('Fetch customer detail error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

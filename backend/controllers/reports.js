import Order from '../model/Order.js';
import Product from '../model/Product.js';
import Customer from '../model/Customer.js';

export const getReports = async (req, res) => {
  try {
    // Run all independent DB queries in parallel
    const [
      totalCustomers,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalOrdersCount,
      pendingOrdersCount,
      revenueAgg,
      categoryAgg,
      monthlyReportAgg,
      topProductsAgg,
      paymentMethodAgg,
    ] = await Promise.all([
      // 1. Count customers
      Customer.countDocuments(),

      // 2. Count products
      Product.countDocuments(),

      // 3. Low stock count using individual product thresholds
      Product.countDocuments({
        $expr: {
          $and: [
            { $gt: ['$quantity', 0] },
            { $lte: ['$quantity', '$lowStockThreshold'] }
          ]
        }
      }),

      // 4. Out of stock count
      Product.countDocuments({ quantity: 0 }),

      // 5. Total orders count
      Order.countDocuments(),

      // 6. Pending orders count
      Order.countDocuments({ status: 'pending' }),

      // 7. Revenue aggregation
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
      ]),

      // 8. Category sales breakdown via aggregation
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDoc'
          }
        },
        { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$productDoc.category',
            qtySold: { $sum: '$items.qty' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryDoc'
          }
        },
        { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ['$categoryDoc.name', 'Uncategorised'] },
            qtySold: 1,
            revenue: 1
          }
        }
      ]),

      // 9. Monthly sales aggregate for the last 12 months
      Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      // 10. Top selling products aggregate
      Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            sold: { $sum: '$items.qty' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
            name: { $first: '$items.name' }
          }
        },
        { $sort: { sold: -1 } },
        { $limit: 5 }
      ]),

      // 11. Payment method / Channel breakdown aggregate
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: '$paymentMethod',
            amount: { $sum: '$total' },
            count: { $sum: 1 }
          }
        },
        { $sort: { amount: -1 } }
      ])
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue ?? 0;
    const inStockCount = Math.max(0, totalProducts - outOfStockCount - lowStockCount);

    // Calculate category percentage breakdown directly from database
    const totalQtySold = categoryAgg.reduce((sum, c) => sum + c.qtySold, 0);
    const categoryBreakdown = categoryAgg
      .map(c => ({
        name: c.name,
        value: totalQtySold > 0 ? Math.round((c.qtySold / totalQtySold) * 100) : 0,
        qtySold: c.qtySold,
        revenue: c.revenue || 0
      }))
      .filter(c => c.value > 0);

    // Calculate Payment Method / Channel breakdown directly from database
    const totalChannelAmount = paymentMethodAgg.reduce((sum, pm) => sum + pm.amount, 0);
    const channelColors = ['#B58A5B', '#D9C2A7', '#E8DED1', '#825433', '#A6741E'];
    const channelBreakdown = paymentMethodAgg.map((pm, idx) => ({
      name: pm._id || 'Direct',
      amount: pm.amount,
      count: pm.count,
      value: totalChannelAmount > 0 ? Math.round((pm.amount / totalChannelAmount) * 1000) / 10 : 0,
      color: channelColors[idx % channelColors.length]
    }));

    const monthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyReportMap = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const label = monthsLabels[d.getMonth()];
      const key = `${year}-${month}`;
      monthlyReportMap[key] = { month: label, revenue: 0, orders: 0 };
    }

    for (const item of monthlyReportAgg) {
      const key = `${item._id.year}-${item._id.month}`;
      if (monthlyReportMap[key]) {
        monthlyReportMap[key].revenue = item.revenue;
        monthlyReportMap[key].orders = item.orders;
      }
    }

    const monthlyReport = Object.values(monthlyReportMap);

    const topProducts = topProductsAgg.map(p => ({
      name: p.name || 'Pashmina Item',
      sold: p.sold || 0,
      revenue: p.revenue || 0
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        totalCustomers,
        totalProducts,
        inStockCount,
        lowStockCount,
        outOfStockCount
      },
      categoryBreakdown,
      channelBreakdown,
      monthlyReport,
      topProducts
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

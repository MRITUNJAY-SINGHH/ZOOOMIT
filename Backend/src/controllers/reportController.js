import Order from '../models/Order.js';
import Transaction from '../models/Transaction.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import InventoryLog from '../models/InventoryLog.js';

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, todayOrders, pendingOrders, completedOrders, totalCustomers, totalProducts, totalStaff] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Delivered' }),
      Customer.countDocuments(),
      Product.countDocuments(),
      User.countDocuments()
    ]);

    // Aggregate Sales
    const salesData = await Order.aggregate([
      { $match: { paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] } } },
      { $group: {
        _id: null,
        totalSales: { $sum: "$amount" },
        onlineSales: { $sum: { $cond: [ { $eq: ["$orderType", "ONLINE"] }, "$amount", 0 ] } },
        offlineSales: { $sum: { $cond: [ { $eq: ["$orderType", "OFFLINE"] }, "$amount", 0 ] } },
      }}
    ]);

    const todaySalesData = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] } } },
      { $group: { _id: null, todaySales: { $sum: "$amount" } } }
    ]);

    const stats = {
      totalSales: salesData[0]?.totalSales || 0,
      onlineSales: salesData[0]?.onlineSales || 0,
      offlineSales: salesData[0]?.offlineSales || 0,
      todaySales: todaySalesData[0]?.todaySales || 0,
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      totalCustomers,
      totalProducts,
      totalStaff
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalesChart = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailySales = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        sales: { $sum: "$amount" }
      }},
      { $sort: { _id: 1 } }
    ]);
    res.json(dailySales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalesReport = async (req, res) => {
  try {
    const sales = await Order.find({ paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] } })
      .select('orderNumber amount orderType paymentStatus createdAt')
      .sort('-createdAt')
      .limit(100);
    res.json(sales);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getInventoryReport = async (req, res) => {
  try {
    const products = await Product.find({}).populate('category', 'name').select('name sku totalStock status');
    res.json(products);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getPaymentsReport = async (req, res) => {
  try {
    let { page = 1, limit = 20, search = '', status, startDate, endDate } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 100) limit = 100;

    let query = {};
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.paymentStatus = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Transaction.countDocuments(query);
    const payments = await Transaction.find(query)
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      data: payments,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

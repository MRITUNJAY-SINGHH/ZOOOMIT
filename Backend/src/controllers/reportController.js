import Order from '../models/Order.js';
import Transaction from '../models/Transaction.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import InventoryLog from '../models/InventoryLog.js';
import ProductBatch from '../models/ProductBatch.js';
import RefundQueue from '../models/RefundQueue.js';
import Supplier from '../models/Supplier.js';

export const getSalesReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [totalOrders, cancelledOrders, returnedOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Cancelled' }),
      Order.countDocuments({ status: 'Returned' })
    ]);

    // Aggregate Sales By Period
    const salesAgg = await Order.aggregate([
      { $match: { paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] } } },
      { $group: {
        _id: null,
        totalSales: { $sum: "$amount" },
        todaySales: { $sum: { $cond: [ { $gte: ["$createdAt", today] }, "$amount", 0 ] } },
        weeklySales: { $sum: { $cond: [ { $gte: ["$createdAt", startOfWeek] }, "$amount", 0 ] } },
        monthlySales: { $sum: { $cond: [ { $gte: ["$createdAt", startOfMonth] }, "$amount", 0 ] } },
        yearlySales: { $sum: { $cond: [ { $gte: ["$createdAt", startOfYear] }, "$amount", 0 ] } },
        onlineSales: { $sum: { $cond: [ { $eq: ["$orderType", "ONLINE"] }, "$amount", 0 ] } },
        offlineSales: { $sum: { $cond: [ { $eq: ["$orderType", "OFFLINE"] }, "$amount", 0 ] } },
      }}
    ]);

    const { search } = req.query;

    const topProductsPipeline = [
      { $match: { status: 'Delivered' } },
      { $unwind: "$items" }
    ];

    if (search) {
      topProductsPipeline.push({
        $match: {
          "items.productName": { $regex: search, $options: 'i' }
        }
      });
    }

    topProductsPipeline.push(
      { $group: {
        _id: "$items.product",
        productName: { $first: "$items.productName" },
        totalQty: { $sum: "$items.qty" },
        totalRevenue: { $sum: "$items.total" }
      }},
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productDetails' } },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } }
    );

    // Top Selling Products
    const topProducts = await Order.aggregate(topProductsPipeline);

    // Revenue Graph (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const revenueGraph = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        sales: { $sum: "$amount" }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      summary: salesAgg[0] || { totalSales: 0, todaySales: 0, weeklySales: 0, monthlySales: 0, yearlySales: 0, onlineSales: 0, offlineSales: 0 },
      counts: { totalOrders, cancelledOrders, returnedOrders },
      topProducts,
      revenueGraph
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getInventoryReport = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const [products, lowStock, outOfStock] = await Promise.all([
      Product.aggregate([
        { $match: { isTrackInventory: true } },
        { $group: { _id: null, currentStock: { $sum: "$stock" } } }
      ]),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, stock: { $gt: 0 }, isTrackInventory: true }),
      Product.countDocuments({ stock: 0, isTrackInventory: true })
    ]);

    const [expiring, expired, valueAgg] = await Promise.all([
      ProductBatch.countDocuments({ expiryDate: { $lte: thirtyDaysFromNow, $gte: today }, stock: { $gt: 0 } }),
      ProductBatch.countDocuments({ expiryDate: { $lt: today }, stock: { $gt: 0 } }),
      ProductBatch.aggregate([
        { $match: { stock: { $gt: 0 } } },
        { $group: { _id: null, inventoryValue: { $sum: { $multiply: ["$stock", "$costPrice"] } } } }
      ])
    ]);

    const recentLogs = await InventoryLog.find()
      .populate('product', 'name')
      .populate('user', 'name')
      .sort('-date')
      .limit(50);

    res.json({
      summary: {
        currentStock: products[0]?.currentStock || 0,
        lowStock,
        outOfStock,
        expiring,
        expired,
        inventoryValue: valueAgg[0]?.inventoryValue || 0
      },
      recentLogs
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getPaymentsReport = async (req, res) => {
  try {
    const paymentAgg = await Transaction.aggregate([
      { $group: {
        _id: null,
        totalPayments: { $sum: { $cond: [ { $in: ["$paymentStatus", ["Success", "Paid"]] }, "$amount", 0 ] } },
        cashPayments: { $sum: { $cond: [ { $and: [ { $eq: ["$paymentMethod", "Cash"] }, { $gt: ["$amount", 0] } ] }, "$amount", 0 ] } },
        upiPayments: { $sum: { $cond: [ { $and: [ { $eq: ["$paymentMethod", "UPI"] }, { $gt: ["$amount", 0] } ] }, "$amount", 0 ] } },
        cardPayments: { $sum: { $cond: [ { $and: [ { $eq: ["$paymentMethod", "Card"] }, { $gt: ["$amount", 0] } ] }, "$amount", 0 ] } },
        razorpayPayments: { $sum: { $cond: [ { $and: [ { $eq: ["$paymentMethod", "Razorpay"] }, { $gt: ["$amount", 0] } ] }, "$amount", 0 ] } },
        refundedAmount: { $sum: "$refundAmount" } // assuming refundAmount stores absolute refund value
      }}
    ]);

    const [pendingRefunds, failedPayments] = await Promise.all([
      RefundQueue.countDocuments({ status: { $in: ['Pending', 'Retrying'] } }),
      Transaction.countDocuments({ paymentStatus: 'Failed' })
    ]);

    const recentTransactions = await Transaction.find()
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .limit(50);

    res.json({
      summary: {
        ...(paymentAgg[0] || { totalPayments: 0, cashPayments: 0, upiPayments: 0, cardPayments: 0, razorpayPayments: 0, refundedAmount: 0 }),
        pendingRefunds,
        failedPayments
      },
      recentTransactions
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate, search, customerType, status, orderCount, spent, sortBy } = req.query;

    let customerMatch = {};
    if (search) {
      customerMatch.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (customerType && customerType !== 'All') customerMatch.customerType = customerType;
    if (status && status !== 'All') customerMatch.status = status;

    let orderMatch = { paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] } };
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { $gte: new Date(startDate), $lte: new Date(endDate) };
      orderMatch.createdAt = dateFilter;
    }

    const aggregationPipeline = [
      { $match: customerMatch },
      {
        $lookup: {
          from: 'orders',
          let: { customerId: '$_id' },
          pipeline: [
            { $match: { 
                $expr: { $eq: ['$customer', '$$customerId'] },
                ...orderMatch
              }
            }
          ],
          as: 'orders'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          phone: 1,
          email: 1,
          createdAt: 1,
          orderCount: { $size: '$orders' },
          totalSpent: { $sum: '$orders.amount' }
        }
      }
    ];

    let postMatch = {};
    if (orderCount && orderCount !== 'All') {
      if (orderCount === 'First Order') postMatch.orderCount = 1;
      else if (orderCount === 'Returning') postMatch.orderCount = { $gt: 1 };
      else if (orderCount === 'VIP Customers') postMatch.orderCount = { $gte: 5 };
    }

    if (spent && spent !== 'All') {
      if (spent === '₹0–₹5,000') postMatch.totalSpent = { $gte: 0, $lte: 5000 };
      else if (spent === '₹5,000–₹20,000') postMatch.totalSpent = { $gt: 5000, $lte: 20000 };
      else if (spent === '₹20,000+') postMatch.totalSpent = { $gt: 20000 };
    }

    if (Object.keys(postMatch).length > 0) {
      aggregationPipeline.push({ $match: postMatch });
    }

    let sortStage = { totalSpent: -1 };
    if (sortBy === 'Highest Spending') sortStage = { totalSpent: -1 };
    else if (sortBy === 'Most Orders') sortStage = { orderCount: -1 };
    else if (sortBy === 'Newest Customer') sortStage = { createdAt: -1 };
    else if (sortBy === 'Oldest Customer') sortStage = { createdAt: 1 };
    else if (sortBy === 'name-asc') sortStage = { name: 1 };
    else if (sortBy === 'name-desc') sortStage = { name: -1 };
    else if (sortBy === 'totalSpent-asc') sortStage = { totalSpent: 1 };
    else if (sortBy === 'totalSpent-desc') sortStage = { totalSpent: -1 };
    else if (sortBy === 'orderCount-asc') sortStage = { orderCount: 1 };
    else if (sortBy === 'orderCount-desc') sortStage = { orderCount: -1 };

    aggregationPipeline.push({ $sort: sortStage });

    const customers = await Customer.aggregate(aggregationPipeline);

    let totalCustomersFound = customers.length;
    let newCustomersFound = 0;
    let returningCustomersFound = 0;
    
    let createdDateMatch = dateFilter;
    if (!createdDateMatch.$gte) {
       const thirtyDaysAgo = new Date();
       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
       createdDateMatch = { $gte: thirtyDaysAgo };
    }

    customers.forEach(c => {
       if (c.createdAt >= createdDateMatch.$gte && (!createdDateMatch.$lte || c.createdAt <= createdDateMatch.$lte)) {
         newCustomersFound++;
       }
       if (c.orderCount > 1) {
         returningCustomersFound++;
       }
    });

    const topCustomers = customers.map(c => ({
      _id: c._id,
      customerName: c.name,
      customerPhone: c.phone,
      customerEmail: c.email,
      orderCount: c.orderCount,
      totalSpent: c.totalSpent,
      createdAt: c.createdAt
    }));

    res.json({
      summary: {
        totalCustomers: totalCustomersFound,
        newCustomers: newCustomersFound,
        returningCustomers: returningCustomersFound
      },
      topCustomers
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      totalStaff,
      totalSuppliers
    ] = await Promise.all([
      Order.countDocuments(),
      Customer.countDocuments(),
      Product.countDocuments(),
      User.countDocuments(),
      Supplier.countDocuments()
    ]);

    const salesAgg = await Order.aggregate([
      { $match: { paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] } } },
      { $group: {
        _id: null,
        totalSales: { $sum: "$amount" },
        todaySales: { $sum: { $cond: [ { $gte: ["$createdAt", today] }, "$amount", 0 ] } },
        onlineSales: { $sum: { $cond: [ { $eq: ["$orderType", "ONLINE"] }, "$amount", 0 ] } },
        offlineSales: { $sum: { $cond: [ { $eq: ["$orderType", "OFFLINE"] }, "$amount", 0 ] } },
        monthRevenue: { $sum: { $cond: [ { $gte: ["$createdAt", startOfMonth] }, "$amount", 0 ] } },
      }}
    ]);

    const sales = salesAgg[0] || {
      totalSales: 0, todaySales: 0, onlineSales: 0, offlineSales: 0, monthRevenue: 0
    };

    res.json({
      totalOrders,
      totalCustomers,
      totalProducts,
      totalStaff,
      totalSuppliers,
      ...sales
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getSalesChart = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const sales = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        sales: { $sum: "$amount" }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const found = sales.find(s => s._id === dateStr);
      result.push({
        _id: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: found ? found.sales : 0
      });
    }

    res.json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getTopSellingProducts = async (req, res) => {
  try {
    const products = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.product",
        productName: { $first: "$items.productName" },
        totalSold: { $sum: "$items.qty" },
        totalRevenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.json(products);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

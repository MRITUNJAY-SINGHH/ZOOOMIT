import Order from '../models/Order.js';
import Transaction from '../models/Transaction.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import InventoryLog from '../models/InventoryLog.js';
import ProductBatch from '../models/ProductBatch.js';
import RefundQueue from '../models/RefundQueue.js';
import Supplier from '../models/Supplier.js';
import { roundTo } from '../utils/decimalUtils.js';

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
        totalTax: { $sum: "$tax" },
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
        unit: { $first: "$items.unit" },
        totalQty: { $sum: "$items.qty" },
        totalRevenue: { $sum: "$items.total" }
      }},
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productDetails' } },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } }
    );

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
      summary: salesAgg[0] || { totalSales: 0, totalTax: 0, todaySales: 0, weeklySales: 0, monthlySales: 0, yearlySales: 0, onlineSales: 0, offlineSales: 0 },
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

    // Only products with expiry tracking
    const expiryTrackedProducts = await Product.find({ hasExpiryTracking: true }).select('_id');
    const expiryProductIds = expiryTrackedProducts.map(p => p._id);

    const [products, lowStock, outOfStock] = await Promise.all([
      Product.aggregate([
        { $match: { isTrackInventory: true } },
        { $group: { _id: null, currentStock: { $sum: "$stock" } } }
      ]),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, stock: { $gt: 0 }, isTrackInventory: true }),
      Product.countDocuments({ stock: 0, isTrackInventory: true })
    ]);

    const [expiring, expired, valueAgg] = await Promise.all([
      ProductBatch.countDocuments({ 
        product: { $in: expiryProductIds }, 
        expiryDate: { $lte: thirtyDaysFromNow, $gte: today }, 
        stock: { $gt: 0 } 
      }),
      ProductBatch.countDocuments({ 
        product: { $in: expiryProductIds }, 
        expiryDate: { $lt: today }, 
        stock: { $gt: 0 } 
      }),
      ProductBatch.aggregate([
        { $match: { stock: { $gt: 0 } } },
        { $group: { 
          _id: null, 
          inventoryValue: { 
            $sum: { 
              $multiply: [
                "$stock", 
                { $ifNull: ["$unitCost", { $ifNull: ["$costPrice", 0] }] }
              ] 
            } 
          } 
        }}
      ])
    ]);

    const recentLogs = await InventoryLog.find()
      .populate('product', 'name baseSku baseUnit')
      .populate('user', 'name role')
      .sort({ date: -1 })
      .limit(50);

    res.json({
      summary: {
        currentStock: roundTo(products[0]?.currentStock || 0, 3),
        lowStock,
        outOfStock,
        expiring,
        expired,
        inventoryValue: roundTo(valueAgg[0]?.inventoryValue || 0, 2)
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
        refundedAmount: { $sum: "$refundAmount" }
      }}
    ]);

    const [pendingRefunds, failedPayments] = await Promise.all([
      RefundQueue.countDocuments({ status: { $in: ['Pending', 'Retrying'] } }),
      Transaction.countDocuments({ paymentStatus: 'Failed' })
    ]);

    const recentTransactions = await Transaction.find()
      .populate('order', 'orderNumber billNumber')
      .sort({ createdAt: -1 })
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
      totalSpent: roundTo(c.totalSpent, 2),
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

export const parseDateRange = (period, customStart, customEnd) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); // Default this_month
  let end = todayEnd;

  switch (period) {
    case 'today':
      start = todayStart;
      end = todayEnd;
      break;
    case 'yesterday': {
      const y = new Date(todayStart);
      y.setDate(y.getDate() - 1);
      start = y;
      const yEnd = new Date(y);
      yEnd.setHours(23, 59, 59, 999);
      end = yEnd;
      break;
    }
    case 'this_week': {
      const d = new Date(todayStart);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(d.setDate(diff));
      end = todayEnd;
      break;
    }
    case 'last_week': {
      const d = new Date(todayStart);
      const day = d.getDay();
      const diff = d.getDate() - day - 6; // Last Monday
      start = new Date(d.setDate(diff));
      const lastWeekEnd = new Date(start);
      lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
      lastWeekEnd.setHours(23, 59, 59, 999);
      end = lastWeekEnd;
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = todayEnd;
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'last_30_days': {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 29);
      start = d;
      end = todayEnd;
      break;
    }
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = todayEnd;
      break;
    case 'custom':
      if (customStart) start = new Date(new Date(customStart).setHours(0, 0, 0, 0));
      if (customEnd) end = new Date(new Date(customEnd).setHours(23, 59, 59, 999));
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = todayEnd;
      break;
  }

  return { start, end, todayStart, todayEnd };
};

export const getDashboardStats = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { start, end, todayStart, todayEnd } = parseDateRange(period, startDate, endDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. Period Sales & Live Today Sales Aggregations
    const [
      periodSalesAgg,
      todaySalesAgg,
      totalOrders,
      completedOrders,
      pendingOrders,
      confirmedOrders,
      assignedOrders,
      outForDeliveryOrders,
      cancelledOrders,
      returnedOrders,
      onlineOrdersCount,
      offlineOrdersCount
    ] = await Promise.all([
      // Sales within selected period (excluding Cancelled & Returned)
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: start, $lte: end },
            paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] },
            status: { $nin: ['Cancelled', 'Returned'] }
          } 
        },
        { 
          $group: {
            _id: null,
            grossSales: { $sum: "$amount" },
            totalTax: { $sum: { $ifNull: ["$tax", 0] } },
            discounts: { $sum: { $ifNull: ["$discount", 0] } },
            refundAmount: { $sum: { $ifNull: ["$refundAmount", 0] } },
            onlineSales: { $sum: { $cond: [ { $eq: ["$orderType", "ONLINE"] }, "$amount", 0 ] } },
            offlineSales: { $sum: { $cond: [ { $eq: ["$orderType", "OFFLINE"] }, "$amount", 0 ] } }
          }
        }
      ]),

      // Today's Live Sales (Independent of global date range for real-time awareness)
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: todayStart, $lte: todayEnd },
            paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] },
            status: { $nin: ['Cancelled', 'Returned'] }
          } 
        },
        { 
          $group: {
            _id: null,
            grossSales: { $sum: "$amount" },
            refundAmount: { $sum: { $ifNull: ["$refundAmount", 0] } }
          }
        }
      ]),

      // Order counts in period
      Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: { $in: ['Delivered', 'Completed'] } }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'Pending' }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'Confirmed' }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'Assigned' }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'OutForDelivery' }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'Cancelled' }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'Returned' }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, orderType: 'ONLINE' }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, orderType: 'OFFLINE' })
    ]);

    // 2. Customers, Inventory & Static Counts
    const [
      totalCustomers,
      newCustomersInPeriod,
      returningCustomers,
      totalProducts,
      totalStaff,
      totalSuppliers,
      lowStockCount,
      outOfStockCount,
      expiringSoonCount,
      expiredCount,
      inventoryValAgg,
      paymentAgg,
      pendingRefundsCount,
      failedPaymentsCount
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Customer.countDocuments({ orderCount: { $gt: 1 } }),
      Product.countDocuments(),
      User.countDocuments(),
      Supplier.countDocuments(),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, isTrackInventory: true, stock: { $gt: 0 } }),
      Product.countDocuments({ stock: 0, isTrackInventory: true }),
      ProductBatch.countDocuments({ expiryDate: { $lte: thirtyDaysFromNow, $gte: now }, stock: { $gt: 0 } }),
      ProductBatch.countDocuments({ expiryDate: { $lt: now }, stock: { $gt: 0 } }),
      ProductBatch.aggregate([
        { $match: { stock: { $gt: 0 } } },
        { $group: { 
          _id: null, 
          inventoryValue: { 
            $sum: { 
              $multiply: [
                "$stock", 
                { $ifNull: ["$unitCost", { $ifNull: ["$costPrice", 0] }] }
              ] 
            } 
          } 
        }}
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: {
          _id: null,
          totalPaid: { $sum: { $cond: [ { $in: ["$paymentStatus", ["Success", "Paid"]] }, "$amount", 0 ] } },
          cashAmount: { $sum: { $cond: [ { $and: [ { $eq: ["$paymentMethod", "Cash"] }, { $in: ["$paymentStatus", ["Success", "Paid"]] } ] }, "$amount", 0 ] } },
          upiAmount: { $sum: { $cond: [ { $and: [ { $eq: ["$paymentMethod", "UPI"] }, { $in: ["$paymentStatus", ["Success", "Paid"]] } ] }, "$amount", 0 ] } },
          cardAmount: { $sum: { $cond: [ { $and: [ { $eq: ["$paymentMethod", "Card"] }, { $in: ["$paymentStatus", ["Success", "Paid"]] } ] }, "$amount", 0 ] } },
          razorpayAmount: { $sum: { $cond: [ { $and: [ { $eq: ["$paymentMethod", "Razorpay"] }, { $in: ["$paymentStatus", ["Success", "Paid"]] } ] }, "$amount", 0 ] } },
          refundedAmount: { $sum: { $ifNull: ["$refundAmount", 0] } }
        }}
      ]),
      RefundQueue.countDocuments({ status: { $in: ['Pending', 'Retrying'] } }),
      Transaction.countDocuments({ createdAt: { $gte: start, $lte: end }, paymentStatus: 'Failed' })
    ]);

    const pSales = periodSalesAgg[0] || { grossSales: 0, totalTax: 0, discounts: 0, refundAmount: 0, onlineSales: 0, offlineSales: 0 };
    const tSales = todaySalesAgg[0] || { grossSales: 0, refundAmount: 0 };
    const payments = paymentAgg[0] || { totalPaid: 0, cashAmount: 0, upiAmount: 0, cardAmount: 0, razorpayAmount: 0, refundedAmount: 0 };

    const netSales = roundTo(pSales.grossSales - pSales.refundAmount, 2);
    const netSalesToday = roundTo(tSales.grossSales - tSales.refundAmount, 2);

    res.json({
      periodInfo: { period: period || 'this_month', startDate: start, endDate: end },
      sales: {
        grossSales: roundTo(pSales.grossSales, 2),
        refundAmount: roundTo(pSales.refundAmount, 2),
        netSales,
        salesToday: roundTo(tSales.grossSales, 2),
        netSalesToday,
        totalTax: roundTo(pSales.totalTax, 2),
        discounts: roundTo(pSales.discounts, 2),
        onlineSales: roundTo(pSales.onlineSales, 2),
        offlineSales: roundTo(pSales.offlineSales, 2)
      },
      orders: {
        totalOrders,
        completedOrders,
        pendingOrders,
        confirmedOrders,
        assignedOrders,
        outForDeliveryOrders,
        cancelledOrders,
        returnedOrders,
        onlineOrdersCount,
        offlineOrdersCount
      },
      customers: {
        totalCustomers,
        newCustomers: newCustomersInPeriod,
        returningCustomers
      },
      inventory: {
        totalProducts,
        totalSuppliers,
        totalStaff,
        lowStockCount,
        outOfStockCount,
        expiringSoonCount,
        expiredCount,
        inventoryValue: roundTo(inventoryValAgg[0]?.inventoryValue || 0, 2)
      },
      finance: {
        totalPaid: roundTo(payments.totalPaid, 2),
        cashAmount: roundTo(payments.cashAmount, 2),
        upiAmount: roundTo(payments.upiAmount, 2),
        cardAmount: roundTo(payments.cardAmount, 2),
        razorpayAmount: roundTo(payments.razorpayAmount, 2),
        refundedAmount: roundTo(payments.refundedAmount, 2)
      },
      actionCenter: {
        pendingRefundsCount,
        failedPaymentsCount,
        pendingOrdersCount: pendingOrders,
        criticalLowStockCount: outOfStockCount + lowStockCount
      }
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getSalesChart = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { start, end } = parseDateRange(period, startDate, endDate);

    const sales = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end }, 
          paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] },
          status: { $nin: ['Cancelled', 'Returned'] }
        } 
      },
      { 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          grossSales: { $sum: "$amount" },
          refundAmount: { $sum: { $ifNull: ["$refundAmount", 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build continuous date intervals
    const result = [];
    const curr = new Date(start);
    const stop = new Date(end);

    // Limit day iteration to prevent runaway loops if custom range is large
    let iterations = 0;
    while (curr <= stop && iterations < 90) {
      const dateStr = curr.toISOString().split('T')[0];
      const found = sales.find(s => s._id === dateStr);
      const gross = found ? roundTo(found.grossSales, 2) : 0;
      const refund = found ? roundTo(found.refundAmount, 2) : 0;
      result.push({
        _id: curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: dateStr,
        grossSales: gross,
        refundAmount: refund,
        netSales: roundTo(gross - refund, 2),
        sales: roundTo(gross - refund, 2) // Backward compatibility
      });
      curr.setDate(curr.getDate() + 1);
      iterations++;
    }

    res.json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getOrdersChart = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { start, end } = parseDateRange(period, startDate, endDate);

    const orders = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
        _id: { 
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          type: "$orderType"
        },
        count: { $sum: 1 }
      }}
    ]);

    const result = [];
    const curr = new Date(start);
    const stop = new Date(end);

    let iterations = 0;
    while (curr <= stop && iterations < 90) {
      const dateStr = curr.toISOString().split('T')[0];
      const onlineObj = orders.find(o => o._id.date === dateStr && o._id.type === 'ONLINE');
      const offlineObj = orders.find(o => o._id.date === dateStr && o._id.type === 'OFFLINE');

      result.push({
        _id: curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: dateStr,
        online: onlineObj ? onlineObj.count : 0,
        offline: offlineObj ? offlineObj.count : 0,
        total: (onlineObj ? onlineObj.count : 0) + (offlineObj ? offlineObj.count : 0)
      });
      curr.setDate(curr.getDate() + 1);
      iterations++;
    }

    res.json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getTopSellingProducts = async (req, res) => {
  try {
    const { period, startDate, endDate, limit = 5 } = req.query;
    const { start, end } = parseDateRange(period, startDate, endDate);

    const products = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['Delivered', 'Completed'] } 
        } 
      },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.product",
        productName: { $first: "$items.productName" },
        unit: { $first: "$items.unit" },
        totalSold: { $sum: "$items.qty" },
        totalRevenue: { $sum: "$items.total" }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) || 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productDetails' } },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } }
    ]);

    const result = products.map(p => ({
      _id: p._id,
      productName: p.productName || p.productDetails?.name || 'Unknown Product',
      unit: p.unit || p.productDetails?.baseUnit || 'PCS',
      totalSold: roundTo(p.totalSold, 2),
      totalRevenue: roundTo(p.totalRevenue, 2),
      featuredImage: p.productDetails?.featuredImage || '',
      category: p.productDetails?.category || null,
      stock: p.productDetails?.stock || 0
    }));

    res.json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getRecentTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate({
        path: 'order',
        select: 'orderNumber billNumber orderType customer',
        populate: {
          path: 'customer',
          model: 'Customer',
          select: 'name phone'
        }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json(transactions);
  } catch (error) {
    console.error('getRecentTransactions error:', error);
    res.status(500).json({ message: error.message });
  }
};

import InventoryService from '../services/InventoryService.js';
import InventoryLog from '../models/InventoryLog.js';
import ProductBatch from '../models/ProductBatch.js';
import Product from '../models/Product.js';

import mongoose from 'mongoose';

export const addStockEntry = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, variantId, supplierId, batchNumber, quantity, costPrice, manufacturingDate, expiryDate, note } = req.body;
    
    const batch = await InventoryService.addStock({
      productId, variantId, supplierId, batchNumber, quantity, costPrice, manufacturingDate, expiryDate,
      user: req.user._id, note
    }, session);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(batch);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const getInventoryLogs = async (req, res) => {
  try {
    let { page = 1, limit = 20, startDate, endDate, type, product, user, supplier } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 100) limit = 100;

    let query = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (type) query.type = type;
    if (product) query.product = product;
    if (user) query.user = user;

    // Supplier filtering relies on populating ProductBatch, which is tricky with pagination
    // Ideally, we store supplier ID directly on the log if we want to filter efficiently.
    // Since supplier filter is rare, we'll keep it simple: if supplier is queried, we'll do an aggregate or skip pagination for it.
    // For now, we will handle basic pagination on logs.

    const total = await InventoryLog.countDocuments(query);

    let logs = await InventoryLog.find(query)
      .populate('product', 'name sku barcode')
      .populate({ path: 'batch', populate: { path: 'supplier', select: 'name' } })
      .populate('user', 'name')
      .sort('-date')
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      data: logs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    // Find products where stock is <= lowStockThreshold and isTrackInventory is true
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      isTrackInventory: true
    }).populate('category', 'name');
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExpiringProducts = async (req, res) => {
  try {
    const { days } = req.query; // 30, 15, 10, 5, 0 (expired)
    
    let query = { stock: { $gt: 0 } };
    
    if (days !== undefined) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + parseInt(days));
      
      if (parseInt(days) === 0) {
        query.expiryDate = { $lt: new Date() }; // Expired
      } else {
        query.expiryDate = { $lt: targetDate, $gte: new Date() }; // Expiring within X days
      }
    }
    
    const batches = await ProductBatch.find(query).populate('product', 'name sku barcode').sort('expiryDate');
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

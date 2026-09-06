import InventoryService from '../services/InventoryService.js';
import InventoryLog from '../models/InventoryLog.js';
import ProductBatch from '../models/ProductBatch.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import { clearReportsCache } from '../utils/cache.js';

export const addStockEntry = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      productId, 
      variantId, 
      supplierId, 
      batchNumber, 
      quantity, 
      unit, 
      unitCost, 
      totalCost, 
      manufacturingDate, 
      expiryDate, 
      note 
    } = req.body;
    
    const batch = await InventoryService.addStock({
      productId, 
      variantId, 
      supplierId, 
      batchNumber, 
      quantity, 
      unit, 
      unitCost, 
      totalCost, 
      manufacturingDate, 
      expiryDate, 
      user: req.user._id, 
      note
    }, session);

    await session.commitTransaction();
    session.endSession();

    clearReportsCache();
    res.status(201).json(batch);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

export const adjustStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, variantId, batchId, newPhysicalStock, reason } = req.body;
    const result = await InventoryService.adjustStock({
      productId, 
      variantId, 
      batchId, 
      newPhysicalStock, 
      reason, 
      user: req.user._id
    }, session);

    await session.commitTransaction();
    session.endSession();

    clearReportsCache();
    res.json({ message: 'Stock adjusted successfully', ...result });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

export const recordDamage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, variantId, batchId, quantity, reason, note } = req.body;
    const result = await InventoryService.recordDamage({
      productId, 
      variantId, 
      batchId, 
      quantity, 
      reason, 
      note, 
      user: req.user._id
    }, session);

    await session.commitTransaction();
    session.endSession();

    clearReportsCache();
    res.json({ message: 'Damage recorded successfully', ...result });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

export const supplierReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { supplierId, productId, variantId, batchId, quantity, reason, referenceNumber } = req.body;
    const result = await InventoryService.supplierReturn({
      supplierId, 
      productId, 
      variantId, 
      batchId, 
      quantity, 
      reason, 
      referenceNumber, 
      user: req.user._id
    }, session);

    await session.commitTransaction();
    session.endSession();

    clearReportsCache();
    res.json({ message: 'Vendor return recorded successfully', ...result });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

export const getInventoryLogs = async (req, res) => {
  try {
    let { page = 1, limit = 50, startDate, endDate, type, product, user, supplier } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 150) limit = 150;

    let query = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (type && type !== 'All') query.type = type;
    if (product) query.product = product;
    if (user) query.user = user;
    if (supplier) query.supplier = supplier;

    const total = await InventoryLog.countDocuments(query);

    const logs = await InventoryLog.find(query)
      .populate('product', 'name baseSku barcode baseUnit')
      .populate('batch', 'batchNumber expiryDate unitCost')
      .populate('supplier', 'name companyName')
      .populate('user', 'name role')
      .sort({ date: -1 })
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
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      isTrackInventory: true
    })
    .populate('category', 'name')
    .populate('subcategory', 'name');
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExpiringProducts = async (req, res) => {
  try {
    const { days } = req.query; // 30, 15, 10, 5, 0 (expired)
    
    // Find products that have expiry tracking ON
    const expiryTrackedProducts = await Product.find({ hasExpiryTracking: true }).select('_id');
    const productIds = expiryTrackedProducts.map(p => p._id);

    let query = { 
      product: { $in: productIds }, 
      stock: { $gt: 0 },
      expiryDate: { $ne: null }
    };
    
    if (days !== undefined) {
      const now = new Date();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + parseInt(days));
      
      if (parseInt(days) === 0) {
        query.expiryDate = { $lt: now }; // Expired
      } else {
        query.expiryDate = { $lt: targetDate, $gte: now }; // Expiring in X days
      }
    }
    
    const batches = await ProductBatch.find(query)
      .populate('product', 'name baseSku barcode baseUnit category')
      .populate('supplier', 'name companyName')
      .sort({ expiryDate: 1 });
      
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

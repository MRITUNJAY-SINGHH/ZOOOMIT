import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import ProductBatch from '../models/ProductBatch.js';

export const getProducts = async (req, res) => {
  try {
    let { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = '', 
      category = '', 
      subcategory = '', 
      productType = '', 
      hasExpiryTracking = '',
      needsReview = ''
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 150) limit = 150;

    let query = {};
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (productType) query.productType = productType;
    if (hasExpiryTracking === 'true') query.hasExpiryTracking = true;
    if (hasExpiryTracking === 'false') query.hasExpiryTracking = false;
    if (needsReview === 'true') query.needsReview = true;

    if (search) {
      // Find matching categories first
      const Category = (await import('../models/Category.js')).default;
      const matchingCategories = await Category.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const categoryIds = matchingCategories.map(c => c._id);

      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { baseSku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];

      if (categoryIds.length > 0) {
        query.$or.push({ category: { $in: categoryIds } });
      }
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('preferredSupplier', 'name companyName phone gstNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.json({
      data: products,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('preferredSupplier', 'name companyName contactPerson phone email gstNumber paymentTerms');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const variants = await ProductVariant.find({ product: product._id });
    
    res.json({ product, variants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- PRODUCT SUPPLIER HISTORY & SMART PREFILL ---
export const getProductSupplierHistory = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('preferredSupplier', 'name companyName contactPerson phone email gstNumber paymentTerms status');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Fetch all batches for this product
    const batches = await ProductBatch.find({ product: product._id })
      .populate('supplier', 'name companyName contactPerson phone email gstNumber paymentTerms status')
      .sort({ createdAt: -1 });

    const supplierMap = new Map();

    batches.forEach(batch => {
      if (!batch.supplier) return;
      const suppId = batch.supplier._id.toString();
      if (!supplierMap.has(suppId)) {
        supplierMap.set(suppId, {
          supplier: batch.supplier,
          isPreferred: product.preferredSupplier?._id?.toString() === suppId,
          lastPurchaseQty: batch.purchaseQty || batch.stock,
          lastPurchaseUnit: batch.purchaseUnit || batch.unit || product.purchaseUnit || product.baseUnit,
          lastUnitCost: batch.purchaseUnitCost || batch.unitCost || product.costPrice || 0,
          lastPurchaseDate: batch.createdAt,
          totalBatchesCount: 1,
          totalQuantitySupplied: batch.stock || 0
        });
      } else {
        const existing = supplierMap.get(suppId);
        existing.totalBatchesCount += 1;
        existing.totalQuantitySupplied += (batch.stock || 0);
      }
    });

    // If preferredSupplier exists but has no batches yet, add it
    if (product.preferredSupplier && !supplierMap.has(product.preferredSupplier._id.toString())) {
      supplierMap.set(product.preferredSupplier._id.toString(), {
        supplier: product.preferredSupplier,
        isPreferred: true,
        lastPurchaseQty: 0,
        lastPurchaseUnit: product.purchaseUnit || product.baseUnit || 'PCS',
        lastUnitCost: product.costPrice || 0,
        lastPurchaseDate: null,
        totalBatchesCount: 0,
        totalQuantitySupplied: 0
      });
    }

    const suppliers = Array.from(supplierMap.values());

    // Determine recommended supplier: Preferred first, else most recent batch supplier
    let recommendedSupplier = null;
    if (product.preferredSupplier) {
      recommendedSupplier = product.preferredSupplier;
    } else if (suppliers.length > 0) {
      recommendedSupplier = suppliers[0].supplier;
    }

    // Context summary of the last purchase
    let lastPurchaseSummary = null;
    if (suppliers.length > 0 && suppliers[0].lastPurchaseDate) {
      const topSupp = suppliers[0];
      lastPurchaseSummary = {
        supplierId: topSupp.supplier._id,
        supplierName: topSupp.supplier.companyName || topSupp.supplier.name,
        qty: topSupp.lastPurchaseQty,
        unit: topSupp.lastPurchaseUnit,
        unitCost: topSupp.lastUnitCost,
        purchaseDate: topSupp.lastPurchaseDate,
        factor: product.purchaseToStockFactor || 1,
        isPreferred: topSupp.isPreferred
      };
    }

    res.json({
      product,
      suppliers,
      preferredSupplier: product.preferredSupplier,
      recommendedSupplier,
      lastPurchaseSummary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    // Generate baseSku if not provided
    if (!req.body.baseSku) {
      req.body.baseSku = `SKU-${Date.now().toString().slice(-6)}`;
    }
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    await ProductVariant.deleteMany({ product: product._id });
    await ProductBatch.deleteMany({ product: product._id });
    await Product.deleteOne({ _id: product._id });
    
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ message: 'Invalid productIds array' });
    }
    
    await ProductVariant.deleteMany({ product: { $in: productIds } });
    await ProductBatch.deleteMany({ product: { $in: productIds } });
    await Product.deleteMany({ _id: { $in: productIds } });
    
    res.json({ message: 'Products removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POS Specific endpoint
export const searchProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    let product = await Product.findOne({ barcode })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');
    
    if (product) return res.json({ type: 'Product', data: product });
    
    // Check variants
    const variant = await ProductVariant.findOne({ barcode }).populate({
      path: 'product',
      populate: [{ path: 'category' }, { path: 'subcategory' }]
    });
    if (variant) return res.json({ type: 'Variant', data: variant.product, variantData: variant });

    res.status(404).json({ message: 'Barcode not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- VARIANTS ---
export const addVariant = async (req, res) => {
  try {
    const variant = new ProductVariant({ ...req.body, product: req.params.id });
    await variant.save();
    res.status(201).json(variant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findByIdAndUpdate(req.params.variantId, req.body, { new: true });
    if (!variant) return res.status(404).json({ message: 'Variant not found' });
    res.json(variant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteVariant = async (req, res) => {
  try {
    await ProductVariant.findByIdAndDelete(req.params.variantId);
    res.json({ message: 'Variant removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- BATCHES ---
export const getProductBatches = async (req, res) => {
  try {
    const batches = await ProductBatch.find({ product: req.params.id })
      .populate('supplier', 'name companyName phone')
      .sort({ createdAt: -1 });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- BULK IMPORT ---
export const bulkImportProducts = async (req, res) => {
  const mongoose = (await import('mongoose')).default;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { products } = req.body; 
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const pData of products) {
      try {
        if (!pData.slug && pData.name) {
          pData.slug = pData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;
        }
        if (!pData.baseSku) {
          pData.baseSku = `SKU-${Date.now().toString().slice(-6)}`;
        }
        const product = new Product(pData);
        await product.save({ session });
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`Row error (${pData.name || 'Unknown'}): ${err.message}`);
      }
    }

    if (errorCount > 0 && successCount === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Bulk import failed completely`, successCount, errorCount, errors });
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ message: `Bulk import complete`, successCount, errorCount, errors });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

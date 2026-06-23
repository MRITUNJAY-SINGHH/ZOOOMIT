import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

export const getProducts = async (req, res) => {
  try {
    let { page = 1, limit = 20, search = '', status = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 100) limit = 100;

    let query = {};
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category')
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
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const variants = await ProductVariant.find({ product: product._id });
    
    res.json({ product, variants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
    let product = await Product.findOne({ barcode }).populate('category');
    
    if (product) return res.json({ type: 'Product', data: product });
    
    // Check variants
    const variant = await ProductVariant.findOne({ barcode }).populate('product');
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
    const { ProductBatch } = await import('../models/ProductBatch.js');
    const batches = await ProductBatch.find({ product: req.params.id }).populate('supplier');
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- BULK IMPORT ---
export const bulkImportProducts = async (req, res) => {
  const session = await (await import('mongoose')).startSession();
  session.startTransaction();

  try {
    const { products } = req.body; 
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // All or nothing approach within transaction, or we can just try/catch inside to collect errors
    // If we want detailed errors but still save good ones, we have to save good ones and commit.
    // If we want ALL or NOTHING, we throw on first error and abort.
    // The user requested "Wrap bulk import inside transaction. Return detailed results."
    
    for (const pData of products) {
      try {
        const product = new Product(pData);
        // Validating manually to catch schema errors before attempting save, or save could throw.
        await product.save({ session });
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`Row error: ${err.message}`);
      }
    }

    if (errorCount > 0 && successCount === 0) {
      // Abort if literally nothing succeeded
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

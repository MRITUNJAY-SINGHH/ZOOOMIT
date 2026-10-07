import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import ProductBatch from '../models/ProductBatch.js';
import ProductVariant from '../models/ProductVariant.js';
import Category from '../models/Category.js';

dotenv.config();

export const runDataMigration = async () => {
  console.log('🚀 Starting ZOOOMIT ERP Data Migration...');
  
  // 1. Migrate Products
  const products = await Product.find({});
  let migratedProducts = 0;
  let reviewedProducts = 0;

  for (const prod of products) {
    let updated = false;

    if (!prod.baseUnit) {
      const name = prod.name.toLowerCase();
      if (/(\b\d+(\.\d+)?\s*(kg|kilo|kgs)\b)/i.test(name) || name.includes('sugar') || name.includes('rice') || name.includes('flour') || name.includes('daal')) {
        prod.productType = 'WEIGHT';
        prod.baseUnit = 'KG';
        prod.purchaseUnit = 'BAG';
        prod.purchaseToStockFactor = 50;
        prod.sellingUnit = 'KG';
        prod.minSaleQty = 0.5;
        prod.maxSaleQty = 25;
        prod.qtyStep = 0.5;
        prod.needsReview = false;
      } else if (/(\b\d+(\.\d+)?\s*(gm|g|grams)\b)/i.test(name)) {
        prod.productType = 'WEIGHT';
        prod.baseUnit = 'GM';
        prod.purchaseUnit = 'KG';
        prod.purchaseToStockFactor = 1000;
        prod.sellingUnit = 'GM';
        prod.minSaleQty = 100;
        prod.maxSaleQty = 5000;
        prod.qtyStep = 100;
        prod.needsReview = false;
      } else if (/(\b\d+(\.\d+)?\s*(ltr|liter|litre|l)\b)/i.test(name) || name.includes('milk') || name.includes('oil')) {
        prod.productType = 'VOLUME';
        prod.baseUnit = 'LTR';
        prod.purchaseUnit = 'CRATE';
        prod.purchaseToStockFactor = 12;
        prod.sellingUnit = 'LTR';
        prod.minSaleQty = 0.5;
        prod.maxSaleQty = 20;
        prod.qtyStep = 0.5;
        prod.needsReview = false;
      } else if (/(\b\d+(\.\d+)?\s*(ml|milliliter)\b)/i.test(name)) {
        prod.productType = 'VOLUME';
        prod.baseUnit = 'ML';
        prod.purchaseUnit = 'LTR';
        prod.purchaseToStockFactor = 1000;
        prod.sellingUnit = 'ML';
        prod.minSaleQty = 100;
        prod.maxSaleQty = 2000;
        prod.qtyStep = 100;
        prod.needsReview = false;
      } else if (name.includes('biscuit') || name.includes('chips') || name.includes('snack') || name.includes('pack')) {
        prod.productType = 'PACK';
        prod.baseUnit = 'PACK';
        prod.purchaseUnit = 'BOX';
        prod.purchaseToStockFactor = 24;
        prod.sellingUnit = 'PACK';
        prod.minSaleQty = 1;
        prod.maxSaleQty = 50;
        prod.qtyStep = 1;
        prod.needsReview = false;
      } else {
        prod.productType = 'PIECE';
        prod.baseUnit = 'PCS';
        prod.purchaseUnit = 'BOX';
        prod.purchaseToStockFactor = 10;
        prod.sellingUnit = 'PCS';
        prod.minSaleQty = 1;
        prod.maxSaleQty = 50;
        prod.qtyStep = 1;
        prod.needsReview = true; // Mark ambiguous legacy product for admin review
        reviewedProducts++;
      }
      updated = true;
    }

    if (prod.taxRate === undefined || prod.taxRate === null) {
      prod.taxRate = 0;
      updated = true;
    }

    if (prod.hasExpiryTracking === undefined || prod.hasExpiryTracking === null) {
      const name = prod.name.toLowerCase();
      prod.hasExpiryTracking = name.includes('milk') || name.includes('bread') || name.includes('paneer') || name.includes('curd');
      updated = true;
    }

    if (updated) {
      await prod.save();
      migratedProducts++;
    }
  }

  console.log(`✅ Migrated ${migratedProducts} products (${reviewedProducts} flagged for admin review).`);

  // 2. Migrate Batches
  const batches = await ProductBatch.find({}).populate('product');
  let migratedBatches = 0;

  for (const b of batches) {
    let updated = false;

    if (!b.unitCost && b.costPrice) {
      b.unitCost = b.costPrice;
      updated = true;
    }

    if (!b.totalCost) {
      b.totalCost = Math.round((b.stock || 0) * (b.unitCost || b.costPrice || 0) * 100) / 100;
      updated = true;
    }

    if (!b.unit) {
      b.unit = b.product?.baseUnit || 'PCS';
      updated = true;
    }

    if (b.product && !b.product.hasExpiryTracking && b.expiryDate) {
      // Clear fake expiry date on non-perishables
      b.expiryDate = null;
      updated = true;
    }

    if (updated) {
      await b.save();
      migratedBatches++;
    }
  }

  console.log(`✅ Migrated ${migratedBatches} product batches with unitCost and totalCost.`);

  // 3. Migrate Variants
  const variants = await ProductVariant.find({}).populate('product');
  let migratedVariants = 0;

  for (const v of variants) {
    let updated = false;
    if (v.conversionFactor === undefined || v.conversionFactor === null) {
      const vName = v.name.toLowerCase();
      if (vName.includes('250g') || vName.includes('250 gm') || vName.includes('250 g')) {
        v.conversionFactor = 0.25;
        v.conversionUnit = 'KG';
      } else if (vName.includes('500g') || vName.includes('500 gm') || vName.includes('500 g')) {
        v.conversionFactor = 0.5;
        v.conversionUnit = 'KG';
      } else if (vName.includes('1kg') || vName.includes('1 kg')) {
        v.conversionFactor = 1;
        v.conversionUnit = 'KG';
      } else if (vName.includes('box') || vName.includes('pack of 12') || vName.includes('12 pack')) {
        v.conversionFactor = 12;
        v.conversionUnit = 'PCS';
      } else {
        v.conversionFactor = 1;
        v.conversionUnit = v.product?.baseUnit || 'PCS';
      }
      updated = true;
    }

    if (updated) {
      await v.save();
      migratedVariants++;
    }
  }

  console.log(`✅ Migrated ${migratedVariants} product variants with conversion factors.`);
  console.log('🎉 Data Migration Completed Successfully.');
};

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('migrateData.js')) {
  (async () => {
    try {
      await connectDB();
      await runDataMigration();
      process.exit(0);
    } catch (e) {
      console.error('Migration failed:', e);
      process.exit(1);
    }
  })();
}

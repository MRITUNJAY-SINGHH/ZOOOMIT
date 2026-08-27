import mongoose from 'mongoose';
import InventoryLog from '../models/InventoryLog.js';
import ProductBatch from '../models/ProductBatch.js';
import ProductVariant from '../models/ProductVariant.js';
import Product from '../models/Product.js';
import { roundTo, multiply, divide } from '../utils/decimalUtils.js';

class InventoryService {
  /**
   * Add stock (Procurement / Purchase / Inward)
   * Handles purchase unit conversion (e.g. 10 BAG * 50 KG/BAG = 500 KG base stock)
   */
  async addStock({ 
    productId, 
    variantId, 
    supplierId, 
    batchNumber, 
    quantity, 
    unit, 
    unitCost, 
    totalCost: customTotalCost, 
    manufacturingDate, 
    expiryDate, 
    user, 
    note 
  }, session = null) {
    const qty = Number(quantity);
    if (!qty || qty <= 0) throw new Error("Quantity must be greater than zero");

    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error("Product not found");

    const cost = Number(unitCost) || 0;
    if (cost < 0) throw new Error("Unit cost cannot be negative");

    // Check Purchase Unit Conversion
    let baseStockQty = qty;
    let purchaseUnitName = unit || product.purchaseUnit || product.baseUnit || 'PCS';
    let purchaseQty = qty;
    let purchaseUnitCost = cost;

    const baseUnitName = product.baseUnit || 'PCS';
    const conversionFactor = Number(product.purchaseToStockFactor) || 1;

    let computedTotalCost = customTotalCost !== undefined && customTotalCost !== null && customTotalCost !== '' 
      ? Number(customTotalCost) 
      : multiply(qty, cost, 2);

    if (purchaseUnitName === product.purchaseUnit && conversionFactor > 1) {
      baseStockQty = multiply(qty, conversionFactor, 3);
      // Cost per base unit
      var baseUnitCost = divide(computedTotalCost, baseStockQty, 2);
    } else {
      var baseUnitCost = cost;
      baseStockQty = roundTo(qty, 3);
    }

    // Expiry Validation
    let finalExpiryDate = null;
    if (product.hasExpiryTracking) {
      if (!expiryDate) {
        throw new Error(`Expiry Date is mandatory for perishable product: ${product.name}`);
      }
      finalExpiryDate = new Date(expiryDate);
      if (isNaN(finalExpiryDate.getTime())) {
        throw new Error("Invalid expiry date format");
      }
    }

    let batch = await ProductBatch.findOne({ product: productId, batchNumber }).session(session);
    
    if (!batch) {
      batch = new ProductBatch({
        product: productId,
        variant: variantId || null,
        supplier: supplierId || null,
        batchNumber,
        stock: baseStockQty,
        unit: baseUnitName,
        unitCost: baseUnitCost,
        totalCost: computedTotalCost,
        costPrice: baseUnitCost,
        purchaseUnit: purchaseUnitName,
        purchaseQty,
        purchaseUnitCost,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
        expiryDate: finalExpiryDate
      });
      await batch.save({ session });
    } else {
      batch.stock = roundTo(batch.stock + baseStockQty, 3);
      batch.totalCost = roundTo((batch.totalCost || 0) + computedTotalCost, 2);
      batch.unitCost = divide(batch.totalCost, batch.stock, 2);
      batch.costPrice = batch.unitCost;
      if (finalExpiryDate) batch.expiryDate = finalExpiryDate;
      await batch.save({ session });
    }

    await this.recalculateTotalStock(productId, variantId, session);

    const log = new InventoryLog({
      product: productId,
      variant: variantId || null,
      batch: batch._id,
      supplier: supplierId || null,
      type: 'PURCHASE',
      unit: baseUnitName,
      previousStock: roundTo(batch.stock - baseStockQty, 3),
      quantityChanged: baseStockQty,
      newStock: batch.stock,
      unitCost: baseUnitCost,
      totalCost: computedTotalCost,
      reason: note || `Stock Inward Batch ${batchNumber}`,
      user: user
    });
    await log.save({ session });

    return batch;
  }

  /**
   * Reduce stock for sales (POS / Online)
   * Strictly enforces FEFO for expiry items and blocks expired stock sales.
   * Supports decimal deductions and variant pack conversion factors.
   */
  async reduceStockForSale(items, user, orderId, session = null) {
    const { default: Settings } = await import('../models/Settings.js');
    const settings = await Settings.findOne().session(session);
    const allowNegativeStock = settings?.allowNegativeStock || false;

    for (const item of items) {
      const productId = item.productId || item.product;
      const variantId = item.variantId || item.variant;
      const requestedQty = Number(item.qty || item.quantity);
      
      const product = await Product.findById(productId).session(session);
      if (!product) throw new Error(`Product ${productId} not found`);

      // Determine deduction quantity in terms of base unit
      let baseQtyToDeduct = requestedQty;
      if (variantId) {
        const variant = await ProductVariant.findById(variantId).session(session);
        if (variant && variant.conversionFactor && variant.conversionFactor > 0) {
          baseQtyToDeduct = multiply(requestedQty, variant.conversionFactor, 3);
        }
      }

      const now = new Date();
      let batchesQuery = { product: productId, stock: { $gt: 0 } };
      let sortOrder = { createdAt: 1 }; // Default FIFO for non-expiry

      if (product.hasExpiryTracking) {
        // Only select unexpired batches
        batchesQuery.expiryDate = { $gt: now };
        sortOrder = { expiryDate: 1, createdAt: 1 }; // FEFO
      }

      const availableBatches = await ProductBatch.find(batchesQuery).sort(sortOrder).session(session);
      const totalAvailableUnexpired = roundTo(availableBatches.reduce((acc, b) => acc + b.stock, 0), 3);

      if (!allowNegativeStock && totalAvailableUnexpired < baseQtyToDeduct) {
        if (product.hasExpiryTracking) {
          const expiredBatches = await ProductBatch.find({ product: productId, stock: { $gt: 0 }, expiryDate: { $lte: now } }).session(session);
          if (expiredBatches.length > 0) {
            throw new Error(`Cannot complete sale: Stock for ${product.name} is expired. Unexpired stock: ${totalAvailableUnexpired} ${product.baseUnit}, Requested: ${baseQtyToDeduct} ${product.baseUnit}`);
          }
        }
        throw new Error(`Insufficient stock for ${product.name}. Available: ${totalAvailableUnexpired} ${product.baseUnit}, Requested: ${baseQtyToDeduct} ${product.baseUnit}`);
      }

      let remainingToReduce = baseQtyToDeduct;
      let batchIndex = 0;

      while (remainingToReduce > 0 && batchIndex < availableBatches.length) {
        const batch = availableBatches[batchIndex];
        const reduceAmount = Math.min(batch.stock, remainingToReduce);
        
        batch.stock = roundTo(batch.stock - reduceAmount, 3);
        await batch.save({ session });

        const log = new InventoryLog({
          product: productId,
          variant: variantId || null,
          batch: batch._id,
          type: 'SALE',
          unit: product.baseUnit || 'PCS',
          previousStock: roundTo(batch.stock + reduceAmount, 3),
          quantityChanged: -reduceAmount,
          newStock: batch.stock,
          unitCost: batch.unitCost || product.costPrice || 0,
          totalCost: multiply(reduceAmount, batch.unitCost || product.costPrice || 0, 2),
          reason: `Order ${orderId}`,
          user: user,
          order: mongoose.Types.ObjectId.isValid(orderId) ? orderId : null
        });
        await log.save({ session });

        remainingToReduce = roundTo(remainingToReduce - reduceAmount, 3);
        batchIndex++;
      }

      // Handle overselling if allowNegativeStock is true
      if (remainingToReduce > 0 && allowNegativeStock) {
        let batch = availableBatches.length > 0 ? availableBatches[availableBatches.length - 1] : await ProductBatch.findOne({ product: productId }).session(session);
        
        if (!batch) {
          batch = new ProductBatch({
            product: productId,
            batchNumber: `NEG-${Date.now()}`,
            stock: 0,
            unit: product.baseUnit || 'PCS',
            unitCost: product.costPrice || 0,
            totalCost: 0,
            costPrice: product.costPrice || 0
          });
        }
        
        batch.stock = roundTo(batch.stock - remainingToReduce, 3);
        await batch.save({ session });

        const log = new InventoryLog({
          product: productId,
          variant: variantId || null,
          batch: batch._id,
          type: 'SALE',
          unit: product.baseUnit || 'PCS',
          previousStock: roundTo(batch.stock + remainingToReduce, 3),
          quantityChanged: -remainingToReduce,
          newStock: batch.stock,
          unitCost: product.costPrice || 0,
          reason: `Order ${orderId} (Oversold)`,
          user: user,
          order: mongoose.Types.ObjectId.isValid(orderId) ? orderId : null
        });
        await log.save({ session });
      }

      await this.recalculateTotalStock(productId, variantId, session);
    }
  }

  /**
   * Physical Stock Count Adjustment & Reconciliation
   */
  async adjustStock({ productId, variantId, batchId, newPhysicalStock, reason, user }, session = null) {
    const targetStock = Number(newPhysicalStock);
    if (isNaN(targetStock) || targetStock < 0) throw new Error("Physical stock must be a non-negative number");

    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error("Product not found");

    let batch = batchId ? await ProductBatch.findById(batchId).session(session) : await ProductBatch.findOne({ product: productId }).sort({ createdAt: -1 }).session(session);
    
    if (!batch) {
      batch = new ProductBatch({
        product: productId,
        batchNumber: `ADJ-${Date.now()}`,
        stock: targetStock,
        unit: product.baseUnit || 'PCS',
        unitCost: product.costPrice || 0,
        totalCost: multiply(targetStock, product.costPrice || 0, 2),
        costPrice: product.costPrice || 0
      });
      await batch.save({ session });
    }

    const previousStock = batch.stock;
    const diff = roundTo(targetStock - previousStock, 3);
    batch.stock = targetStock;
    batch.totalCost = multiply(targetStock, batch.unitCost || product.costPrice || 0, 2);
    await batch.save({ session });

    await this.recalculateTotalStock(productId, variantId, session);

    const log = new InventoryLog({
      product: productId,
      variant: variantId || null,
      batch: batch._id,
      type: 'STOCK_ADJUSTMENT',
      unit: product.baseUnit || 'PCS',
      previousStock,
      quantityChanged: diff,
      newStock: targetStock,
      unitCost: batch.unitCost || product.costPrice || 0,
      totalCost: multiply(Math.abs(diff), batch.unitCost || product.costPrice || 0, 2),
      reason: reason || 'Physical Stock Audit Reconciliation',
      user: user
    });
    await log.save({ session });

    return { batch, log, diff };
  }

  /**
   * Record Damaged or Wasted Goods Write-off
   */
  async recordDamage({ productId, variantId, batchId, quantity, reason, note, user }, session = null) {
    const qty = Number(quantity);
    if (!qty || qty <= 0) throw new Error("Damage quantity must be greater than zero");

    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error("Product not found");

    const batch = batchId ? await ProductBatch.findById(batchId).session(session) : await ProductBatch.findOne({ product: productId, stock: { $gt: 0 } }).session(session);
    if (!batch) throw new Error("No active batch found with stock to write off");

    if (batch.stock < qty) {
      throw new Error(`Cannot write off ${qty} ${product.baseUnit}. Batch stock is only ${batch.stock}`);
    }

    const previousStock = batch.stock;
    batch.stock = roundTo(batch.stock - qty, 3);
    await batch.save({ session });

    await this.recalculateTotalStock(productId, variantId, session);

    const log = new InventoryLog({
      product: productId,
      variant: variantId || null,
      batch: batch._id,
      type: 'DAMAGED',
      unit: product.baseUnit || 'PCS',
      previousStock,
      quantityChanged: -qty,
      newStock: batch.stock,
      unitCost: batch.unitCost || product.costPrice || 0,
      totalCost: multiply(qty, batch.unitCost || product.costPrice || 0, 2),
      reason: `${reason || 'Damage/Wastage'}: ${note || ''}`.trim(),
      user: user
    });
    await log.save({ session });

    return { batch, log };
  }

  /**
   * Supplier Return (Outward stock deduction)
   */
  async supplierReturn({ supplierId, productId, variantId, batchId, quantity, reason, referenceNumber, user }, session = null) {
    const qty = Number(quantity);
    if (!qty || qty <= 0) throw new Error("Return quantity must be greater than zero");

    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error("Product not found");

    const batch = batchId ? await ProductBatch.findById(batchId).session(session) : await ProductBatch.findOne({ product: productId, stock: { $gt: 0 } }).session(session);
    if (!batch) throw new Error("No active batch found to return to vendor");

    if (batch.stock < qty) {
      throw new Error(`Cannot return ${qty} ${product.baseUnit}. Batch only has ${batch.stock}`);
    }

    const previousStock = batch.stock;
    batch.stock = roundTo(batch.stock - qty, 3);
    await batch.save({ session });

    await this.recalculateTotalStock(productId, variantId, session);

    const log = new InventoryLog({
      product: productId,
      variant: variantId || null,
      batch: batch._id,
      supplier: supplierId || batch.supplier || null,
      type: 'SUPPLIER_RETURN',
      unit: product.baseUnit || 'PCS',
      previousStock,
      quantityChanged: -qty,
      newStock: batch.stock,
      unitCost: batch.unitCost || 0,
      totalCost: multiply(qty, batch.unitCost || 0, 2),
      reason: `Vendor Return (${referenceNumber || 'Debit Note'}): ${reason || 'Returned to supplier'}`,
      user: user
    });
    await log.save({ session });

    return { batch, log };
  }

  /**
   * Restock on Return / Order Cancellation
   */
  async returnStock(productId, variantId, batchId, quantity, reason, user, orderId, session = null) {
    const returnQty = roundTo(quantity, 3);
    const product = await Product.findById(productId).session(session);
    let batch = batchId ? await ProductBatch.findById(batchId).session(session) : null;
    
    if (!batch) {
      batch = await ProductBatch.findOne({ product: productId }).sort({ createdAt: -1 }).session(session);
    }

    if (!batch) {
      batch = new ProductBatch({
        product: productId,
        variant: variantId || null,
        batchNumber: `RET-${Date.now()}`,
        stock: returnQty,
        unit: product?.baseUnit || 'PCS',
        unitCost: product?.costPrice || 0,
        totalCost: multiply(returnQty, product?.costPrice || 0, 2),
        costPrice: product?.costPrice || 0
      });
      await batch.save({ session });
    } else {
      batch.stock = roundTo(batch.stock + returnQty, 3);
      await batch.save({ session });
    }

    const log = new InventoryLog({
      product: productId,
      variant: variantId || null,
      batch: batch._id,
      type: 'RETURN',
      unit: product?.baseUnit || 'PCS',
      previousStock: roundTo(batch.stock - returnQty, 3),
      quantityChanged: returnQty,
      newStock: batch.stock,
      reason: reason || 'Return / Restock',
      user: user,
      order: mongoose.Types.ObjectId.isValid(orderId) ? orderId : null
    });
    await log.save({ session });

    await this.recalculateTotalStock(productId, variantId, session);
    return batch;
  }

  /**
   * Recalculate total product and variant stock with decimal safety
   */
  async recalculateTotalStock(productId, variantId, session = null) {
    const productBatches = await ProductBatch.find({ product: productId }).session(session);
    const totalProductStock = roundTo(productBatches.reduce((acc, b) => acc + (b.stock || 0), 0), 3);
    await Product.findByIdAndUpdate(productId, { stock: totalProductStock }, { session });

    if (variantId) {
      const variantBatches = await ProductBatch.find({ variant: variantId }).session(session);
      const totalVariantStock = roundTo(variantBatches.reduce((acc, b) => acc + (b.stock || 0), 0), 3);
      await ProductVariant.findByIdAndUpdate(variantId, { stock: totalVariantStock }, { session });
    }
  }
}

export default new InventoryService();

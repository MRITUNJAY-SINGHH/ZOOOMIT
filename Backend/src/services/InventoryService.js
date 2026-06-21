import InventoryLog from '../models/InventoryLog.js';
import ProductBatch from '../models/ProductBatch.js';
import ProductVariant from '../models/ProductVariant.js';
import Product from '../models/Product.js';

class InventoryService {
  /**
   * Add stock (Purchase/Restock)
   */
  async addStock({ productId, variantId, supplierId, batchNumber, quantity, costPrice, manufacturingDate, expiryDate, user, note }, session = null) {
    if (quantity <= 0) throw new Error("Quantity must be greater than zero");

    let batch = await ProductBatch.findOne({ productId, batchNumber }).session(session);
    
    if (!batch) {
      batch = new ProductBatch({
        product: productId,
        variant: variantId,
        supplier: supplierId,
        batchNumber,
        stock: quantity,
        costPrice,
        manufacturingDate,
        expiryDate
      });
      await batch.save({ session });
    } else {
      batch.stock += quantity;
      await batch.save({ session });
    }

    await this.recalculateTotalStock(productId, variantId, session);

    const log = new InventoryLog({
      product: productId,
      variant: variantId,
      batch: batch._id,
      type: 'PURCHASE',
      previousStock: batch.stock - quantity,
      quantityChanged: quantity,
      newStock: batch.stock,
      reason: note || 'Stock Entry',
      user: user
    });
    await log.save({ session });

    return batch;
  }

  /**
   * Reduce stock (Sale) - Uses FIFO based on expiry or batch creation
   */
  async reduceStockForSale(items, user, orderId, session = null) {
    for (const item of items) {
      const { productId, variantId, qty } = item;
      let remainingQtyToReduce = qty;

      const batches = await ProductBatch.find({ product: productId, stock: { $gt: 0 } })
        .sort({ expiryDate: 1, createdAt: 1 })
        .session(session);

      let batchIndex = 0;
      while (remainingQtyToReduce > 0 && batchIndex < batches.length) {
        const batch = batches[batchIndex];
        const reduceAmount = Math.min(batch.stock, remainingQtyToReduce);
        
        batch.stock -= reduceAmount;
        await batch.save({ session });

        const log = new InventoryLog({
          product: productId,
          variant: variantId,
          batch: batch._id,
          type: 'SALE',
          previousStock: batch.stock + reduceAmount,
          quantityChanged: -reduceAmount,
          newStock: batch.stock,
          reason: `Order ${orderId}`,
          user: user,
          order: orderId
        });
        await log.save({ session });

        remainingQtyToReduce -= reduceAmount;
        batchIndex++;
      }

      if (remainingQtyToReduce > 0) {
        console.warn(`Oversold product ${productId}. Missing ${remainingQtyToReduce} units.`);
      }

      await this.recalculateTotalStock(productId, variantId, session);
    }
  }

  /**
   * Return stock
   */
  async returnStock(productId, variantId, batchId, quantity, reason, user, orderId, session = null) {
    const batch = await ProductBatch.findById(batchId).session(session);
    if (!batch) throw new Error("Batch not found for return");

    batch.stock += quantity;
    await batch.save({ session });

    const log = new InventoryLog({
      product: productId,
      variant: variantId,
      batch: batch._id,
      type: 'RETURN',
      previousStock: batch.stock - quantity,
      quantityChanged: quantity,
      newStock: batch.stock,
      reason: reason || 'POS Return',
      user: user,
      order: orderId
    });
    await log.save({ session });

    await this.recalculateTotalStock(productId, variantId, session);
    return batch;
  }

  /**
   * Return stock (Auto - doesn't require specific batch ID, adds to latest active batch)
   */
  async autoReturnStock(productId, variantId, quantity, reason, user, orderId, session = null) {
    let batch = await ProductBatch.findOne({ product: productId }).sort({ createdAt: -1 }).session(session);
    if (!batch) {
      batch = new ProductBatch({
        product: productId,
        variant: variantId,
        batchNumber: `RET-${Date.now()}`,
        stock: quantity,
        costPrice: 0,
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      });
      await batch.save({ session });
    } else {
      batch.stock += quantity;
      await batch.save({ session });
    }

    const log = new InventoryLog({
      product: productId,
      variant: variantId,
      batch: batch._id,
      type: 'RETURN',
      previousStock: batch.stock - quantity,
      quantityChanged: quantity,
      newStock: batch.stock,
      reason: reason || 'POS Partial Return',
      user: user,
      order: orderId
    });
    await log.save({ session });

    const productBatches = await ProductBatch.find({ product: productId }).session(session);
    const totalProductStock = productBatches.reduce((acc, b) => acc + b.stock, 0);
    await Product.findByIdAndUpdate(productId, { stock: totalProductStock }, { session });

    return batch;
  }

  /**
   * Helper to keep Product and Variant stock fields in sync with batches
   */
  async recalculateTotalStock(productId, variantId, session = null) {
    const productBatches = await ProductBatch.find({ product: productId }).session(session);
    const totalProductStock = productBatches.reduce((acc, b) => acc + b.stock, 0);
    await Product.findByIdAndUpdate(productId, { stock: totalProductStock }, { session });

    if (variantId) {
      const variantBatches = await ProductBatch.find({ variant: variantId }).session(session);
      const totalVariantStock = variantBatches.reduce((acc, b) => acc + b.stock, 0);
      await ProductVariant.findByIdAndUpdate(variantId, { stock: totalVariantStock }, { session });
    }
  }
}

export default new InventoryService();

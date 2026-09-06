import PurchaseOrder from '../models/PurchaseOrder.js';
import PurchaseEntry from '../models/PurchaseEntry.js';
import PurchaseReturn from '../models/PurchaseReturn.js';
import Sequence from '../models/Sequence.js';
import Supplier from '../models/Supplier.js';
import InventoryService from '../services/InventoryService.js';
import mongoose from 'mongoose';

// ========================
// PURCHASE ORDERS
// ========================

export const getPurchaseOrders = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find()
      .populate('supplier', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('items.product', 'name sku baseUnit purchaseUnit')
      .populate('items.variant', 'name');
    if (!po) return res.status(404).json({ message: 'Purchase Order not found' });
    res.json(po);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPurchaseOrder = async (req, res) => {
  try {
    const orderNumber = `PO-${new Date().getFullYear()}-${String(await Sequence.getNextValue('PO')).padStart(6, '0')}`;
    const po = new PurchaseOrder({ ...req.body, orderNumber });
    await po.save();
    res.status(201).json(po);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ message: 'Purchase Order not found' });
    if (po.status === 'Received' || po.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot edit Received or Cancelled PO' });
    }
    
    // Only allow specific updates if Partially Received
    if (po.status === 'Partially Received' && req.body.items) {
       // Validate that receivedQty is not being tampered with maliciously
       for (const existingItem of po.items) {
           const incomingItem = req.body.items.find(i => i.product.toString() === existingItem.product.toString());
           if (incomingItem && incomingItem.requestedQty < existingItem.receivedQty) {
               return res.status(400).json({ message: `Cannot set requested quantity below already received quantity for a product` });
           }
       }
    }

    const updatedPo = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedPo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ========================
// PURCHASE ENTRY (GRN)
// ========================

export const getPurchaseEntries = async (req, res) => {
  try {
    const entries = await PurchaseEntry.find()
      .populate('supplier', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPurchaseEntry = async (req, res) => {
  try {
    const entry = await PurchaseEntry.findById(req.params.id)
      .populate('supplier')
      .populate('purchaseOrder', 'orderNumber')
      .populate('items.product', 'name sku baseUnit purchaseUnit')
      .populate('items.variant', 'name');
    if (!entry) return res.status(404).json({ message: 'Purchase Entry not found' });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPurchaseEntry = async (req, res) => {
  try {
    const entryNumber = `GRN-${new Date().getFullYear()}-${String(await Sequence.getNextValue('GRN')).padStart(6, '0')}`;
    const entry = new PurchaseEntry({ ...req.body, entryNumber, status: 'Draft' });
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePurchaseEntry = async (req, res) => {
  try {
    const entry = await PurchaseEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Purchase Entry not found' });
    if (entry.status === 'Finalized') return res.status(400).json({ message: 'Cannot edit Finalized GRN' });

    const updatedEntry = await PurchaseEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const finalizePurchaseEntry = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const entry = await PurchaseEntry.findById(req.params.id).session(session);
    if (!entry) throw new Error('Purchase Entry not found');
    if (entry.status === 'Finalized') throw new Error('GRN is already finalized');

    // 1. Process items using InventoryService (which adds batches, increases stock, writes logs)
    for (const item of entry.items) {
      await InventoryService.addStock({
        productId: item.product,
        variantId: item.variant,
        supplierId: entry.supplier,
        batchNumber: item.batchNumber,
        quantity: item.purchaseQty,
        unit: item.purchaseUnit,
        unitCost: item.unitCost,
        totalCost: item.total,
        receivedMrp: item.receivedMrp,
        manufacturingDate: item.manufacturingDate,
        expiryDate: item.expiryDate,
        user: req.user?._id,
        note: `Purchase GRN: ${entry.entryNumber}`
      }, session);
    }

    // 2. Update Purchase Order if linked (Block over-receipt)
    if (entry.purchaseOrder) {
      const po = await PurchaseOrder.findById(entry.purchaseOrder).session(session);
      if (!po) throw new Error('Linked Purchase Order not found');

      for (const grnItem of entry.items) {
        const poItem = po.items.find(i => i.product.toString() === grnItem.product.toString());
        if (poItem) {
          poItem.receivedQty += grnItem.purchaseQty;
          if (poItem.receivedQty > poItem.requestedQty) {
            throw new Error(`Over-receiving blocked for product ${poItem.product}. Ordered: ${poItem.requestedQty}, Received Attempt: ${poItem.receivedQty}`);
          }
        }
      }

      // Determine new PO status
      const allReceived = po.items.every(i => i.receivedQty >= i.requestedQty);
      const someReceived = po.items.some(i => i.receivedQty > 0);
      po.status = allReceived ? 'Received' : (someReceived ? 'Partially Received' : po.status);
      await po.save({ session });
    }

    // 3. Supplier Purchase History Updates
    const supplier = await Supplier.findById(entry.supplier).session(session);
    if (supplier) {
        // We do not overwrite Preferred Supplier rules. But we can track last interaction date if needed.
        // Wait, Kuiklo's standard Supplier model might not have lastPurchaseDate right now, but let's check or just let addStock handle stock logic.
    }

    // 4. Mark Finalized
    entry.status = 'Finalized';
    await entry.save({ session });

    await session.commitTransaction();
    res.json(entry);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// ========================
// PURCHASE RETURNS
// ========================

export const getPurchaseReturns = async (req, res) => {
  try {
    const prs = await PurchaseReturn.find()
      .populate('supplier', 'name')
      .populate('purchaseEntry', 'entryNumber')
      .sort({ createdAt: -1 });
    res.json(prs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPurchaseReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const returnNumber = `PR-${new Date().getFullYear()}-${String(await Sequence.getNextValue('PR')).padStart(6, '0')}`;
    const pr = new PurchaseReturn({ ...req.body, returnNumber });
    
    // Process items via InventoryService.supplierReturn
    for (const item of pr.items) {
      await InventoryService.supplierReturn({
        supplierId: pr.supplier,
        productId: item.product,
        variantId: item.variant,
        batchId: item.batch, // Explicit batch
        quantity: item.returnQty,
        reason: item.reason || 'Purchase Return',
        referenceNumber: returnNumber,
        user: req.user?._id
      }, session);
    }

    await pr.save({ session });
    
    await session.commitTransaction();
    res.status(201).json(pr);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

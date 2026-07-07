import mongoose from 'mongoose';
import HeldBill from '../models/HeldBill.js';
import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import Transaction from '../models/Transaction.js';
import ProductBatch from '../models/ProductBatch.js';
import InventoryLog from '../models/InventoryLog.js';
import Product from '../models/Product.js';

// --- HOLD BILL LOGIC ---

export const holdBill = async (req, res) => {
  try {
    const { referenceName, customer, items, totals } = req.body;
    const heldBill = await HeldBill.create({
      staffId: req.user._id,
      customer: customer || null,
      referenceName,
      items,
      totals
    });
    res.status(201).json(heldBill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHeldBills = async (req, res) => {
  try {
    const bills = await HeldBill.find({ staffId: req.user._id }).populate('customer', 'name phone');
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resumeBill = async (req, res) => {
  try {
    const bill = await HeldBill.findById(req.params.id).populate('customer', 'name phone');
    if (!bill) return res.status(404).json({ message: 'Held bill not found' });
    
    // Once resumed, we usually delete it from holds or let frontend call delete after checkout
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHeldBill = async (req, res) => {
  try {
    await HeldBill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Held bill deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- TRANSACTIONAL CHECKOUT LOGIC ---

export const posCheckout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customer, customerSnapshot, items, subTotal, tax, discount, amount, paymentMethod } = req.body;

    // 1. Generate Numbers
    const orderCount = await Order.countDocuments().session(session);
    const orderNumber = `ORD-2026-${(orderCount + 1).toString().padStart(5, '0')}`;
    
    // Separate bill number logic (could just use a POS prefix counter)
    const billCount = await Order.countDocuments({ orderType: 'OFFLINE' }).session(session);
    const billNumber = `POS-2026-${(billCount + 1).toString().padStart(6, '0')}`;

    // 2. Create Order
    const order = new Order({
      orderNumber,
      billNumber,
      orderType: 'OFFLINE',
      customer: customer || null,
      items,
      subTotal,
      tax,
      discount,
      amount,
      status: 'Delivered', // POS is instant delivery
      paymentStatus: 'Paid'
    });
    await order.save({ session });

    // 3. Deduct Inventory & Create Logs (FIFO logic adapted for transaction)
    for (const item of items) {
      const { productId, qty } = item;
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

        // Log
        await InventoryLog.create([{
          product: productId,
          batch: batch._id,
          type: 'SALE',
          previousStock: batch.stock + reduceAmount,
          quantityChanged: -reduceAmount,
          newStock: batch.stock,
          reason: `POS Bill ${billNumber}`,
          user: req.user._id,
          order: order._id
        }], { session });

        remainingQtyToReduce -= reduceAmount;
        batchIndex++;
      }

      if (remainingQtyToReduce > 0) {
        throw new Error(`Insufficient stock for Product ID: ${productId}. Missing ${remainingQtyToReduce} units.`);
      }

      // Update total stock on Product
      const productBatches = await ProductBatch.find({ product: productId }).session(session);
      const totalProductStock = productBatches.reduce((acc, b) => acc + b.stock, 0);
      await Product.findByIdAndUpdate(productId, { stock: totalProductStock }, { session });
    }

    // 4. Create Transaction
    const transactionId = `TXN-${Date.now()}`;
    const transaction = new Transaction({
      transactionId,
      order: order._id,
      orderType: 'OFFLINE',
      paymentMethod,
      paymentStatus: 'Paid',
      amount,
      paidAt: new Date()
    });
    await transaction.save({ session });

    // 5. Create Invoice
    const invoiceCount = await Invoice.countDocuments().session(session);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(6, '0')}`;
    
    const invoice = new Invoice({
      invoiceNumber,
      order: order._id,
      customerSnapshot: customerSnapshot || { name: 'Walk-in Customer' },
      productSnapshot: items.map(i => ({ productName: i.productName, sku: i.sku, qty: i.qty, price: i.price, total: i.total })),
      totalsSnapshot: { subTotal, tax, discount, amount }
    });
    await invoice.save({ session });

    // COMMIT ALL
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Checkout successful',
      order,
      invoice,
      transaction
    });

  } catch (error) {
    // ROLLBACK ALL
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message || 'Checkout failed due to transaction error' });
  }
};

// --- POS RETURN LOGIC ---

export const posReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { invoiceNumber, itemsToReturn, reason } = req.body;
    
    // Find Invoice or Order
    let invoice = await Invoice.findOne({ invoiceNumber }).session(session);
    let order;

    if (!invoice) {
      order = await Order.findOne({ $or: [{ orderNumber: invoiceNumber }, { billNumber: invoiceNumber }] }).session(session);
      if (!order) throw new Error('Invoice or Order not found');
      invoice = await Invoice.findOne({ order: order._id }).session(session);
      if (!invoice) throw new Error('Invoice not found for this order');
    } else {
      order = await Order.findById(invoice.order).session(session);
      if (!order) throw new Error('Original order not found');
    }

    let totalRefundAmount = 0;

    for (const returnItem of itemsToReturn) {
      const { itemId, productId, qtyToReturn } = returnItem;
      if (qtyToReturn <= 0) continue;

      // Find item in order
      const orderItem = order.items.find(i => 
        (itemId && i._id.toString() === itemId) || 
        (productId && i.product && i.product.toString() === productId)
      );
      if (!orderItem) throw new Error(`Product ${productId || itemId} not found in this order`);

      if (orderItem.returnedQty + qtyToReturn > orderItem.qty) {
        throw new Error(`Cannot return more than purchased for ${orderItem.productName}`);
      }

      // Update Order Item
      orderItem.returnedQty += qtyToReturn;
      totalRefundAmount += (orderItem.price * qtyToReturn);

      // Restore Inventory
      if (orderItem.product) {
        const InventoryService = (await import('../services/InventoryService.js')).default;
        await InventoryService.autoReturnStock(orderItem.product.toString(), null, qtyToReturn, reason, req.user._id, order._id, session);
      }
    }

    // Determine new status
    const fullyReturned = order.items.every(i => i.returnedQty === i.qty);
    if (fullyReturned) {
      order.status = 'Returned';
      invoice.isCancelled = true; // Watermark fully returned invoices
    }

    await order.save({ session });
    await invoice.save({ session });

    if (order.orderType === 'ONLINE' && ['Paid', 'PartiallyRefunded'].includes(order.paymentStatus)) {
      // Find the positive transaction
      const transaction = await Transaction.findOne({ order: order._id, amount: { $gt: 0 } }).session(session);
      if (transaction) {
        // We do this after commit to avoid blocking/deadlock with external API inside session
        // Actually, we can commit the DB first, then call Razorpay.
        await session.commitTransaction();
        session.endSession();
        
        const { default: PaymentService } = await import('../services/PaymentService.js');
        const refundSuccess = await PaymentService.processRefund(transaction._id, totalRefundAmount);
        
        // Update order status outside session based on Razorpay result
        const updatedOrder = await Order.findById(order._id);
        const updatedTxn = await Transaction.findById(transaction._id);
        if (updatedOrder && updatedTxn) {
          updatedOrder.refundStatus = refundSuccess ? 'Processed' : 'Failed';
          updatedOrder.paymentStatus = updatedTxn.paymentStatus;
          await updatedOrder.save();
        }

        return res.json({ message: 'Return processed. Razorpay refund requested.', refundAmount: totalRefundAmount, refundStatus: refundSuccess ? 'Processed' : 'Failed', invoice });
      }
    } else {
      // Create Negative Transaction for Offline
      const transactionId = `TXN-RET-${Date.now()}`;
      const refundTransaction = new Transaction({
        transactionId,
        order: order._id,
        orderType: 'OFFLINE',
        paymentMethod: 'Cash', // Default refund to cash for POS
        paymentStatus: 'Refunded',
        amount: -totalRefundAmount,
        paidAt: new Date()
      });
      await refundTransaction.save({ session });
      
      await session.commitTransaction();
      session.endSession();

      const { default: NotificationService } = await import('../services/NotificationService.js');
      await NotificationService.createNotification({
        type: 'Returned Order',
        message: `Order ${order.orderNumber} had items returned.`,
        order: order._id
      });

      return res.json({ message: 'Return processed successfully', refundAmount: totalRefundAmount, invoice });
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

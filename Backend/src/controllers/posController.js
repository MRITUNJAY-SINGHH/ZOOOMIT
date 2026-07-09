import mongoose from 'mongoose';
import HeldBill from '../models/HeldBill.js';
import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import Transaction from '../models/Transaction.js';
import ProductBatch from '../models/ProductBatch.js';
import InventoryLog from '../models/InventoryLog.js';
import Product from '../models/Product.js';
import { clearReportsCache } from '../utils/cache.js';

// --- OFFLINE SYNC LOGIC ---

export const posSync = async (req, res) => {
  const { offlineOrders } = req.body;
  if (!Array.isArray(offlineOrders)) return res.status(400).json({ message: 'offlineOrders must be an array' });

  let successCount = 0;
  let failedOrders = [];

  for (const order of offlineOrders) {
    try {
      // Create a mock req/res object to reuse posCheckout
      // This is a quick trick to reuse the logic without abstracting it yet
      let responseData = null;
      let statusCode = 200;
      
      const mockReq = { 
        body: order.payload, 
        user: req.user 
      };
      
      const mockRes = {
        status: (code) => { statusCode = code; return mockRes; },
        json: (data) => { responseData = data; }
      };

      await posCheckout(mockReq, mockRes);

      if (statusCode >= 200 && statusCode < 300) {
        successCount++;
      } else {
        throw new Error(responseData?.message || 'Sync failed');
      }
    } catch (e) {
      failedOrders.push({
        ...order,
        error: e.message
      });
    }
  }

  // Structured Logging
  console.log(`[SYNC] Offline Queue Processed: ${successCount} Success, ${failedOrders.length} Failed.`);
  if (failedOrders.length > 0) {
    console.log(`[SYNC ERROR DETAILS]: `, failedOrders.map(f => f.error));
  }

  res.json({
    successCount,
    failedOrders
  });
};

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
    let { customer, customerSnapshot, customerAddress, items, subTotal, tax, discount, amount, paymentMethod, offlineId } = req.body;

    // Idempotency Check
    if (offlineId) {
      const existingOrder = await Order.findOne({ offlineId }).session(session);
      if (existingOrder) {
        // Already processed successfully previously (perhaps network timeout on frontend)
        const invoice = await Invoice.findOne({ order: existingOrder._id }).session(session);
        const transaction = await Transaction.findOne({ order: existingOrder._id }).session(session);
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({ message: 'Idempotent checkout successful', order: existingOrder, invoice, transaction });
      }
    }

    // Fetch Settings
    const Settings = (await import('../models/Settings.js')).default;
    const settings = await Settings.findOne().session(session);
    const allowNegativeStock = settings ? settings.allowNegativeStock : false;

    // Check in my customer have this or not if not create that
    if (!customer && customerSnapshot && customerSnapshot.phone) {
      const Customer = (await import('../models/Customer.js')).default;
      let existingCustomer = await Customer.findOne({ phone: customerSnapshot.phone }).session(session);
      
      if (existingCustomer) {
        customer = existingCustomer._id;
        // Check if existing customer has this address, if not we could add it
        if (customerAddress && existingCustomer.addresses.length === 0) {
          existingCustomer.addresses.push({ label: 'Billing/Shipping', ...customerAddress });
          await existingCustomer.save({ session });
        }
      } else {
        // Create new customer
        const newCustomer = new Customer({
          name: customerSnapshot.name || 'Walk-in',
          phone: customerSnapshot.phone,
          email: customerSnapshot.email,
          customerType: 'WALK_IN',
          addresses: customerAddress ? [{ label: 'Billing/Shipping', ...customerAddress }] : []
        });
        await newCustomer.save({ session });
        customer = newCustomer._id;
      }
    }

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
      paymentStatus: 'Paid',
      offlineId
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
        if (!allowNegativeStock) {
          throw new Error(`Insufficient stock for Product ID: ${productId}. Missing ${remainingQtyToReduce} units.`);
        }
        
        // If allowing negative stock, we need to reduce the product's overall stock directly 
        // since batches ran out. We don't have a batch to reduce.
        // We'll create a dummy negative batch log for tracking, or just update Product stock.
      }

      // Update total stock on Product
      // Instead of recalculating from batches, we just decrement from the current product stock
      await Product.findByIdAndUpdate(productId, { $inc: { stock: -qty } }, { session });
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
    
    clearReportsCache();

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
        
        clearReportsCache();

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
      
      clearReportsCache();

      return res.json({ message: 'Return processed successfully', refundAmount: totalRefundAmount, invoice });
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

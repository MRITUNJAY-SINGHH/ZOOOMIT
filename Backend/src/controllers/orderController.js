import OrderService from '../services/OrderService.js';
import InventoryService from '../services/InventoryService.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

export const getOrders = async (req, res) => {
  try {
    let { page = 1, limit = 20, search = '', status, orderType, startDate, endDate } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 100) limit = 100;

    let query = {};
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
      // Note: Searching by customer name requires aggregation or pre-fetching customer IDs.
      // For simplicity, we just search orderNumber right now, but could expand.
      const { default: Customer } = await import('../models/Customer.js');
      const customers = await Customer.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      if (customers.length > 0) {
        query.$or.push({ customer: { $in: customers.map(c => c._id) } });
      }
    }
    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name phone')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      data: orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name phone email addresses');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderType, customer, items, subTotal, tax, discount, amount, paymentStatus } = req.body;
    
    // Create order number
    const prefix = orderType === 'ONLINE' ? 'INV-2026-' : 'POS-2026-';
    const orderCount = await Order.countDocuments().session(session);
    const orderNumber = `${prefix}${(orderCount + 1).toString().padStart(5, '0')}`;

    const orderData = {
      orderNumber,
      orderType,
      customer,
      items,
      subTotal,
      tax,
      discount,
      amount,
      paymentStatus,
      status: orderType === 'OFFLINE' ? 'Delivered' : 'Pending'
    };

    // Deduct stock safely within transaction
    await InventoryService.reduceStockForSale(items, req.user._id, 'pending-order-id', session);

    const order = await OrderService.createOrder(orderData, req.user._id, session);

    // Now update the logs with the actual order ID
    const { default: InventoryLog } = await import('../models/InventoryLog.js');
    await InventoryLog.updateMany(
      { order: 'pending-order-id', user: req.user._id },
      { $set: { order: order._id, reason: `Order ${order.orderNumber}` } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Out-of-band notification
    const { default: NotificationService } = await import('../services/NotificationService.js');
    await NotificationService.createNotification({
      type: 'New Order',
      message: `New order ${order.orderNumber} received.`,
      order: order._id
    });

    res.status(201).json(order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await OrderService.updateOrderStatus(req.params.id, status, req.user._id, note);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignRider = async (req, res) => {
  try {
    const { riderId } = req.body;
    const order = await OrderService.assignRider(req.params.id, riderId, req.user._id);
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;
    const orderId = req.params.id;
    const order = await Order.findById(orderId).session(session);
    
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Customers can only cancel if Pending or Confirmed
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Staff';
    if (!isAdmin && order.status !== 'Pending' && order.status !== 'Confirmed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Order has already been processed and cannot be cancelled.' });
    }

    // Update state to Cancelled
    await OrderService.updateOrderStatus(orderId, 'Cancelled', req.user._id, reason, session);

    // Restore Inventory safely within transaction
    const InventoryService = (await import('../services/InventoryService.js')).default;
    for (const item of order.items) {
      await InventoryService.autoReturnStock(item.productId, item.variantId, item.qty, 'Order Cancelled', req.user._id, order._id, session);
    }

    order.cancelledBy = req.user._id;
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    
    // Default optimistic refund pending
    if (order.orderType === 'ONLINE' && order.paymentStatus === 'Paid') {
      order.refundStatus = 'Pending';
    }
    
    await order.save({ session });

    // Commit BEFORE Razorpay
    await session.commitTransaction();
    session.endSession();

    // Call Razorpay AFTER DB is safely committed
    if (order.orderType === 'ONLINE' && order.paymentStatus === 'Paid') {
      const { default: Transaction } = await import('../models/Transaction.js');
      const { default: PaymentService } = await import('../services/PaymentService.js');
      
      const transaction = await Transaction.findOne({ order: order._id, paymentStatus: 'Paid' });
      if (transaction) {
        const refundSuccess = await PaymentService.processRefund(transaction._id, order.amount);
        
        const freshOrder = await Order.findById(order._id);
        if (freshOrder) {
          if (refundSuccess) {
            freshOrder.refundStatus = 'Processed';
            freshOrder.paymentStatus = 'Refunded';
          } else {
            freshOrder.refundStatus = 'Failed';
            // PaymentService internally adds to RefundQueue if failed
          }
          await freshOrder.save();
        }
      }
    }

    const { default: NotificationService } = await import('../services/NotificationService.js');
    await NotificationService.createNotification({
      type: 'Cancelled Order',
      message: `Order ${order.orderNumber} was cancelled.`,
      order: order._id
    });

    const finalOrder = await Order.findById(orderId);
    res.json({ message: 'Order cancelled successfully', order: finalOrder });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

export const getOrderTimeline = async (req, res) => {
  try {
    const { default: OrderActivity } = await import('../models/OrderActivity.js');
    const activities = await OrderActivity.find({ order: req.params.id }).populate('user', 'name role').sort('timestamp');
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

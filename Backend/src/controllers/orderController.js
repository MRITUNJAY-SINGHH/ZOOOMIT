import OrderService from '../services/OrderService.js';
import InventoryService from '../services/InventoryService.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';
import CancelledDocument from '../models/CancelledDocument.js';
import mongoose from 'mongoose';
import { clearReportsCache } from '../utils/cache.js';
import { roundTo, calculateTax } from '../utils/decimalUtils.js';

export const getOrders = async (req, res) => {
  try {
    let { page = 1, limit = 50, search = '', status, orderType, startDate, endDate } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 150) limit = 150;

    let query = {};
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { billNumber: { $regex: search, $options: 'i' } }
      ];
      const { default: Customer } = await import('../models/Customer.js');
      const customers = await Customer.find({ 
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      if (customers.length > 0) {
        query.$or.push({ customer: { $in: customers.map(c => c._id) } });
      }
    }

    if (status && status !== 'All') {
      if (['Pending', 'Refunded'].includes(status)) {
        if (query.$or) {
          query.$and = [ { $or: query.$or }, { $or: [{ status }, { paymentStatus: status }] } ];
          delete query.$or;
        } else {
          query.$or = [{ status }, { paymentStatus: status }];
        }
      } else {
        query.status = status;
      }
    }

    if (orderType && orderType !== 'All') query.orderType = orderType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('assignedRider', 'name phone')
      .sort({ createdAt: -1 })
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
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone email addresses')
      .populate('assignedRider', 'name phone email');
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
    const { orderType = 'ONLINE', customer, items, discount = 0, paymentStatus = 'Pending' } = req.body;
    
    // 1. Validate quantity rules, units, and fetch current product data
    const validatedItems = await OrderService.validateOrderItems(items, session);

    // 2. Fetch Settings for tax mode and numbering
    const settings = await Settings.findOne().session(session) || {};
    const taxMode = settings.taxMode || 'INCLUSIVE';

    let computedSubTotal = 0;
    let computedTaxable = 0;
    let computedTax = 0;
    let computedCgst = 0;
    let computedSgst = 0;

    for (const item of validatedItems) {
      const taxCalc = calculateTax(item.price, item.qty, item.taxRate || 0, taxMode);
      computedSubTotal = roundTo(computedSubTotal + (item.price * item.qty), 2);
      computedTaxable = roundTo(computedTaxable + taxCalc.taxableAmount, 2);
      computedTax = roundTo(computedTax + taxCalc.taxAmount, 2);
      computedCgst = roundTo(computedCgst + taxCalc.cgst, 2);
      computedSgst = roundTo(computedSgst + taxCalc.sgst, 2);

      item.taxableAmount = taxCalc.taxableAmount;
      item.taxAmount = taxCalc.taxAmount;
      item.total = taxMode === 'EXCLUSIVE' ? taxCalc.totalAmount : roundTo(item.price * item.qty, 2);
    }

    const totalDiscount = Number(discount) || 0;
    const finalAmount = taxMode === 'EXCLUSIVE'
      ? roundTo(computedTaxable + computedTax - totalDiscount, 2)
      : roundTo(computedSubTotal - totalDiscount, 2);

    // 3. Create order number
    const Sequence = (await import('../models/Sequence.js')).default;
    const seqType = orderType === 'ONLINE' ? 'Order' : 'POS';
    const prefix = orderType === 'ONLINE' ? (settings.invoicePrefixOnline || 'ORD-2026-') : (settings.invoicePrefixOffline || 'POS-2026-');
    const orderSeq = await Sequence.getNextValue(seqType, session);
    const orderNumber = `${prefix}${orderSeq.toString().padStart(5, '0')}`;

    const orderData = {
      orderNumber,
      orderType,
      customer: customer || null,
      items: validatedItems,
      subTotal: computedSubTotal,
      taxableAmount: computedTaxable,
      tax: computedTax,
      cgst: computedCgst,
      sgst: computedSgst,
      igst: computedTax,
      discount: totalDiscount,
      amount: finalAmount,
      paymentStatus,
      status: orderType === 'OFFLINE' ? 'Delivered' : 'Pending'
    };

    // 4. Deduct stock safely within transaction
    await InventoryService.reduceStockForSale(validatedItems, req.user._id, 'pending-order-id', session);

    const order = await OrderService.createOrder(orderData, req.user._id, session);

    // 5. Update Inventory logs with actual order ID
    const { default: InventoryLog } = await import('../models/InventoryLog.js');
    await InventoryLog.updateMany(
      { order: 'pending-order-id', user: req.user._id },
      { $set: { order: order._id, reason: `Order ${order.orderNumber}` } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    clearReportsCache();

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
    res.status(400).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await OrderService.updateOrderStatus(req.params.id, status, req.user._id, note);
    clearReportsCache();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const assignRider = async (req, res) => {
  try {
    const { riderId } = req.body;
    const order = await OrderService.assignRider(req.params.id, riderId, req.user._id);
    clearReportsCache();
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
    if (!order) throw new Error('Order not found');

    if (['Delivered', 'Cancelled', 'Returned', 'Refunded'].includes(order.status)) {
      throw new Error(`Cannot cancel an order with status ${order.status}`);
    }

    order.status = 'Cancelled';
    order.cancelledBy = req.user._id;
    order.cancelledAt = new Date();
    order.cancelReason = reason || 'Admin cancelled order';
    await order.save({ session });

    // 1. Restore inventory for all items
    for (const item of order.items) {
      const restockQty = roundTo(item.qty - (item.returnedQty || 0), 3);
      if (restockQty > 0) {
        await InventoryService.returnStock(
          item.product, 
          item.variant, 
          null, 
          restockQty, 
          `Cancelled Order: ${order.orderNumber}`, 
          req.user._id, 
          order._id, 
          session
        );
      }
    }

    // 2. Create Cancelled Document
    const Sequence = (await import('../models/Sequence.js')).default;
    const cancelSeq = await Sequence.getNextValue('CancelledDocument', session);
    const documentNumber = `CAN-${new Date().getFullYear()}-${cancelSeq.toString().padStart(6, '0')}`;

    const cancelDoc = new CancelledDocument({
      documentNumber,
      order: order._id,
      customerSnapshot: { name: 'Customer' },
      items: order.items.map(i => ({ productName: i.productName, unit: i.unit, qty: i.qty, price: i.price, total: i.total })),
      totalsSnapshot: { subTotal: order.subTotal, tax: order.tax, discount: order.discount, amount: order.amount },
      reason: reason || 'Order Cancelled',
      cancelledBy: req.user._id,
      refundStatus: order.paymentStatus === 'Paid' ? 'Pending' : 'Completed'
    });
    await cancelDoc.save({ session });

    await OrderService.logActivity(order._id, 'Cancelled', req.user._id, `Order cancelled: ${reason || 'No reason provided'}`, false, session);

    await session.commitTransaction();
    session.endSession();

    clearReportsCache();

    res.json({ message: 'Order cancelled successfully', order, cancelDoc });
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

export const getMyDeliveries = async (req, res) => {
  try {
    const orders = await Order.find({ assignedRider: req.user._id })
      .populate('customer', 'name phone email addresses')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status, rejectReason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.assignedRider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this delivery' });
    }

    const validStatuses = ['Accepted', 'Picked Up', 'Out For Delivery', 'Delivered', 'Rejected', 'Pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }

    if (status === 'Rejected') {
      order.status = 'Pending';
      order.assignedRider = null;
      await order.save();
      await OrderService.logActivity(order._id, 'Rejected', req.user._id, rejectReason || 'Rider rejected delivery');
    } else {
      order.status = status;
      if (status === 'Delivered') {
        order.paymentStatus = 'Paid';
        order.deliveredAt = new Date();
      }
      await order.save();
      await OrderService.logActivity(order._id, status, req.user._id, `Status updated by rider`);
    }

    clearReportsCache();
    res.json({ message: 'Delivery status updated', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

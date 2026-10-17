import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import OrderActivity from '../models/OrderActivity.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Settings from '../models/Settings.js';
import { roundTo, calculateTax, validateQuantityRules } from '../utils/decimalUtils.js';

class OrderService {
  /**
   * Create an activity log for an order
   */
  async logActivity(orderId, status, user, note, system = false, session = null) {
    const log = new OrderActivity({
      order: orderId,
      status,
      user,
      system,
      note
    });
    await log.save({ session });
  }

  /**
   * Update Customer cached fields (totalOrders, totalSpent)
   */
  async updateCustomerStats(customerId, session = null) {
    if (!customerId) return;

    const orders = await Order.find({ customer: customerId, status: { $nin: ['Cancelled', 'Refunded'] } }).session(session);
    
    const totalOrders = orders.length;
    const totalSpent = roundTo(orders.reduce((acc, o) => acc + (o.amount || 0), 0), 2);

    await Customer.findByIdAndUpdate(customerId, { totalOrders, totalSpent }, { session });
  }

  /**
   * Validate items for quantity rules & unit compatibility
   */
  async validateOrderItems(items, session = null) {
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product || item.productId).session(session);
      if (!product) throw new Error(`Product ${item.product || item.productId} not found`);

      // Unit Check
      const expectedUnit = item.variant ? item.unit || product.sellingUnit || product.baseUnit : product.sellingUnit || product.baseUnit;
      if (item.unit && item.unit !== expectedUnit && item.unit !== product.baseUnit) {
        throw new Error(`Invalid unit '${item.unit}' for product '${product.name}'. Expected: '${expectedUnit}'`);
      }

      // Quantity Step Validation
      const minQty = product.minSaleQty || 1;
      const maxQty = product.maxSaleQty || 1000;
      const qtyStep = product.qtyStep || 1;

      const ruleCheck = validateQuantityRules(item.qty, minQty, maxQty, qtyStep, 3);
      if (!ruleCheck.isValid) {
        throw new Error(`Product '${product.name}': ${ruleCheck.error}`);
      }

      validatedItems.push({
        product: product._id,
        variant: item.variant || null,
        productName: product.name,
        productImage: product.featuredImage || (product.galleryImages && product.galleryImages[0]) || '',
        sku: product.baseSku,
        barcode: product.barcode,
        unit: expectedUnit,
        qty: roundTo(item.qty, 3),
        price: item.price || product.sellingPrice,
        taxRate: product.taxRate || 0,
        hsnCode: product.hsnCode || '',
        total: item.total || roundTo(item.qty * (item.price || product.sellingPrice), 2)
      });
    }

    return validatedItems;
  }

  /**
   * Handle Order Creation
   */
  async createOrder(orderData, user, session = null) {
    const order = new Order(orderData);
    await order.save({ session });

    await this.logActivity(order._id, 'Order Created', user, 'Order placed successfully', false, session);
    
    if (order.customer) {
      await this.updateCustomerStats(order.customer, session);
    }
    
    return order;
  }
  
  /**
   * Update Order Status (With State Machine Validation)
   */
  async updateOrderStatus(orderId, newStatus, user, note, session = null) {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Order not found");

    const validTransitions = {
      'Pending': ['Confirmed', 'Cancelled'],
      'Confirmed': ['Assigned', 'Cancelled'],
      'Assigned': ['Accepted', 'OutForDelivery', 'Cancelled'],
      'Accepted': ['Picked Up', 'Cancelled'],
      'Picked Up': ['Out For Delivery', 'Cancelled'],
      'Out For Delivery': ['Delivered', 'Returned', 'Cancelled'],
      'OutForDelivery': ['Delivered', 'Returned', 'Cancelled'],
      'Delivered': ['Returned', 'Refunded'],
      'Cancelled': [],
      'Returned': ['Refunded'],
      'Refunded': []
    };

    if (!validTransitions[order.status].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
    }

    order.status = newStatus;
    
    if (newStatus === 'Delivered') {
      order.deliveredAt = new Date();
      
      // Auto-generate Online Invoice upon Delivery
      if (order.orderType === 'ONLINE') {
        const settings = await Settings.findOne().session(session) || {};
        const taxMode = settings.taxMode || 'INCLUSIVE';

        const Sequence = (await import('../models/Sequence.js')).default;
        const invoiceSeq = await Sequence.getNextValue('Invoice', session);
        const prefix = settings.invoicePrefixOnline || 'INV-2026-';
        const invoiceNumber = `${prefix}${invoiceSeq.toString().padStart(6, '0')}`;
        
        let customerSnapshot = { name: 'Guest' };
        let billingAddressSnapshot = {};
        let shippingAddressSnapshot = {};

        if (order.customer) {
          const cust = await Customer.findById(order.customer).session(session);
          if (cust) {
            customerSnapshot = { name: cust.name, phone: cust.phone, email: cust.email };
            if (cust.addresses && cust.addresses.length > 0) {
              const primaryAddr = cust.addresses[0];
              billingAddressSnapshot = { street: primaryAddr.street, city: primaryAddr.city, state: primaryAddr.state, zipCode: primaryAddr.zipCode, country: primaryAddr.country };
              shippingAddressSnapshot = { ...billingAddressSnapshot };
            }
          }
        }

        let totalTaxable = 0;
        let totalTax = 0;
        let totalCgst = 0;
        let totalSgst = 0;

        const productSnapshot = order.items.map(i => {
          const taxCalc = calculateTax(i.price, i.qty, i.taxRate || 0, taxMode);
          totalTaxable = roundTo(totalTaxable + taxCalc.taxableAmount, 2);
          totalTax = roundTo(totalTax + taxCalc.taxAmount, 2);
          totalCgst = roundTo(totalCgst + taxCalc.cgst, 2);
          totalSgst = roundTo(totalSgst + taxCalc.sgst, 2);

          return {
            productId: i.product,
            productName: i.productName,
            sku: i.sku,
            unit: i.unit || 'PCS',
            hsnCode: i.hsnCode || '',
            qty: i.qty,
            price: i.price,
            taxRate: i.taxRate || 0,
            taxableAmount: taxCalc.taxableAmount,
            taxAmount: taxCalc.taxAmount,
            total: i.total
          };
        });

        const invoice = new Invoice({
          invoiceNumber,
          order: order._id,
          paymentMethod: order.paymentStatus === 'Paid' ? 'Online' : 'Cash',
          status: 'Paid',
          customerSnapshot,
          billingAddressSnapshot,
          shippingAddressSnapshot,
          productSnapshot,
          totalsSnapshot: {
            subTotal: order.subTotal,
            taxableAmount: totalTaxable,
            tax: totalTax,
            cgst: totalCgst,
            sgst: totalSgst,
            igst: totalTax,
            discount: order.discount || 0,
            amount: order.amount
          },
          notes: settings.invoiceFooter || 'Thank you for shopping with us!'
        });
        await invoice.save({ session });
      }
    }

    await order.save({ session });
    await this.logActivity(orderId, newStatus, user, note, false, session);
    
    if (order.customer) {
      await this.updateCustomerStats(order.customer, session);
    }

    return order;
  }
  
  /**
   * Assign Rider
   */
  async assignRider(orderId, riderId, user, session = null) {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Order not found");
    if (order.status !== 'Confirmed') throw new Error("Order must be Confirmed before assigning a rider");

    order.assignedRider = riderId;
    order.assignedAt = new Date();
    await order.save({ session });

    await this.updateOrderStatus(orderId, 'Assigned', user, 'Rider Assigned', session);

    // Trigger Push Notification to Delivery Partner
    try {
      const { default: User } = await import('../models/User.js');
      const { sendExpoPushNotification } = await import('./pushNotificationService.js');
      const rider = await User.findById(riderId);
      if (rider && rider.expoPushToken) {
        await sendExpoPushNotification({
          pushToken: rider.expoPushToken,
          title: 'New Delivery Assigned! 🛵',
          body: `Order #${order.orderNumber} is assigned to you. Open app to accept.`,
          data: { orderId: order._id.toString(), orderNumber: order.orderNumber },
          channelId: 'orders'
        });
      }
    } catch (notifErr) {
      console.warn('[OrderService] Could not send rider push notification:', notifErr.message);
    }

    return order;
  }

  /**
   * Get activity timeline for an order
   */
  async getActivityTimeline(orderId) {
    return OrderActivity.find({ order: orderId }).sort({ timestamp: 1, _id: 1 });
  }
}

export default new OrderService();

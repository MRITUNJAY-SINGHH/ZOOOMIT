import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import OrderActivity from '../models/OrderActivity.js';
import Invoice from '../models/Invoice.js';

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
    const totalSpent = orders.reduce((acc, o) => acc + o.amount, 0);

    await Customer.findByIdAndUpdate(customerId, { totalOrders, totalSpent }, { session });
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
      'Assigned': ['OutForDelivery', 'Cancelled'],
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
        const invoiceCount = await Invoice.countDocuments().session(session);
        const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(6, '0')}`;
        
        let customerSnapshot = { name: 'Guest' };
        if (order.customer) {
          const cust = await Customer.findById(order.customer).session(session);
          if (cust) customerSnapshot = { name: cust.name, phone: cust.phone, email: cust.email };
        }

        const invoice = new Invoice({
          invoiceNumber,
          order: order._id,
          customerSnapshot,
          productSnapshot: order.items.map(i => ({ productName: i.productName, sku: i.sku, qty: i.qty, price: i.price, total: i.total })),
          totalsSnapshot: { subTotal: order.subTotal, tax: order.tax, discount: order.discount, amount: order.amount }
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
    return order;
  }
}

export default new OrderService();

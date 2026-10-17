import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import OrderService from '../services/OrderService.js';
import { sendExpoPushNotification } from '../services/pushNotificationService.js';
import bcrypt from 'bcryptjs';

// Base delivery pay per completed order
const BASE_DELIVERY_FEE = 45;

/**
 * 1. Get Delivery Partner Profile
 * GET /api/delivery/profile
 */
export const getDeliveryProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'Delivery partner not found' });

    const completedDeliveries = await Order.countDocuments({
      assignedRider: req.user._id,
      status: 'Delivered'
    });

    res.json({
      ...user.toObject(),
      completedDeliveries,
      rating: 4.9
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 2. Toggle Online/Offline Availability
 * PUT /api/delivery/toggle-online
 */
export const toggleOnline = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isOnline = typeof isOnline === 'boolean' ? isOnline : !user.isOnline;
    await user.save();

    res.json({
      message: `Partner is now ${user.isOnline ? 'Online' : 'Offline'}`,
      isOnline: user.isOnline
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 3. Register or Update Expo Push Token
 * PUT /api/delivery/push-token
 */
export const updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) return res.status(400).json({ message: 'Push token is required' });

    await User.findByIdAndUpdate(req.user._id, { expoPushToken: pushToken });
    res.json({ message: 'Push token updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 4. Update Current GPS Location
 * PUT /api/delivery/location
 */
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Coordinates are required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      currentLocation: {
        latitude,
        longitude,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 5. Dashboard Summary & Stats
 * GET /api/delivery/dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    const riderId = req.user._id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      todayCompletedCount,
      todayPendingCount,
      totalCompletedCount,
      activeOrder,
      newAvailableCount
    ] = await Promise.all([
      Order.countDocuments({
        assignedRider: riderId,
        status: 'Delivered',
        deliveredAt: { $gte: todayStart }
      }),
      Order.countDocuments({
        assignedRider: riderId,
        status: { $in: ['Assigned', 'Accepted', 'Picked Up', 'OutForDelivery', 'Out For Delivery'] }
      }),
      Order.countDocuments({
        assignedRider: riderId,
        status: 'Delivered'
      }),
      Order.findOne({
        assignedRider: riderId,
        status: { $in: ['Accepted', 'Picked Up', 'OutForDelivery', 'Out For Delivery'] }
      }).populate('customer', 'name phone').sort('-updatedAt'),
      Order.countDocuments({
        $or: [
          { assignedRider: riderId, status: 'Assigned' },
          { assignedRider: null, status: 'Confirmed' }
        ]
      })
    ]);

    const todayEarnings = todayCompletedCount * BASE_DELIVERY_FEE;
    const totalEarnings = totalCompletedCount * BASE_DELIVERY_FEE;

    const recentActivity = await Order.find({
      assignedRider: riderId,
      status: 'Delivered'
    })
      .sort('-deliveredAt')
      .limit(5)
      .select('orderNumber amount shippingAddress deliveredAt items');

    res.json({
      todayEarnings,
      todayCompleted: todayCompletedCount,
      todayPending: todayPendingCount,
      totalDeliveries: totalCompletedCount,
      totalEarnings,
      newAvailableCount,
      activeOrder,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 6. Get Available / Assigned Orders
 * GET /api/delivery/orders/available
 */
export const getAvailableOrders = async (req, res) => {
  try {
    const riderId = req.user._id;

    // Fetch orders assigned to this rider that haven't been accepted yet,
    // or unassigned confirmed orders waiting for assignment
    const orders = await Order.find({
      $or: [
        { assignedRider: riderId, status: 'Assigned' },
        { assignedRider: null, status: 'Confirmed' }
      ]
    })
      .populate('customer', 'name phone')
      .sort('-createdAt')
      .limit(10);

    const formatted = orders.map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      status: o.status,
      itemCount: o.items?.reduce((sum, it) => sum + (it.qty || 1), 0) || o.items?.length || 0,
      totalAmount: o.amount,
      estimatedEarnings: BASE_DELIVERY_FEE,
      pickupLocation: {
        storeName: 'ZOOOMIT Supermart Hub',
        address: 'Sector 4, Main Express Lane, Tech Park',
        distanceKm: 1.2
      },
      deliveryLocation: {
        contactName: o.shippingAddress?.contactName || o.customer?.name || 'Customer',
        contactPhone: o.shippingAddress?.contactPhone || o.customer?.phone || '',
        formattedAddress: o.shippingAddress?.formattedAddress || `${o.shippingAddress?.street || ''}, ${o.shippingAddress?.city || ''}`,
        street: o.shippingAddress?.street,
        landmark: o.shippingAddress?.landmark,
        city: o.shippingAddress?.city,
        distanceKm: 2.8
      },
      createdAt: o.createdAt,
      expirySeconds: 90
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 7. Accept Order (ATOMIC ENFORCEMENT - CRITICAL RULE 11)
 * POST /api/delivery/orders/:id/accept
 */
export const acceptOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const riderId = req.user._id;

    // Atomic conditional update ensures only ONE delivery partner can accept
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        status: { $in: ['Assigned', 'Confirmed', 'Pending'] },
        $or: [
          { assignedRider: riderId },
          { assignedRider: null },
          { assignedRider: { $exists: false } }
        ]
      },
      {
        $set: {
          status: 'Accepted',
          assignedRider: riderId,
          assignedAt: new Date()
        }
      },
      { new: true }
    ).populate('customer', 'name phone');

    if (!order) {
      return res.status(409).json({
        message: 'This order has already been accepted by another partner or is no longer available.',
        code: 'ORDER_ALREADY_CLAIMED'
      });
    }

    await OrderService.logActivity(order._id, 'Accepted', riderId, 'Delivery partner accepted the order');

    res.json({
      message: 'Order accepted successfully!',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 8. Reject / Pass Order Offer
 * POST /api/delivery/orders/:id/reject
 */
export const rejectOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason } = req.body;
    const riderId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Unassign rider and revert status so another partner can take it
    if (order.assignedRider?.toString() === riderId.toString()) {
      order.assignedRider = null;
      if (order.status === 'Assigned') {
        order.status = 'Confirmed';
      }
      await order.save();
      await OrderService.logActivity(orderId, 'Rejected', riderId, `Rider declined offer: ${reason || 'No reason provided'}`);
    }

    res.json({ message: 'Order offer declined' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 9. Update Delivery Lifecycle Status
 * PUT /api/delivery/orders/:id/status
 * Transitions: 'Accepted' -> 'Arrived at Store' -> 'Picked Up' -> 'Out For Delivery'
 */
export const updateOrderStatusStep = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.assignedRider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this order' });
    }

    const validTransitions = ['Accepted', 'Arrived at Store', 'Picked Up', 'Out For Delivery', 'OutForDelivery'];
    if (!validTransitions.includes(status)) {
      return res.status(400).json({ message: `Invalid status transition: ${status}` });
    }

    // Normalizing status name
    const finalStatus = status === 'OutForDelivery' ? 'Out For Delivery' : status;
    order.status = finalStatus;

    // If moving to Out For Delivery, ensure 4-digit Delivery OTP is generated
    if (finalStatus === 'Out For Delivery' && (!order.deliveryOtp || !order.deliveryOtp.hash)) {
      const plainOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plainOtp, salt);

      order.deliveryOtp = {
        hash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        attempts: 0
      };

      // Create notification for Customer containing their 4-digit OTP
      if (order.customer) {
        await Notification.create({
          title: 'Order is Out for Delivery! 🛵',
          message: `Your order #${order.orderNumber} is on its way! Share OTP ${plainOtp} with the delivery partner upon arrival.`,
          type: 'Order Out For Delivery',
          recipientType: 'Customer',
          customer: order.customer,
          order: order._id,
          data: { orderId: order._id, otp: plainOtp }
        });
      }
    }

    await order.save();
    await OrderService.logActivity(order._id, finalStatus, req.user._id, note || `Status updated to ${finalStatus}`);

    res.json({
      message: `Status updated to ${finalStatus}`,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 10. Verify Delivery OTP and Complete Order
 * POST /api/delivery/orders/:id/verify-otp
 */
export const verifyOtpAndDeliver = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp || String(otp).trim().length !== 4) {
      return res.status(400).json({ message: 'Please enter a valid 4-digit OTP' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.assignedRider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized for this delivery' });
    }

    if (!['Out For Delivery', 'OutForDelivery', 'Picked Up'].includes(order.status)) {
      return res.status(400).json({ message: 'Order must be Out For Delivery to verify OTP' });
    }

    if (!order.deliveryOtp || !order.deliveryOtp.hash) {
      return res.status(400).json({ message: 'No delivery OTP found for this order' });
    }

    // Check attempt limits
    if ((order.deliveryOtp.attempts || 0) >= 5) {
      return res.status(403).json({
        message: 'Maximum OTP verification attempts exceeded. Please contact supervisor.',
        code: 'MAX_ATTEMPTS_EXCEEDED'
      });
    }

    // Check expiry
    if (new Date() > new Date(order.deliveryOtp.expiresAt)) {
      return res.status(400).json({ message: 'Delivery OTP has expired', code: 'OTP_EXPIRED' });
    }

    // Compare with bcrypt hash
    const isMatch = await bcrypt.compare(String(otp).trim(), order.deliveryOtp.hash);
    if (!isMatch) {
      order.deliveryOtp.attempts = (order.deliveryOtp.attempts || 0) + 1;
      await order.save();
      const remaining = 5 - order.deliveryOtp.attempts;
      return res.status(400).json({
        message: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        remainingAttempts: remaining,
        code: 'INVALID_OTP'
      });
    }

    // Success: mark delivered
    order.status = 'Delivered';
    order.deliveredAt = new Date();
    order.paymentStatus = 'Paid';
    order.deliveryOtp.verifiedAt = new Date();
    await order.save();

    await OrderService.logActivity(order._id, 'Delivered', req.user._id, 'Order delivered successfully via OTP verification');

    // Notify Customer
    if (order.customer) {
      await Notification.create({
        title: 'Order Delivered! 🎉',
        message: `Your order #${order.orderNumber} has been delivered. Enjoy your items!`,
        type: 'Order Delivered',
        recipientType: 'Customer',
        customer: order.customer,
        order: order._id
      });
    }

    res.json({
      message: 'Delivery successfully verified and marked as Delivered!',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 11. Cancel Order with Reason
 * POST /api/delivery/orders/:id/cancel
 */
export const cancelOrderWithReason = async (req, res) => {
  try {
    const { reason, details } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.assignedRider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this order' });
    }

    // When a rider cancels, order is unassigned and marked for admin review or returned
    order.assignedRider = null;
    order.cancelReason = `Rider Cancellation: ${reason} - ${details || ''}`;
    order.status = 'Confirmed'; // Re-open for assignment or supervisor
    await order.save();

    await OrderService.logActivity(
      order._id,
      'Cancelled',
      req.user._id,
      `Delivery cancelled by rider. Reason: ${reason}. Details: ${details || 'None'}`
    );

    res.json({ message: 'Order returned to dispatch queue', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 12. List Rider Orders (with filter tabs)
 * GET /api/delivery/orders?status=all|new|active|completed|cancelled
 */
export const getRiderOrders = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const riderId = req.user._id;

    let query = {};

    if (status === 'new') {
      query = {
        $or: [
          { assignedRider: riderId, status: 'Assigned' },
          { assignedRider: null, status: 'Confirmed' }
        ]
      };
    } else if (status === 'active') {
      query = {
        assignedRider: riderId,
        status: { $in: ['Accepted', 'Arrived at Store', 'Picked Up', 'Out For Delivery', 'OutForDelivery'] }
      };
    } else if (status === 'completed') {
      query = {
        assignedRider: riderId,
        status: 'Delivered'
      };
    } else if (status === 'cancelled') {
      query = {
        assignedRider: riderId,
        status: { $in: ['Cancelled', 'Rejected'] }
      };
    } else {
      // all
      query = {
        $or: [
          { assignedRider: riderId },
          { assignedRider: null, status: 'Confirmed' }
        ]
      };
    }

    const orders = await Order.find(query)
      .populate('customer', 'name phone')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 13. Get Single Order Details for Rider
 * GET /api/delivery/orders/:id
 */
export const getRiderOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone email');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Fetch timeline activities
    const activities = await OrderService.getActivityTimeline(order._id);

    res.json({
      order,
      timeline: activities,
      pickup: {
        storeName: 'ZOOOMIT Supermart Hub',
        address: 'Sector 4, Main Express Lane, Tech Park',
        latitude: 28.6139,
        longitude: 77.2090,
        phone: '+91 98765 43210'
      },
      delivery: {
        customerName: order.shippingAddress?.contactName || order.customer?.name || 'Customer',
        phone: order.shippingAddress?.contactPhone || order.customer?.phone || '',
        formattedAddress: order.shippingAddress?.formattedAddress || `${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''}`,
        latitude: 28.6280,
        longitude: 77.2180,
        landmark: order.shippingAddress?.landmark || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 14. Get Earnings Breakdown
 * GET /api/delivery/earnings?period=today|week|month
 */
export const getRiderEarnings = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const riderId = req.user._id;

    const startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    const deliveredOrders = await Order.find({
      assignedRider: riderId,
      status: 'Delivered',
      deliveredAt: { $gte: startDate }
    }).sort('-deliveredAt');

    const totalOrders = deliveredOrders.length;
    const baseEarnings = totalOrders * BASE_DELIVERY_FEE;
    const bonusIncentives = totalOrders >= 5 ? 100 : 0;
    const totalEarnings = baseEarnings + bonusIncentives;
    const avgEarningsPerOrder = totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0;

    res.json({
      period,
      totalEarnings,
      baseEarnings,
      bonusIncentives,
      totalDeliveries: totalOrders,
      avgEarningsPerOrder,
      payoutStatus: 'Eligible for weekly cycle',
      nextPayoutDate: 'Next Monday',
      orders: deliveredOrders.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        deliveredAt: o.deliveredAt,
        amount: BASE_DELIVERY_FEE,
        customerAddress: o.shippingAddress?.formattedAddress || o.shippingAddress?.city || 'Local area'
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

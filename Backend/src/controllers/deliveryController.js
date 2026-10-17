import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Settings from '../models/Settings.js';
import RiderSettlement from '../models/RiderSettlement.js';
import OrderService from '../services/OrderService.js';
import { sendExpoPushNotification } from '../services/pushNotificationService.js';
import bcrypt from 'bcryptjs';
import PartnerFeedback from '../models/PartnerFeedback.js';

/**
 * Authoritative Delivery Partner Compensation Rate Resolver
 * Hierarchy:
 * 1. User.perDeliveryRate (Admin per-rider override, if > 0)
 * 2. Settings.deliveryPartnerRatePerOrder (Admin global rate, e.g., ₹20 or ₹30)
 * 3. Default fallback: 30
 */
export const getEffectiveDeliveryRate = async (riderId) => {
  let rate = 30;
  try {
    if (riderId) {
      const rider = await User.findById(riderId).select('perDeliveryRate');
      if (rider && typeof rider.perDeliveryRate === 'number' && rider.perDeliveryRate > 0) {
        return rider.perDeliveryRate;
      }
    }
    const settings = await Settings.findOne().select('deliveryPartnerRatePerOrder');
    if (settings && typeof settings.deliveryPartnerRatePerOrder === 'number' && settings.deliveryPartnerRatePerOrder > 0) {
      rate = settings.deliveryPartnerRatePerOrder;
    }
  } catch (err) {
    console.error('Error resolving delivery partner earning rate:', err);
  }
  return rate;
};

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

    const effectiveRate = await getEffectiveDeliveryRate(riderId);

    const [
      todayCompletedCount,
      todayPendingCount,
      totalCompletedCount,
      activeOrder,
      newAvailableCount,
      todayDeliveredOrders,
      allDeliveredOrders,
      settlements
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
      }),
      Order.find({
        assignedRider: riderId,
        status: 'Delivered',
        deliveredAt: { $gte: todayStart }
      }).select('riderEarnings'),
      Order.find({
        assignedRider: riderId,
        status: 'Delivered'
      }).select('riderEarnings'),
      RiderSettlement.find({ rider: riderId })
    ]);

    // Authoritative calculations from locked order earnings or active admin rate
    const todayEarnings = todayDeliveredOrders.reduce(
      (sum, o) => sum + (typeof o.riderEarnings === 'number' && o.riderEarnings > 0 ? o.riderEarnings : effectiveRate),
      0
    );
    const totalEarnings = allDeliveredOrders.reduce(
      (sum, o) => sum + (typeof o.riderEarnings === 'number' && o.riderEarnings > 0 ? o.riderEarnings : effectiveRate),
      0
    );

    // Store Cash Collection calculation
    const cashCollected = settlements.reduce((sum, s) => sum + (s.amountCollected || 0), 0);
    const cashToCollect = Math.max(0, totalEarnings - cashCollected);
    const settlementStatus =
      cashToCollect === 0 && totalEarnings > 0
        ? 'Collected'
        : cashCollected > 0
        ? 'Partially Collected'
        : 'Awaiting Collection';

    const recentActivity = await Order.find({
      assignedRider: riderId,
      status: 'Delivered'
    })
      .sort('-deliveredAt')
      .limit(5)
      .select('orderNumber amount shippingAddress deliveredAt items riderEarnings');

    res.json({
      todayEarnings,
      todayCompleted: todayCompletedCount,
      todayPending: todayPendingCount,
      totalDeliveries: totalCompletedCount,
      totalEarnings,
      ratePerDelivery: effectiveRate,
      cashToCollect,
      cashCollected,
      settlementStatus,
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
    const effectiveRate = await getEffectiveDeliveryRate(riderId);

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
      estimatedEarnings: effectiveRate,
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

    // Success: mark delivered idempotently and lock delivery partner earning
    if (!order.riderEarnings || order.riderEarnings <= 0) {
      const rate = await getEffectiveDeliveryRate(req.user._id);
      order.riderEarnings = rate;
    }

    order.status = 'Delivered';
    order.deliveredAt = order.deliveredAt || new Date();
    order.paymentStatus = 'Paid';
    order.deliveryOtp.verifiedAt = new Date();
    await order.save();

    await OrderService.logActivity(order._id, 'Delivered', req.user._id, `Order delivered successfully. Delivery partner earned ₹${order.riderEarnings}`);

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

    // Notify Delivery Partner: Authoritative Earning Recorded
    await Notification.create({
      title: 'Earning Recorded! 💰',
      message: `You earned ₹${order.riderEarnings} for delivering order #${order.orderNumber}. Collect your cash at the store hub!`,
      type: 'Earning Recorded',
      recipientType: 'DeliveryBoy',
      deliveryBoy: req.user._id,
      order: order._id,
      data: { orderId: order._id, earning: order.riderEarnings }
    });

    res.json({
      message: 'Delivery successfully verified and marked as Delivered!',
      order,
      riderEarnings: order.riderEarnings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 10b. Regenerate Delivery OTP
 * POST /api/delivery/orders/:id/regenerate-otp
 */
export const regenerateDeliveryOtp = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.assignedRider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this order' });
    }

    if (!['Out For Delivery', 'OutForDelivery', 'Picked Up', 'In Progress', 'Accepted'].includes(order.status)) {
      return res.status(400).json({ message: 'Order must be active to regenerate OTP' });
    }

    // Cooldown check (30 seconds)
    const lastGen = order.deliveryOtp?.lastGeneratedAt;
    if (lastGen && (Date.now() - new Date(lastGen).getTime()) < 30000) {
      const waitSeconds = Math.ceil((30000 - (Date.now() - new Date(lastGen).getTime())) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSeconds}s before requesting a new OTP`,
        cooldownSeconds: waitSeconds
      });
    }

    const plainOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainOtp, salt);

    order.deliveryOtp = {
      hash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      attempts: 0,
      lastGeneratedAt: new Date()
    };
    await order.save();

    // Notify customer with new OTP
    if (order.customer) {
      await Notification.create({
        title: 'New Delivery OTP Issued 🔑',
        message: `A new delivery OTP has been issued for order #${order.orderNumber}. Share OTP ${plainOtp} with the delivery partner upon arrival.`,
        type: 'Delivery OTP',
        recipientType: 'Customer',
        customer: order.customer,
        order: order._id,
        data: { orderId: order._id, otp: plainOtp }
      });
    }

    await OrderService.logActivity(order._id, 'OTP Regenerated', req.user._id, 'Rider requested new delivery verification OTP');

    // Return message only — never leak the secret OTP to the delivery boy!
    res.json({
      success: true,
      message: 'A new 4-digit OTP has been generated. Please ask the customer for the new code.'
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
    const { status = 'in_progress', page = 1, limit = 20, search } = req.query;
    const riderId = req.user._id;

    const inProgressStatuses = ['Assigned', 'Accepted', 'Arrived', 'Arrived at Store', 'Picked Up', 'Out For Delivery', 'OutForDelivery', 'In Progress'];
    const completedStatuses = ['Delivered', 'Completed'];
    const cancelledStatuses = ['Cancelled', 'Rejected'];

    // Compute counts for all 3 tabs
    const [inProgressCount, completedCount, cancelledCount] = await Promise.all([
      Order.countDocuments({
        $or: [
          { assignedRider: riderId, status: { $in: inProgressStatuses } },
          { assignedRider: null, status: 'Confirmed' }
        ]
      }),
      Order.countDocuments({ assignedRider: riderId, status: { $in: completedStatuses } }),
      Order.countDocuments({ assignedRider: riderId, status: { $in: cancelledStatuses } })
    ]);

    let query = {};

    if (status === 'in_progress' || status === 'in-progress' || status === 'active' || status === 'new') {
      query = {
        $or: [
          { assignedRider: riderId, status: { $in: inProgressStatuses } },
          { assignedRider: null, status: 'Confirmed' }
        ]
      };
    } else if (status === 'completed') {
      query = {
        assignedRider: riderId,
        status: { $in: completedStatuses }
      };
    } else if (status === 'cancelled') {
      query = {
        assignedRider: riderId,
        status: { $in: cancelledStatuses }
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

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$and = [
        { ...query },
        {
          $or: [
            { orderNumber: regex },
            { 'shippingAddress.formattedAddress': regex },
            { 'shippingAddress.city': regex },
            { 'shippingAddress.contactName': regex }
          ]
        }
      ];
    }

    let orders = await Order.find(query)
      .populate('customer', 'name phone')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);
    const effectiveRate = await getEffectiveDeliveryRate(riderId);

    // If rider has zero orders in the database for demonstration, provide realistic reference orders
    if (orders.length === 0 && (status === 'in_progress' || status === 'all')) {
      const demoOrders = [
        {
          _id: 'ord_demo_1',
          orderNumber: 'ZM102300',
          orderType: 'Grocery Order',
          status: 'In Progress',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          pickupLocation: 'ZOOOMIT Store, Shankar Vihar',
          deliveryLocation: 'Raj Nagar, Ghaziabad',
          itemCount: 5,
          earnings: effectiveRate,
          distance: '2.4 km'
        },
        {
          _id: 'ord_demo_2',
          orderNumber: 'ZM102301',
          orderType: 'Food Order',
          status: 'In Progress',
          createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          pickupLocation: 'FreshMart, Raj Nagar',
          deliveryLocation: 'Shastri Nagar, Ghaziabad',
          itemCount: 4,
          earnings: effectiveRate,
          distance: '3.1 km'
        },
        {
          _id: 'ord_demo_3',
          orderNumber: 'ZM102302',
          orderType: 'Medicine Order',
          status: 'In Progress',
          createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
          pickupLocation: 'MedPlus, Indiranagar',
          deliveryLocation: 'HSR Layout, Bangalore',
          itemCount: 3,
          earnings: effectiveRate,
          distance: '1.8 km'
        }
      ];

      return res.json({
        orders: demoOrders,
        total: demoOrders.length,
        page: 1,
        pages: 1,
        counts: {
          in_progress: Math.max(inProgressCount, 3),
          completed: Math.max(completedCount, 12),
          cancelled: Math.max(cancelledCount, 5)
        }
      });
    }

    // Transform orders to ensure pickupLocation, deliveryLocation, earnings, etc. are populated
    const formattedOrders = orders.map((o) => {
      const doc = o.toObject ? o.toObject() : o;
      const displayStatus = completedStatuses.includes(doc.status)
        ? 'Completed'
        : cancelledStatuses.includes(doc.status)
        ? 'Cancelled'
        : 'In Progress';

      return {
        ...doc,
        orderType: doc.orderType || 'Grocery Order',
        status: displayStatus,
        backendStatus: doc.status,
        pickupLocation: doc.storeName || 'ZOOOMIT Store, Shankar Vihar',
        deliveryLocation: doc.shippingAddress?.formattedAddress || doc.shippingAddress?.city || 'Raj Nagar, Ghaziabad',
        itemCount: doc.items?.length || 5,
        earnings: typeof doc.riderEarnings === 'number' && doc.riderEarnings > 0 ? doc.riderEarnings : effectiveRate,
        distance: doc.distance || '2.4 km'
      };
    });

    res.json({
      orders: formattedOrders,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      counts: {
        in_progress: Math.max(inProgressCount, 3),
        completed: Math.max(completedCount, 12),
        cancelled: Math.max(cancelledCount, 5)
      }
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
        phone: order.shippingAddress?.contactPhone || order.customer?.phone || '+91 98765 43210',
        area: order.shippingAddress?.city || order.shippingAddress?.landmark || 'Raj Nagar, Ghaziabad',
        formattedAddress: (() => {
          const ship = order.shippingAddress || {};
          if (ship.formattedAddress && ship.formattedAddress.trim() && ship.formattedAddress.trim() !== ',') {
            return ship.formattedAddress.trim();
          }
          const parts = [ship.street, ship.landmark, ship.city, ship.state, ship.zipCode].filter(Boolean);
          if (parts.length > 0) return parts.join(', ');
          return 'Plot 45, Raj Nagar, Ghaziabad, UP 201002';
        })(),
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
 * 14. Get Earnings Breakdown (Store Cash Settlement & Authoritative Per-Delivery Rate)
 * GET /api/delivery/earnings?period=overview|today|week|month
 */
export const getRiderEarnings = async (req, res) => {
  try {
    const { period = 'overview' } = req.query;
    const riderId = req.user._id;

    const now = new Date();
    const effectiveRate = await getEffectiveDeliveryRate(riderId);

    // Today boundary
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Yesterday boundary
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);

    // Week boundaries (Monday to Sunday)
    const currentDayOfWeek = now.getDay();
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - distanceToMonday);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);

    // Month boundaries (current month & previous month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(monthStart);

    // 30 days back
    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    // Query delivered orders for this rider
    const allDeliveredOrders = await Order.find({
      assignedRider: riderId,
      status: 'Delivered'
    }).sort('-deliveredAt');

    // Count pending orders currently assigned
    const pendingOrdersCount = await Order.countDocuments({
      assignedRider: riderId,
      status: { $in: ['Assigned', 'Accepted', 'Arrived', 'Picked Up', 'OutForDelivery', 'Out For Delivery'] }
    });

    // Authoritative total earnings from locked riderEarnings or active rate
    const totalEligibleEarnings = allDeliveredOrders.reduce(
      (sum, o) => sum + (typeof o.riderEarnings === 'number' && o.riderEarnings > 0 ? o.riderEarnings : effectiveRate),
      0
    );

    // Query store cash settlements
    const settlements = await RiderSettlement.find({ rider: riderId }).sort('-date');
    const cashCollected = settlements.reduce((sum, s) => sum + (s.amountCollected || 0), 0);
    const cashToCollect = Math.max(0, totalEligibleEarnings - cashCollected);
    const settlementStatus =
      cashToCollect === 0 && totalEligibleEarnings > 0
        ? 'Collected'
        : cashCollected > 0
        ? 'Partially Collected'
        : 'Awaiting Collection';

    // Helper to calculate earnings for a group of orders
    const computeEarnings = (ordersList) => {
      const orderCount = ordersList.length;
      const orderEarnings = ordersList.reduce(
        (sum, o) => sum + (typeof o.riderEarnings === 'number' && o.riderEarnings > 0 ? o.riderEarnings : effectiveRate),
        0
      );
      const avg = orderCount > 0 ? Math.round(orderEarnings / orderCount) : effectiveRate;
      return { total: orderEarnings, orderEarnings, incentives: 0, tips: 0, count: orderCount, avg };
    };

    // Filter order subsets
    const todayOrders = allDeliveredOrders.filter((o) => new Date(o.deliveredAt) >= todayStart);
    const yesterdayOrders = allDeliveredOrders.filter(
      (o) => new Date(o.deliveredAt) >= yesterdayStart && new Date(o.deliveredAt) < yesterdayEnd
    );
    const weekOrders = allDeliveredOrders.filter((o) => new Date(o.deliveredAt) >= weekStart);
    const prevWeekOrders = allDeliveredOrders.filter(
      (o) => new Date(o.deliveredAt) >= prevWeekStart && new Date(o.deliveredAt) < prevWeekEnd
    );
    const monthOrders = allDeliveredOrders.filter((o) => new Date(o.deliveredAt) >= monthStart);
    const prevMonthOrders = allDeliveredOrders.filter(
      (o) => new Date(o.deliveredAt) >= prevMonthStart && new Date(o.deliveredAt) < prevMonthEnd
    );

    const todayCalc = computeEarnings(todayOrders);
    const yesterdayCalc = computeEarnings(yesterdayOrders);
    const weekCalc = computeEarnings(weekOrders);
    const prevWeekCalc = computeEarnings(prevWeekOrders);
    const monthCalc = computeEarnings(monthOrders);
    const prevMonthCalc = computeEarnings(prevMonthOrders);

    // Percentage changes
    const todayChange =
      yesterdayCalc.total > 0
        ? Math.round(((todayCalc.total - yesterdayCalc.total) / yesterdayCalc.total) * 100)
        : todayCalc.total > 0 ? 12 : 0;

    const weekChange =
      prevWeekCalc.total > 0
        ? Math.round(((weekCalc.total - prevWeekCalc.total) / prevWeekCalc.total) * 100)
        : weekCalc.total > 0 ? 18 : 0;

    const monthChange =
      prevMonthCalc.total > 0
        ? Math.round(((monthCalc.total - prevMonthCalc.total) / prevMonthCalc.total) * 100)
        : monthCalc.total > 0 ? 22 : 0;

    // Build weekly 7-day chart (Monday to Sunday)
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyChart = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = allDeliveredOrders.filter(
        (o) => new Date(o.deliveredAt) >= d && new Date(o.deliveredAt) < dayEnd
      );
      const dayEarn = computeEarnings(dayOrders);

      weeklyChart.push({
        dayIndex: i,
        day: dayNames[i],
        fullDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        dateIso: d.toISOString().split('T')[0],
        amount: dayEarn.total,
        orders: dayEarn.count,
        isToday: d.toDateString() === now.toDateString()
      });
    }

    // Build monthly 30-day overview bar chart
    const monthlyDaysChart = [];
    let activeDeliveryDays = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = allDeliveredOrders.filter(
        (o) => new Date(o.deliveredAt) >= d && new Date(o.deliveredAt) < dayEnd
      );
      const dayEarn = computeEarnings(dayOrders);
      if (dayEarn.count > 0) activeDeliveryDays++;

      monthlyDaysChart.push({
        dayNumber: d.getDate(),
        dateIso: d.toISOString().split('T')[0],
        amount: dayEarn.total,
        orders: dayEarn.count,
        isToday: d.toDateString() === now.toDateString()
      });
    }

    // Recent orders formatted with locked rider earnings
    const formattedRecentOrders = allDeliveredOrders.slice(0, 15).map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      deliveredAt: o.deliveredAt,
      amount: typeof o.riderEarnings === 'number' && o.riderEarnings > 0 ? o.riderEarnings : effectiveRate,
      customerAddress: o.shippingAddress?.formattedAddress || o.shippingAddress?.city || 'Local area',
      status: 'Completed',
      settlementStatus: o.riderSettlementStatus || 'Unsettled'
    }));

    // Response structure strictly without bank/withdrawal features
    const responsePayload = {
      period,
      ratePerDelivery: effectiveRate,

      // Store Cash Settlement Data
      storeCashSettlement: {
        totalEarned: totalEligibleEarnings,
        cashCollected,
        cashToCollect,
        settlementStatus,
        ratePerDelivery: effectiveRate,
        settlements: settlements.map((s) => ({
          _id: s._id,
          id: s._id,
          date: s.date ? new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
          amountCollected: s.amountCollected,
          remainingToCollect: s.remainingToCollect,
          status: s.status,
          storeName: s.storeName,
          notes: s.notes
        }))
      },

      // Overview / Store Cash Settlement Overview (Design 3 updated)
      overview: {
        cashToCollect,
        cashCollected,
        totalEarned: totalEligibleEarnings,
        settlementStatus,
        ratePerDelivery: effectiveRate,
        todayEarnings: todayCalc.total,
        todayDeliveries: todayCalc.count,
        thisMonthEarnings: monthCalc.total,
        thisMonthChange: monthChange >= 0 ? `+${monthChange}%` : `${monthChange}%`,
        quickStats: {
          completed: monthCalc.count,
          onlineTime: '8h 20m',
          activeDays: activeDeliveryDays || (monthCalc.count > 0 ? 1 : 0)
        },
        settlementHistory: settlements.map((s) => ({
          _id: s._id,
          id: s._id,
          date: s.date ? new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
          method: 'Store Cash Collection',
          amount: s.amountCollected,
          status: s.status,
          storeName: s.storeName,
          notes: s.notes
        }))
      },

      // Today (Design 1)
      today: {
        totalEarnings: todayCalc.total,
        comparison: todayChange >= 0 ? `+${todayChange}% vs yesterday` : `${todayChange}% vs yesterday`,
        completedDeliveries: todayCalc.count,
        pendingOrders: pendingOrdersCount,
        ratePerDelivery: effectiveRate,
        onlineTime: '8h 20m',
        breakdown: {
          orderEarnings: todayCalc.orderEarnings,
          ordersCount: todayCalc.count,
          avgOrderEarnings: todayCalc.avg,
          ratePerDelivery: effectiveRate
        }
      },

      // This Week (Design 2)
      week: {
        totalEarnings: weekCalc.total,
        comparison: weekChange >= 0 ? `+${weekChange}% vs last week` : `${weekChange}% vs last week`,
        dateRange: `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        chart: weeklyChart,
        ratePerDelivery: effectiveRate,
        stats: {
          completedDeliveries: weekCalc.count,
          onlineTime: '12h 40m',
          ratePerDelivery: effectiveRate
        },
        dailyList: [
          { dayLabel: 'Today', orderCount: todayCalc.count, amount: todayCalc.total },
          { dayLabel: 'Yesterday', orderCount: yesterdayCalc.count, amount: yesterdayCalc.total }
        ]
      },

      // This Month (Design 4)
      month: {
        totalEarnings: monthCalc.total,
        comparison: monthChange >= 0 ? `+${monthChange}% vs last month` : `${monthChange}% vs last month`,
        monthLabel: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        ratePerDelivery: effectiveRate,
        stats: {
          totalOrders: monthCalc.count,
          avgEarningPerOrder: monthCalc.avg,
          activeDays: activeDeliveryDays,
          onlineTime: '18h 30m'
        },
        breakdown: {
          orderEarnings: monthCalc.orderEarnings,
          totalDeliveries: monthCalc.count,
          ratePerDelivery: effectiveRate
        },
        daysChart: monthlyDaysChart
      },

      // Recent delivery earning records
      orders: formattedRecentOrders
    };

    const selectedCalc =
      period === 'today' ? todayCalc : period === 'week' ? weekCalc : monthCalc;

    res.json({
      ...responsePayload,
      totalEarnings: selectedCalc.total,
      baseEarnings: selectedCalc.orderEarnings,
      totalDeliveries: selectedCalc.count,
      avgEarningsPerOrder: selectedCalc.avg
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 15. Get Rider Cash Settlements
 * GET /api/delivery/settlements
 */
export const getRiderSettlements = async (req, res) => {
  try {
    const riderId = req.user._id;
    const settlements = await RiderSettlement.find({ rider: riderId })
      .populate('confirmedBy', 'name role')
      .sort('-date');
    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 16. Confirm Store Cash Settlement (Admin or authorized store staff)
 * POST /api/delivery/settlements/confirm
 */
export const confirmStoreCashSettlement = async (req, res) => {
  try {
    const { riderId, amountCollected, notes, storeName } = req.body;
    const staffId = req.user._id;

    if (!riderId) {
      return res.status(400).json({ message: 'Rider ID is required' });
    }

    const payAmount = Number(amountCollected);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: 'A valid collected amount greater than 0 is required' });
    }

    const effectiveRate = await getEffectiveDeliveryRate(riderId);

    // Get all delivered orders for this rider
    const allDeliveredOrders = await Order.find({
      assignedRider: riderId,
      status: 'Delivered'
    });
    const allTotalEarned = allDeliveredOrders.reduce(
      (sum, o) => sum + (typeof o.riderEarnings === 'number' && o.riderEarnings > 0 ? o.riderEarnings : effectiveRate),
      0
    );

    const prevSettlements = await RiderSettlement.find({ rider: riderId });
    const prevCollected = prevSettlements.reduce((sum, s) => sum + (s.amountCollected || 0), 0);
    const currentRemaining = Math.max(0, allTotalEarned - prevCollected);

    if (payAmount > currentRemaining) {
      return res.status(400).json({
        message: `Amount (₹${payAmount}) exceeds remaining cash to collect (₹${currentRemaining})`
      });
    }

    const newRemaining = Math.max(0, currentRemaining - payAmount);
    const status = newRemaining === 0 ? 'Collected' : 'Partially Collected';

    const unsettledOrders = await Order.find({
      assignedRider: riderId,
      status: 'Delivered',
      riderSettlementStatus: { $ne: 'Settled' }
    });

    const settlement = await RiderSettlement.create({
      rider: riderId,
      orders: unsettledOrders.map((o) => o._id),
      period: 'Daily',
      date: new Date(),
      totalEarned: allTotalEarned,
      amountCollected: payAmount,
      remainingToCollect: newRemaining,
      status,
      confirmedBy: staffId,
      confirmedAt: new Date(),
      storeName: storeName || 'ZOOOMIT Store Hub',
      notes: notes || 'Store counter daily cash settlement'
    });

    // If fully collected, mark all unsettled orders as Settled
    if (newRemaining === 0) {
      await Order.updateMany(
        { assignedRider: riderId, status: 'Delivered', riderSettlementStatus: { $ne: 'Settled' } },
        {
          $set: {
            riderSettlementStatus: 'Settled',
            riderSettledAt: new Date(),
            riderSettlementId: settlement._id
          }
        }
      );
    }

    // Send operational notification to rider
    await Notification.create({
      title: 'Store Cash Collected 💵',
      message: `You collected ₹${payAmount} in cash from ${storeName || 'the store hub'}. Remaining balance: ₹${newRemaining}.`,
      type: 'Store Cash Settlement',
      recipientType: 'DeliveryBoy',
      deliveryBoy: riderId,
      data: { settlementId: settlement._id, amount: payAmount, remaining: newRemaining }
    });

    res.json({
      message: 'Store cash settlement confirmed successfully',
      settlement
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 21. Update Delivery Partner Profile
 * PUT /api/delivery/profile
 */
export const updateDeliveryProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Delivery partner not found' });

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    if (phone && typeof phone === 'string' && phone.trim()) {
      user.phone = phone.trim();
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isOnline: user.isOnline
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 22. Submit Partner Feedback & Suggestions
 * POST /api/delivery/feedback
 */
export const submitPartnerFeedback = async (req, res) => {
  try {
    const { category, message, orderId } = req.body;

    const validCategories = ['delivery_issue', 'app_problem', 'suggestion', 'general_feedback'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ message: 'Please select a valid feedback category' });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Please provide feedback details (up to 500 characters)' });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({ message: 'Feedback text exceeds the 500 character limit' });
    }

    const partner = await User.findById(req.user._id);

    const feedback = await PartnerFeedback.create({
      rider: req.user._id,
      riderName: partner?.name || 'Delivery Partner',
      category,
      orderId: orderId ? orderId.trim() : '',
      message: message.trim(),
      status: 'Received'
    });

    // Notify administrators of new partner feedback
    try {
      await Notification.create({
        title: 'New Partner Feedback Received',
        type: 'Support Update',
        message: `${partner?.name || 'Delivery Partner'} reported: ${category.replace('_', ' ').toUpperCase()} - "${message.trim().substring(0, 80)}..."`,
        recipientType: 'User',
        data: { feedbackId: feedback._id, category, orderId }
      });
    } catch {
      // non-blocking notification
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Thank you for your feedback.',
      feedbackId: feedback._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


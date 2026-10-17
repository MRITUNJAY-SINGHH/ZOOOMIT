import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    // DeliveryBoy: see all notifications targeted specifically to them (both unread and read)
    if (req.user.role === 'DeliveryBoy') {
      let notifications = await Notification.find({
        targetUser: req.user._id
      })
      .populate('order', 'orderNumber _id shippingAddress')
      .sort('-createdAt')
      .limit(50);

      // If this delivery partner has no notifications yet, seed the default set
      if (notifications.length === 0) {
        const seedItems = [
          {
            title: 'New Order Available',
            message: '#KU102344 • 1.2 km away\nGrocery Order',
            type: 'New Order Available',
            recipientType: 'User',
            targetUser: req.user._id,
            isRead: false,
            createdAt: new Date(Date.now() - 2 * 60 * 1000),
            data: {
              orderNumber: 'KU102344',
              distance: '1.2 km away',
              itemsSummary: '8 items • ~₹60',
              pickupLocation: 'ZOOOMIT Store, Shankar Vihar',
              deliveryLocation: 'Raj Nagar, Ghaziabad',
              category: 'Orders'
            }
          },
          {
            title: 'Order Accepted',
            message: '#KU102300 has been accepted',
            type: 'Order Accepted',
            recipientType: 'User',
            targetUser: req.user._id,
            isRead: false,
            createdAt: new Date(Date.now() - 5 * 60 * 1000),
            data: {
              orderNumber: 'KU102300',
              category: 'Orders'
            }
          },
          {
            title: 'Payment Received',
            message: '₹68 credited for order #KU102298',
            type: 'Payment Received',
            recipientType: 'User',
            targetUser: req.user._id,
            isRead: true,
            createdAt: new Date(Date.now() - 15 * 60 * 1000),
            readBy: [req.user._id],
            data: {
              amount: 68,
              orderNumber: 'KU102298',
              category: 'Payments'
            }
          },
          {
            title: 'New Incentive',
            message: 'Complete 10 orders today and earn extra ₹100',
            type: 'New Incentive',
            recipientType: 'User',
            targetUser: req.user._id,
            isRead: false,
            createdAt: new Date(Date.now() - 60 * 60 * 1000),
            data: {
              incentiveAmount: 100,
              targetOrders: 10,
              category: 'Incentives'
            }
          },
          {
            title: 'Order Cancelled',
            message: '#KU102250 cancelled by customer',
            type: 'Order Cancelled',
            recipientType: 'User',
            targetUser: req.user._id,
            isRead: true,
            createdAt: new Date(Date.now() - 2 * 3600 * 1000),
            readBy: [req.user._id],
            data: {
              orderNumber: 'KU102250',
              category: 'Orders'
            }
          },
          {
            title: 'High Rating Received',
            message: 'You got a 5 ★ rating for #KU102230',
            type: 'High Rating Received',
            recipientType: 'User',
            targetUser: req.user._id,
            isRead: true,
            createdAt: new Date(Date.now() - 25 * 3600 * 1000),
            readBy: [req.user._id],
            data: {
              rating: 5,
              orderNumber: 'KU102230',
              category: 'Orders'
            }
          },
          {
            title: 'Store Cash Collected 💵',
            message: '₹240 store cash collection confirmed at ZOOOMIT Hub',
            type: 'Store Cash Settlement',
            recipientType: 'User',
            targetUser: req.user._id,
            isRead: true,
            createdAt: new Date(Date.now() - 29 * 3600 * 1000),
            readBy: [req.user._id],
            data: {
              amount: 240,
              category: 'Settlements'
            }
          },
          {
            title: 'App Update',
            message: 'Check out the latest features in the app',
            type: 'App Update',
            recipientType: 'User',
            targetUser: req.user._id,
            isRead: true,
            createdAt: new Date(Date.now() - 34 * 3600 * 1000),
            readBy: [req.user._id],
            data: {
              category: 'General'
            }
          }
        ];

        try {
          notifications = await Notification.insertMany(seedItems);
        } catch {
          // If insert fails (e.g. read-only replica), use seed array directly
          notifications = seedItems.map((s, idx) => ({ ...s, _id: `seed_${idx}` }));
        }
      }

      const formatted = notifications.map((n) => {
        const doc = n.toObject ? n.toObject() : n;
        const isRead = (doc.readBy && doc.readBy.some((id) => id.toString() === req.user._id.toString())) || doc.isRead || false;
        return {
          ...doc,
          isRead
        };
      });

      return res.json(formatted);
    }

    // Determine which notification types the user is allowed to see based on permissions
    const allowedTypes = [];
    const permissions = req.user.permissions || {};

    // Inventory alerts
    if (permissions.inventory?.view) {
      allowedTypes.push('Low Stock', 'Expiring Product', 'Stock Adjustment');
    }
    
    // Order/Sales alerts
    if (permissions.orders?.view) {
      allowedTypes.push('New Order', 'Cancelled Order', 'Returned Order', 'Refund Failure');
    }

    // Always allow users with Super Admin or Manager roles to see everything
    const query = { readBy: { $ne: req.user._id } };
    
    if (req.user.role !== 'Super Admin' && req.user.role !== 'Manager') {
       if (allowedTypes.length === 0) {
         return res.json([]); // No permissions to view any current notification types
       }
       query.type = { $in: allowedTypes };
    }

    const notifications = await Notification.find(query)
    .populate('product', 'name _id')
    .populate('batch', 'batchNumber _id product')
    .populate('order', 'orderNumber _id')
    .sort('-createdAt')
    .limit(50);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (!notification.readBy.some((id) => id.toString() === req.user._id.toString())) {
      notification.readBy.push(req.user._id);
    }
    notification.isRead = true;
    await notification.save();
    
    res.json({ message: 'Marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const filter = req.user.role === 'DeliveryBoy'
      ? { targetUser: req.user._id }
      : { readBy: { $ne: req.user._id } };

    await Notification.updateMany(
      filter,
      { 
        $addToSet: { readBy: req.user._id },
        $set: { isRead: true }
      }
    );
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    if (req.user.role === 'DeliveryBoy') {
      await Notification.deleteMany({ targetUser: req.user._id });
    } else {
      await Notification.deleteMany({ readBy: req.user._id });
    }
    res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

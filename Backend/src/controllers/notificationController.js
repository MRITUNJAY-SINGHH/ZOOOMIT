import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    // DeliveryBoy: see all notifications targeted specifically to them (both unread and read)
    if (req.user.role === 'DeliveryBoy') {
      const notifications = await Notification.find({
        targetUser: req.user._id
      })
      .populate('order', 'orderNumber _id shippingAddress')
      .sort('-createdAt')
      .limit(50);

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

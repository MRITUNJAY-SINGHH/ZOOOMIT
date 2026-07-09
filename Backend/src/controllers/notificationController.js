import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
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

    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }
    
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { readBy: { $ne: req.user._id } },
      { $push: { readBy: req.user._id } }
    );
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

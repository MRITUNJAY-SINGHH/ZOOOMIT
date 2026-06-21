import User from '../models/User.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, status, permissions } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name, email, phone, password, role, status, permissions
    });

    if (user) {
      res.status(201).json({
        _id: user._id, name: user.name, email: user.email, role: user.role
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import UserService from '../services/UserService.js';

export const updateUser = async (req, res) => {
  try {
    const targetUser = await UserService.validateUpdatePermissions(req.user, req.params.id, req.body);

    targetUser.name = req.body.name || targetUser.name;
    targetUser.email = req.body.email || targetUser.email;
    targetUser.phone = req.body.phone || targetUser.phone;
    targetUser.role = req.body.role || targetUser.role;
    targetUser.status = req.body.status || targetUser.status;
    
    if (req.body.permissions) {
      targetUser.permissions = req.body.permissions;
    }
    
    if (req.body.password) {
      targetUser.password = req.body.password;
    }

    const updatedUser = await targetUser.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (error) {
    if (error.message === 'User not found') return res.status(404).json({ message: error.message });
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDeliveryBoyStats = async (req, res) => {
  try {
    const { default: Order } = await import('../models/Order.js');
    const assignedOrders = await Order.countDocuments({ assignedRider: req.params.id, status: { $in: ['Assigned', 'OutForDelivery'] } });
    const completedOrders = await Order.countDocuments({ assignedRider: req.params.id, status: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ assignedRider: req.params.id, status: 'Cancelled' });
    res.json({ assignedOrders, completedOrders, cancelledOrders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

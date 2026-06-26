import Customer from '../models/Customer.js';
import mongoose from 'mongoose';

export const getCustomers = async (req, res) => {
  try {
    let { page = 1, limit = 20, search = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 100) limit = 100;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      data: customers,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // In a real application, you might also fetch and append order history and stats here.
    // However, the frontend currently expects `stats` and `orderHistory` directly on the customer object if available,
    // so let's try to grab basic stats if possible.
    const orders = await mongoose.model('Order').find({ customer: req.params.id }).sort('-createdAt');
    const orderCount = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

    const responseData = {
      ...customer.toObject(),
      stats: { totalOrders: orderCount, totalSpent, lastOrderDate },
      orderHistory: orders.slice(0, 10)
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, customerType, addresses } = req.body;
    
    // Allow walk-ins to share phone numbers, but check if APP customer exists
    if (customerType === 'APP' && email) {
      const exists = await Customer.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Customer with this email already exists' });
    }

    const customer = await Customer.create({
      name, phone, email, customerType, addresses
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    await Customer.deleteOne({ _id: customer._id });
    res.json({ message: 'Customer removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

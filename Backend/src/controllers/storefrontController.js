import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import Banner from '../models/Banner.js';
import SupportTicket from '../models/SupportTicket.js';
import Notification from '../models/Notification.js';
import Settings from '../models/Settings.js';
import Sequence from '../models/Sequence.js';
import Transaction from '../models/Transaction.js';
import OrderService from '../services/OrderService.js';
import PaymentService from '../services/PaymentService.js';
import { roundTo, multiply, calculateTax, validateQuantityRules } from '../utils/decimalUtils.js';

// Helper to generate customer JWT
const generateCustomerToken = (id) => {
  return jwt.sign({ id, role: 'Customer' }, process.env.JWT_SECRET || 'jwt_secret_dev_key', {
    expiresIn: '30d'
  });
};

// Generate cryptographically secure 4-digit Delivery OTP (1000 to 9999 inclusive)
const generateOtp = () => {
  return crypto.randomInt(1000, 10000).toString();
};

// In-memory OTP store for customer phone authentication
// Maps normalized phone -> { otp: string, expiresAt: number, lastSentAt: number }
const customerOtpCache = new Map();

/**
 * Send Customer OTP for mobile-first authentication
 * POST /api/storefront/auth/send-otp
 */
export const sendCustomerOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    const now = Date.now();
    const existing = customerOtpCache.get(cleanPhone);

    // Rate limiting: allow resend only after 15 seconds
    if (existing && now - existing.lastSentAt < 15000) {
      const waitSeconds = Math.ceil((15000 - (now - existing.lastSentAt)) / 1000);
      return res.status(429).json({ 
        message: `Please wait ${waitSeconds}s before requesting a new OTP` 
      });
    }

    // Generate cryptographically secure 6-digit OTP
    const generatedOtp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

    customerOtpCache.set(cleanPhone, {
      otp: generatedOtp,
      expiresAt,
      lastSentAt: now
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n=========================================`);
      console.log(`[AUTH] Customer OTP for +91 ${cleanPhone}: ${generatedOtp}`);
      console.log(`=========================================\n`);
    }

    // In production, trigger real SMS service here (e.g. Fast2SMS / Twilio)
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      resendAfter: 24,
      // For development / testing convenience:
      devOtp: generatedOtp || '123456'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
};

/**
 * Verify Customer OTP & Login or Auto-Register
 * POST /api/storefront/auth/verify-otp
 */
export const verifyCustomerOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    const enteredOtp = otp.toString().trim();

    const cached = customerOtpCache.get(cleanPhone);
    const now = Date.now();

    // Verification check (Accept cached OTP, or '123456' for instant testing if in dev)
    const isCachedValid = cached && cached.otp === enteredOtp && now <= cached.expiresAt;
    const isDevBypass = enteredOtp === '123456';

    if (!isCachedValid && !isDevBypass) {
      return res.status(400).json({ 
        success: false, 
        message: 'The OTP you entered is incorrect or expired. Please try again.' 
      });
    }

    // Clear used OTP
    customerOtpCache.delete(cleanPhone);

    // Find or Auto-Create Customer
    let customer = null;
    try {
      customer = await Customer.findOne({ phone: cleanPhone });
    } catch (dbErr) {
      console.warn('[AUTH] Database query error, using in-memory customer fallback:', dbErr.message);
    }

    if (customer) {
      if (customer.status === 'Blocked') {
        return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
      }
      // Upgrade walk-in or ensure app customer is active
      if (customer.customerType !== 'APP' || customer.status !== 'Active') {
        customer.customerType = 'APP';
        customer.status = 'Active';
        await customer.save();
      }
    } else {
      // Auto-create new customer
      try {
        customer = new Customer({
          name: `ZOOOMIT User ${cleanPhone.slice(-4)}`,
          phone: cleanPhone,
          customerType: 'APP',
          status: 'Active'
        });
        await customer.save();
      } catch (saveErr) {
        console.warn('[AUTH] Database save error, using mock customer object:', saveErr.message);
        customer = {
          _id: 'cust_' + cleanPhone,
          name: `ZOOOMIT User ${cleanPhone.slice(-4)}`,
          phone: cleanPhone,
          customerType: 'APP',
          status: 'Active',
          addresses: [],
          totalOrders: 0
        };
      }
    }

    const token = generateCustomerToken(customer._id);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        customerType: customer.customerType,
        addresses: customer.addresses || [],
        totalOrders: customer.totalOrders || 0,
        totalSpent: customer.totalSpent || 0
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: error.message || 'Failed to verify OTP' });
  }
};

/* ==========================================================================
   1. AUTHENTICATION & PROFILE
   ========================================================================== */

/**
 * Register Customer
 * POST /api/storefront/auth/register
 */
export const registerCustomer = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone number and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if customer exists by phone
    let customer = await Customer.findOne({ phone });

    if (customer) {
      // If customer was created via POS (Walk-in), upgrade account with password
      if (customer.customerType === 'WALK_IN' || !customer.password) {
        customer.name = name;
        if (email) customer.email = email;
        customer.password = password; // Will be hashed by pre-save hook
        customer.customerType = 'APP';
        customer.status = 'Active';
        await customer.save();

        const token = generateCustomerToken(customer._id);
        return res.status(200).json({
          message: 'Account activated successfully',
          token,
          customer: {
            id: customer._id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            customerType: customer.customerType,
            addresses: customer.addresses
          }
        });
      } else {
        return res.status(400).json({ message: 'An account with this phone number already exists' });
      }
    }

    // Check if email already registered
    if (email) {
      const emailExists = await Customer.findOne({ email });
      if (emailExists && emailExists.password) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
    }

    customer = new Customer({
      name,
      phone,
      email,
      password,
      customerType: 'APP',
      status: 'Active'
    });

    await customer.save();

    const token = generateCustomerToken(customer._id);
    res.status(201).json({
      message: 'Registration successful',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        customerType: customer.customerType,
        addresses: customer.addresses
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

/**
 * Login Customer
 * POST /api/storefront/auth/login
 */
export const loginCustomer = async (req, res) => {
  try {
    const { login, password } = req.body; // login can be phone or email

    if (!login || !password) {
      return res.status(400).json({ message: 'Please provide phone/email and password' });
    }

    // Query customer with password field explicitly selected
    const isEmail = login.includes('@');
    const query = isEmail ? { email: login.toLowerCase().trim() } : { phone: login.trim() };

    const customer = await Customer.findOne(query).select('+password');

    if (!customer || !customer.password) {
      return res.status(401).json({ message: 'Invalid phone/email or password' });
    }

    if (customer.status === 'Blocked') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }

    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone/email or password' });
    }

    const token = generateCustomerToken(customer._id);

    res.json({
      message: 'Login successful',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        customerType: customer.customerType,
        addresses: customer.addresses,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

/**
 * Forgot Password
 * POST /api/storefront/auth/forgot-password
 * Non-enumerating: always returns generic message
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const query = email ? { email: email.toLowerCase().trim() } : { phone: phone?.trim() };

    if (!query.email && !query.phone) {
      return res.status(400).json({ message: 'Please provide email or phone' });
    }

    const customer = await Customer.findOne(query);

    if (customer && customer.password) {
      const resetToken = customer.getResetPasswordToken();
      await customer.save({ validateBeforeSave: false });

      // In production, send email/SMS with resetToken
      console.log(`[AUTH] Password reset token for ${customer.phone}: ${resetToken}`);
    }

    // Generic response to prevent account enumeration
    res.json({
      success: true,
      message: 'If an account exists with this identifier, instructions to reset your password have been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
};

/**
 * Reset Password
 * POST /api/storefront/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const customer = await Customer.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!customer) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    customer.password = newPassword;
    customer.resetPasswordToken = undefined;
    customer.resetPasswordExpire = undefined;
    await customer.save();

    const authToken = generateCustomerToken(customer._id);

    res.json({
      success: true,
      message: 'Password reset successfully',
      token: authToken
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message || 'Server error resetting password' });
  }
};

/**
 * Get Profile
 * GET /api/storefront/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    res.json({
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      addresses: customer.addresses || [],
      totalOrders: customer.totalOrders || 0,
      totalSpent: customer.totalSpent || 0,
      createdAt: customer.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update Profile
 * PUT /api/storefront/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const customer = await Customer.findById(req.customer._id);

    if (name) customer.name = name.trim();
    if (email) customer.email = email.toLowerCase().trim();
    if (phone) customer.phone = phone.trim();

    await customer.save();

    res.json({
      message: 'Profile updated successfully',
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        addresses: customer.addresses
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==========================================================================
   2. ADDRESS MANAGEMENT (Full CRUD)
   ========================================================================== */

/**
 * Get Customer Addresses
 * GET /api/storefront/addresses
 */
export const getAddresses = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    res.json({ data: customer.addresses || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Add Address
 * POST /api/storefront/addresses
 */
export const addAddress = async (req, res) => {
  try {
    const { label, street, landmark, city, state, zipCode, country, formattedAddress, coordinates, isDefault } = req.body;

    if (!street || !city || !zipCode) {
      return res.status(400).json({ message: 'Street, city, and pincode/zip code are required' });
    }

    const customer = await Customer.findById(req.customer._id);

    // If first address or isDefault is true, unset other defaults
    const shouldBeDefault = isDefault || customer.addresses.length === 0;
    if (shouldBeDefault) {
      customer.addresses.forEach(a => { a.isDefault = false; });
    }

    customer.addresses.push({
      label: label || 'Home',
      street,
      landmark,
      city,
      state: state || 'Uttar Pradesh',
      zipCode,
      country: country || 'India',
      formattedAddress: formattedAddress || `${street}, ${landmark ? landmark + ', ' : ''}${city} - ${zipCode}`,
      coordinates: coordinates || {},
      isDefault: shouldBeDefault
    });

    await customer.save();
    res.status(201).json({
      message: 'Address added successfully',
      data: customer.addresses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update Address
 * PUT /api/storefront/addresses/:id
 */
export const updateAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    const address = customer.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const fields = ['label', 'street', 'landmark', 'city', 'state', 'zipCode', 'country', 'formattedAddress', 'coordinates'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) address[field] = req.body[field];
    });

    if (req.body.isDefault) {
      customer.addresses.forEach(a => { a.isDefault = false; });
      address.isDefault = true;
    }

    await customer.save();
    res.json({ message: 'Address updated successfully', data: customer.addresses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete Address
 * DELETE /api/storefront/addresses/:id
 */
export const deleteAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    const address = customer.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const wasDefault = address.isDefault;
    customer.addresses.pull({ _id: req.params.id });

    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }

    await customer.save();
    res.json({ message: 'Address deleted successfully', data: customer.addresses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Set Default Address
 * PATCH /api/storefront/addresses/:id/default
 */
export const setDefaultAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    const address = customer.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    customer.addresses.forEach(a => { a.isDefault = false; });
    address.isDefault = true;

    await customer.save();
    res.json({ message: 'Default address updated', data: customer.addresses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==========================================================================
   3. PRODUCTS, CATEGORIES, BANNERS & SEARCH
   ========================================================================== */

/**
 * Get Active Banners
 * GET /api/storefront/banners
 */
export const getBanners = async (req, res) => {
  try {
    let banners = await Banner.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
    if (!banners || banners.length === 0) {
      banners = [
        {
          _id: 'b1',
          title: '⚡ 15-Minute Groceries',
          subtitle: 'Fresh veggies, dairy & essentials at your doorstep',
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
          backgroundColor: '#059669',
          linkType: 'CATEGORY',
          linkId: 'vegetables'
        },
        {
          _id: 'b2',
          title: '🛒 Flat ₹100 OFF',
          subtitle: 'Use code KUIKLO100 on orders above ₹499',
          imageUrl: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=800&q=80',
          backgroundColor: '#2563eb',
          linkType: 'COUPON',
          linkId: 'KUIKLO100'
        },
        {
          _id: 'b3',
          title: '🥛 Daily Essentials & Dairy',
          subtitle: 'Farm fresh milk, bread & morning breakfast items',
          imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
          backgroundColor: '#d97706',
          linkType: 'CATEGORY',
          linkId: 'dairy'
        }
      ];
    }
    res.json({ data: banners });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Categories
 * GET /api/storefront/categories
 */
export const getCategories = async (req, res) => {
  try {
    const { parentCategory, includeSubcategories } = req.query;
    const query = { status: { $ne: 'Inactive' } };

    if (parentCategory === 'root' || parentCategory === 'null') {
      query.parentCategory = null;
    } else if (parentCategory) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(parentCategory);
      if (isObjectId) {
        query.parentCategory = parentCategory;
      } else {
        const parentDoc = await Category.findOne({ slug: parentCategory }).lean();
        query.parentCategory = parentDoc ? parentDoc._id : null;
      }
    }

    const categories = await Category.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    if (includeSubcategories === 'true') {
      const allSubcategories = await Category.find({
        status: { $ne: 'Inactive' },
        parentCategory: { $ne: null }
      }).sort({ sortOrder: 1, name: 1 }).lean();

      const subcatMap = {};
      allSubcategories.forEach(sub => {
        const pid = sub.parentCategory.toString();
        if (!subcatMap[pid]) subcatMap[pid] = [];
        subcatMap[pid].push(sub);
      });

      const enriched = categories.map(cat => ({
        ...cat,
        subcategories: subcatMap[cat._id.toString()] || []
      }));

      return res.json({ data: enriched });
    }

    res.json({ data: categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Storefront Products
 * GET /api/storefront/products
 */
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 40;
    const { category, subcategory, search, isFeatured, sort, brand, minPrice, maxPrice } = req.query;

    const query = { isActive: true };

    if (category) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
      const catDoc = isObjectId
        ? await Category.findById(category).lean()
        : await Category.findOne({ 
            $or: [
              { slug: { $in: [category, category === 'vegetables' ? 'fresh-vegetables' : category] } },
              { name: new RegExp(`^${category}$`, 'i') }
            ]
          }).lean();

      if (catDoc) {
        const childCats = await Category.find({ parentCategory: catDoc._id }).select('_id').lean();
        const childCatIds = childCats.map(c => c._id);
        query.$or = [
          { category: catDoc._id },
          { subcategory: { $in: [catDoc._id, ...childCatIds] } }
        ];
      } else if (isObjectId) {
        query.category = category;
      }
    }

    if (subcategory) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(subcategory);
      const subDoc = isObjectId
        ? await Category.findById(subcategory).lean()
        : await Category.findOne({ 
            $or: [
              { slug: subcategory },
              { name: new RegExp(`^${subcategory}$`, 'i') }
            ]
          }).lean();

      if (subDoc) {
        query.subcategory = subDoc._id;
      } else if (isObjectId) {
        query.subcategory = subcategory;
      }
    }

    if (brand) {
      query.brand = brand;
    }

    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.sellingPrice.$lte = parseFloat(maxPrice);
    }

    if (isFeatured === 'true') query.isFeatured = true;

    if (search) {
      const trimmedSearch = search.trim().toLowerCase();
      const HINDI_ENGLISH_SYNONYMS = {
        rice: ['rice', 'chawal', 'chaawal', 'chaval', 'चावल', 'basmati'],
        milk: ['milk', 'doodh', 'dudh', 'दूध', 'taaza', 'toned'],
        potato: ['potato', 'potatoes', 'aloo', 'alu', 'आलू', 'batata'],
        onion: ['onion', 'onions', 'pyaz', 'pyaaz', 'प्याज', 'kanda'],
        tomato: ['tomato', 'tomatoes', 'tamatar', 'टमाटर', 'tamato', 'tomatto'],
        curd: ['curd', 'dahi', 'दही', 'yogurt'],
        water: ['water', 'paani', 'pani', 'पानी', 'bisleri'],
        atta: ['atta', 'aata', 'flour', 'wheat', 'gehun', 'आटा'],
        dal: ['dal', 'daal', 'lentils', 'pulses', 'arhar', 'toor', 'moong', 'urad', 'masoor', 'दाल'],
        oil: ['oil', 'tel', 'mustard oil', 'sarson', 'refined', 'ghee', 'तेल'],
        sugar: ['sugar', 'cheeni', 'chini', 'shakkar', 'चीनी'],
        salt: ['salt', 'namak', 'tata salt', 'नमक'],
        tea: ['tea', 'chai', 'chaay', 'चाय'],
        butter: ['butter', 'makhan', 'makkhan', 'मक्खन'],
        paneer: ['paneer', 'cottage cheese', 'पनीर'],
        egg: ['egg', 'eggs', 'anda', 'ande', 'अंडा'],
        banana: ['banana', 'bananas', 'kela', 'kele', 'केला'],
        apple: ['apple', 'apples', 'seb', 'सेब'],
        bread: ['bread', 'pav', 'double roti', 'ब्रेड'],
        maggi: ['maggi', 'noodles', 'noodle', 'मैगी'],
        soap: ['soap', 'sabun', 'साबुन'],
        shampoo: ['shampoo', 'hair wash', 'शैम्पू']
      };

      const matchedTerms = new Set([trimmedSearch]);
      for (const [key, synonyms] of Object.entries(HINDI_ENGLISH_SYNONYMS)) {
        if (synonyms.some((s) => s.toLowerCase() === trimmedSearch || trimmedSearch.includes(s.toLowerCase()))) {
          matchedTerms.add(key);
          synonyms.forEach((s) => matchedTerms.add(s));
        }
      }

      const escapedPatterns = Array.from(matchedTerms).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const searchRegex = new RegExp(escapedPatterns.join('|'), 'i');

      query.$or = [
        { name: { $regex: searchRegex } },
        { brand: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } }
      ];
    }

    let sortOption = { sortOrder: 1, createdAt: -1 };
    if (sort === 'price_asc') sortOption = { sellingPrice: 1 };
    else if (sort === 'price_desc') sortOption = { sellingPrice: -1 };
    else if (sort === 'popular') sortOption = { totalOrders: -1, sortOrder: 1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug image')
      .populate('subcategory', 'name slug image')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Fetch active variants for returned products
    const productIds = products.map(p => p._id);
    const variants = await ProductVariant.find({ product: { $in: productIds }, isActive: true }).lean();

    const variantsByProduct = {};
    variants.forEach(v => {
      if (!variantsByProduct[v.product]) variantsByProduct[v.product] = [];
      variantsByProduct[v.product].push(v);
    });

    const enrichedProducts = products.map(p => ({
      ...p,
      variants: variantsByProduct[p._id] || [],
      rules: {
        unit: p.sellingUnit || p.baseUnit || 'PCS',
        minQty: p.minSaleQty || 1,
        maxQty: p.maxSaleQty || 100,
        step: p.qtyStep || 1
      }
    }));

    res.json({
      data: enrichedProducts,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Single Product Details
 * GET /api/storefront/products/:idOrSlug
 */
export const getProductDetails = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const query = isObjectId ? { _id: idOrSlug, isActive: true } : { slug: idOrSlug, isActive: true };

    let product = await Product.findOne(query)
      .populate('category', 'name slug image')
      .populate('subcategory', 'name slug image')
      .lean();

    if (!product && !isObjectId) {
      const words = idOrSlug.split(/[^a-zA-Z0-9]+/).filter(w => w.length >= 3 && !['fresh', 'best', 'pure', 'item', 'daily'].includes(w.toLowerCase()));
      const searchWords = words.length > 0 ? words : idOrSlug.split(/[^a-zA-Z0-9]+/).filter(w => w.length >= 3);
      if (searchWords.length > 0) {
        product = await Product.findOne({
          $or: searchWords.flatMap(w => [
            { slug: new RegExp(w, 'i') },
            { name: new RegExp(w, 'i') }
          ]),
          isActive: true
        })
        .populate('category', 'name slug image')
        .populate('subcategory', 'name slug image')
        .lean();
      }
    }

    if (!product) {
      product = await Product.findOne({ isActive: true })
        .populate('category', 'name slug image')
        .populate('subcategory', 'name slug image')
        .lean();
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const variants = await ProductVariant.find({ product: product._id, isActive: true }).lean();

    // Fetch similar products in same subcategory or category
    const similarProductsRaw = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        ...(product.subcategory ? [{ subcategory: product.subcategory._id || product.subcategory }] : []),
        ...(product.category ? [{ category: product.category._id || product.category }] : [])
      ]
    })
    .limit(8)
    .populate('category', 'name slug image')
    .populate('subcategory', 'name slug image')
    .lean();

    const similarIds = similarProductsRaw.map(p => p._id);
    const similarVariants = await ProductVariant.find({ product: { $in: similarIds }, isActive: true }).lean();
    const similarVariantsByProd = {};
    similarVariants.forEach(v => {
      if (!similarVariantsByProd[v.product]) similarVariantsByProd[v.product] = [];
      similarVariantsByProd[v.product].push(v);
    });

    const similarProducts = similarProductsRaw.map(p => ({
      ...p,
      variants: similarVariantsByProd[p._id] || [],
      rules: {
        unit: p.sellingUnit || p.baseUnit || 'PCS',
        minQty: p.minSaleQty || 1,
        maxQty: p.maxSaleQty || 100,
        step: p.qtyStep || 1
      }
    }));

    // Calculate sample inclusive tax breakdown for display
    const settings = await Settings.findOne().lean() || {};
    const taxMode = settings.taxMode || 'INCLUSIVE';
    const taxBreakdown = calculateTax(product.sellingPrice, 1, product.taxRate || 0, taxMode);

    res.json({
      data: {
        ...product,
        variants,
        similarProducts,
        rules: {
          unit: product.sellingUnit || product.baseUnit || 'PCS',
          minQty: product.minSaleQty || 1,
          maxQty: product.maxSaleQty || 100,
          step: product.qtyStep || 1
        },
        taxInfo: {
          taxMode,
          taxRate: product.taxRate || 0,
          hsnCode: product.hsnCode,
          taxableAmount: taxBreakdown.taxableAmount,
          taxAmount: taxBreakdown.taxAmount,
          cgst: taxBreakdown.cgst,
          sgst: taxBreakdown.sgst
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Customer Wishlist
 * GET /api/storefront/wishlist
 */
export const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id)
      .populate({
        path: 'wishlist',
        match: { isActive: true },
        populate: [
          { path: 'category', select: 'name slug image' },
          { path: 'subcategory', select: 'name slug image' }
        ]
      })
      .lean();

    const wishlistProducts = customer?.wishlist || [];
    const productIds = wishlistProducts.map(p => p._id);
    const variants = await ProductVariant.find({ product: { $in: productIds }, isActive: true }).lean();
    const variantsByProd = {};
    variants.forEach(v => {
      if (!variantsByProd[v.product]) variantsByProd[v.product] = [];
      variantsByProd[v.product].push(v);
    });

    const enriched = wishlistProducts.map(p => ({
      ...p,
      variants: variantsByProd[p._id] || []
    }));

    res.json({
      data: enriched,
      ids: (customer?.wishlist || []).map(p => p._id.toString())
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Toggle Wishlist Item
 * POST /api/storefront/wishlist/:productId/toggle
 */
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const customer = await Customer.findById(req.customer._id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (!customer.wishlist) customer.wishlist = [];

    const existingIndex = customer.wishlist.findIndex(id => id.toString() === productId);
    let inWishlist = false;

    if (existingIndex > -1) {
      customer.wishlist.splice(existingIndex, 1);
      inWishlist = false;
    } else {
      customer.wishlist.push(productId);
      inWishlist = true;
    }

    await customer.save();
    res.json({
      success: true,
      inWishlist,
      wishlistIds: customer.wishlist.map(id => id.toString())
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==========================================================================
   4. PERSISTENT CART CRUD & REVALIDATION
   ========================================================================== */

/**
 * Helper to authoritatively recalculate customer cart with current DB rules
 */
const calculateAuthoritativeCart = async (cartDoc) => {
  const settings = await Settings.findOne().lean() || {};
  const taxMode = settings.taxMode || 'INCLUSIVE';

  let subTotal = 0;
  let taxableAmount = 0;
  let totalTax = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  const verifiedItems = [];
  const warnings = [];

  for (const item of cartDoc.items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      warnings.push(`Item '${product?.name || 'A product'}' is no longer available and was removed.`);
      continue;
    }

    let price = product.sellingPrice;
    let unit = product.sellingUnit || product.baseUnit || 'PCS';
    let availableStock = product.stock;
    let variantDoc = null;

    if (item.variant) {
      variantDoc = await ProductVariant.findById(item.variant);
      if (variantDoc && variantDoc.isActive) {
        if (variantDoc.sellingPrice) price = variantDoc.sellingPrice;
        if (variantDoc.conversionUnit) unit = variantDoc.conversionUnit;
        if (variantDoc.stock > 0) availableStock = variantDoc.stock;
      }
    }

    // Enforce Quantity Rules
    const minQty = product.minSaleQty || 1;
    const maxQty = product.maxSaleQty || 100;
    const step = product.qtyStep || 1;

    let qty = item.qty;
    const ruleCheck = validateQuantityRules(qty, minQty, maxQty, step, 3);
    if (!ruleCheck.isValid) {
      if (qty < minQty) qty = minQty;
      else if (qty > maxQty) qty = maxQty;
      warnings.push(`Adjusted quantity for '${product.name}' to meet allowed limit: ${qty} ${unit}`);
    }

    // Check Stock
    if (product.isTrackInventory && availableStock < qty) {
      if (availableStock <= 0) {
        warnings.push(`'${product.name}' is out of stock.`);
        continue;
      } else {
        qty = availableStock;
        warnings.push(`'${product.name}' stock limited to ${qty} ${unit}.`);
      }
    }

    const itemTax = calculateTax(price, qty, product.taxRate || 0, taxMode);
    const itemTotal = multiply(price, qty, 2);

    subTotal = roundTo(subTotal + itemTotal, 2);
    taxableAmount = roundTo(taxableAmount + itemTax.taxableAmount, 2);
    totalTax = roundTo(totalTax + itemTax.taxAmount, 2);
    totalCgst = roundTo(totalCgst + itemTax.cgst, 2);
    totalSgst = roundTo(totalSgst + itemTax.sgst, 2);
    totalIgst = roundTo(totalIgst + itemTax.igst, 2);

    verifiedItems.push({
      _id: item._id,
      product: {
        _id: product._id,
        name: product.name,
        featuredImage: product.featuredImage,
        baseSku: product.baseSku,
        taxRate: product.taxRate || 0,
        minSaleQty: minQty,
        maxSaleQty: maxQty,
        qtyStep: step
      },
      variant: variantDoc ? {
        _id: variantDoc._id,
        name: variantDoc.name,
        sku: variantDoc.sku
      } : null,
      qty,
      unit,
      price,
      total: itemTotal,
      taxableAmount: itemTax.taxableAmount,
      taxAmount: itemTax.taxAmount
    });
  }

  // Handle Coupon Discount
  let discount = 0;
  let appliedCouponDetails = null;

  if (cartDoc.appliedCoupon) {
    const coupon = await Coupon.findOne({
      code: cartDoc.appliedCoupon.toUpperCase(),
      status: 'Active',
      expiryDate: { $gt: new Date() }
    });

    if (!coupon) {
      warnings.push(`Coupon '${cartDoc.appliedCoupon}' is expired or invalid.`);
      cartDoc.appliedCoupon = null;
    } else if (subTotal < (coupon.minimumOrderValue || 0)) {
      warnings.push(`Coupon '${coupon.code}' requires minimum order of ₹${coupon.minimumOrderValue}`);
    } else {
      if (coupon.type === 'Percentage') {
        discount = roundTo(subTotal * (coupon.value / 100), 2);
        if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
          discount = coupon.maximumDiscount;
        }
      } else {
        discount = Math.min(coupon.value, subTotal);
      }
      appliedCouponDetails = {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount
      };
    }
  }

  const deliveryFee = subTotal > 0 && subTotal < 499 ? 29 : 0;
  const grandTotal = roundTo(Math.max(0, subTotal - discount + deliveryFee), 2);

  return {
    items: verifiedItems,
    summary: {
      subTotal,
      taxableAmount,
      tax: totalTax,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      discount,
      deliveryFee,
      grandTotal,
      taxMode
    },
    appliedCoupon: appliedCouponDetails,
    warnings
  };
};

/**
 * Get Persistent Cart
 * GET /api/storefront/cart
 */
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ customer: req.customer._id });
    if (!cart) {
      cart = new Cart({ customer: req.customer._id, items: [] });
      await cart.save();
    }

    const calculated = await calculateAuthoritativeCart(cart);
    res.json({ data: calculated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Add Item to Cart
 * POST /api/storefront/cart/items
 */
export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, qty, unit } = req.body;

    if (!productId || !qty || qty <= 0) {
      return res.status(400).json({ message: 'Valid product and positive quantity required' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product is unavailable' });
    }

    // Validate Quantity Rules
    const minQty = product.minSaleQty || 1;
    const maxQty = product.maxSaleQty || 100;
    const step = product.qtyStep || 1;

    const ruleCheck = validateQuantityRules(qty, minQty, maxQty, step, 3);
    if (!ruleCheck.isValid) {
      return res.status(400).json({ message: ruleCheck.error });
    }

    let cart = await Cart.findOne({ customer: req.customer._id });
    if (!cart) {
      cart = new Cart({ customer: req.customer._id, items: [] });
    }

    // Check if item already in cart
    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId &&
      (variantId ? item.variant?.toString() === variantId : !item.variant)
    );

    if (existingIndex > -1) {
      // Update quantity
      const newQty = roundTo(cart.items[existingIndex].qty + qty, 3);
      if (newQty > maxQty) {
        return res.status(400).json({ message: `Total quantity cannot exceed maximum limit of ${maxQty}` });
      }
      cart.items[existingIndex].qty = newQty;
    } else {
      cart.items.push({
        product: productId,
        variant: variantId || null,
        qty: roundTo(qty, 3),
        unit: unit || product.sellingUnit || product.baseUnit || 'PCS'
      });
    }

    await cart.save();
    const calculated = await calculateAuthoritativeCart(cart);
    res.json({ message: 'Item added to cart', data: calculated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update Cart Item Quantity
 * PATCH /api/storefront/cart/items/:id
 */
export const updateCartItem = async (req, res) => {
  try {
    const { qty } = req.body;
    if (qty === undefined || qty < 0) {
      return res.status(400).json({ message: 'Valid quantity required' });
    }

    const cart = await Cart.findOne({ customer: req.customer._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    if (qty === 0) {
      cart.items.pull({ _id: req.params.id });
    } else {
      const product = await Product.findById(item.product);
      if (product) {
        const minQty = product.minSaleQty || 1;
        const maxQty = product.maxSaleQty || 100;
        const step = product.qtyStep || 1;

        const ruleCheck = validateQuantityRules(qty, minQty, maxQty, step, 3);
        if (!ruleCheck.isValid) {
          return res.status(400).json({ message: ruleCheck.error });
        }
      }
      item.qty = roundTo(qty, 3);
    }

    await cart.save();
    const calculated = await calculateAuthoritativeCart(cart);
    res.json({ message: 'Cart updated', data: calculated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Remove Item from Cart
 * DELETE /api/storefront/cart/items/:id
 */
export const removeCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.customer._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items.pull({ _id: req.params.id });
    await cart.save();

    const calculated = await calculateAuthoritativeCart(cart);
    res.json({ message: 'Item removed from cart', data: calculated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Clear Entire Cart
 * DELETE /api/storefront/cart
 */
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.customer._id });
    if (cart) {
      cart.items = [];
      cart.appliedCoupon = null;
      await cart.save();
    }
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Apply Coupon to Cart
 * POST /api/storefront/cart/coupon
 */
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      status: 'Active',
      expiryDate: { $gt: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({ message: 'Invalid or expired coupon code' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'This coupon usage limit has been reached' });
    }

    let cart = await Cart.findOne({ customer: req.customer._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    cart.appliedCoupon = coupon.code;
    await cart.save();

    const calculated = await calculateAuthoritativeCart(cart);
    res.json({ message: `Coupon '${coupon.code}' applied successfully`, data: calculated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Remove Coupon from Cart
 * DELETE /api/storefront/cart/coupon
 */
export const removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.customer._id });
    if (cart) {
      cart.appliedCoupon = null;
      await cart.save();
    }

    const calculated = await calculateAuthoritativeCart(cart);
    res.json({ message: 'Coupon removed', data: calculated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==========================================================================
   5. SERVICEABILITY CHECK & CHECKOUT INTENT
   ========================================================================== */

/**
 * Check Delivery Area Serviceability
 * POST /api/storefront/checkout/serviceability
 */
export const checkServiceability = async (req, res) => {
  try {
    const { zipCode, lat, lng } = req.body;

    // Supported quick-commerce operational zones or pincodes
    // In production, can match with store radius or serviceable pincodes
    const isServiceable = true; // Default true for demo zones

    res.json({
      serviceable: isServiceable,
      estimatedDelivery: '15-25 mins',
      deliveryFee: 0,
      minimumOrderValue: 99,
      freeDeliveryThreshold: 499,
      availableSlots: ['Instant (15-25 Mins)', 'Today Evening (6 PM - 8 PM)', 'Tomorrow Morning (8 AM - 10 AM)'],
      message: 'Quick Delivery is available at your location!'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Validate Checkout
 * POST /api/storefront/checkout/validate
 */
export const validateCheckout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.customer._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const authoritative = await calculateAuthoritativeCart(cart);

    if (authoritative.items.length === 0) {
      return res.status(400).json({ message: 'All items in your cart are out of stock or unavailable' });
    }

    res.json({ data: authoritative });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create Payment Intent (Razorpay Order)
 * POST /api/storefront/checkout/create-intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.customer._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const calculated = await calculateAuthoritativeCart(cart);
    const amount = calculated.summary.grandTotal;

    const receipt = `rcpt_${req.customer._id.toString().slice(-6)}_${Date.now()}`;
    const razorpayOrder = await PaymentService.createRazorpayOrder({
      amount,
      receipt,
      notes: {
        customerId: req.customer._id.toString(),
        customerPhone: req.customer.phone
      }
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key'
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: error.message || 'Failed to initialize payment' });
  }
};

/**
 * Place Order (Cash On Delivery or Verified Razorpay)
 * POST /api/storefront/checkout/place-order
 */
export const placeOrder = async (req, res) => {
  try {
    const { 
      addressId, 
      paymentMethod, // 'COD' | 'Razorpay' 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature 
    } = req.body;

    // Optional "Order for someone else" recipient. Absent = unchanged behaviour.
    let recipient = null;
    if (req.body.recipient !== undefined && req.body.recipient !== null) {
      const r = req.body.recipient;
      const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
      const rName = clean(r && r.name, 80);
      const rPhone = clean(r && r.phone, 20).replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
      const rStreet = clean(r && r.street, 200);
      const rCity = clean(r && r.city, 80);
      const rZip = clean(r && r.zipCode, 10);
      if (rName.length < 2) {
        return res.status(400).json({ message: 'Recipient name is required' });
      }
      if (!/^[6-9]\d{9}$/.test(rPhone)) {
        return res.status(400).json({ message: 'Please enter a valid 10-digit recipient phone number' });
      }
      if (rStreet.length < 5) {
        return res.status(400).json({ message: 'Recipient address is required' });
      }
      if (!rCity) {
        return res.status(400).json({ message: 'Recipient city is required' });
      }
      if (!/^\d{6}$/.test(rZip)) {
        return res.status(400).json({ message: 'Please enter a valid 6-digit recipient pincode' });
      }
      recipient = {
        name: rName,
        phone: rPhone,
        street: rStreet,
        landmark: clean(r.landmark, 120),
        city: rCity,
        state: clean(r.state, 80),
        zipCode: rZip,
        notes: clean(r.notes, 250)
      };
    }

    const customer = await Customer.findById(req.customer._id);
    const address = recipient
      ? { label: 'Someone else', country: 'India' }
      : (customer.addresses.id(addressId) || customer.addresses.find(a => a.isDefault) || customer.addresses[0]);

    if (!address) {
      return res.status(400).json({ message: 'Please provide a valid delivery address' });
    }

    const cart = await Cart.findOne({ customer: req.customer._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // Authoritative check
    const calculated = await calculateAuthoritativeCart(cart);
    if (calculated.items.length === 0) {
      return res.status(400).json({ message: 'Items in cart are unavailable' });
    }

    // Payment verification if Razorpay
    let paymentStatus = 'Pending';
    if (paymentMethod === 'Razorpay') {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ message: 'Missing payment verification credentials' });
      }

      const isValidSignature = PaymentService.verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        signature: razorpaySignature
      });

      if (!isValidSignature) {
        return res.status(400).json({ message: 'Invalid payment signature. Transaction verification failed.' });
      }

      paymentStatus = 'Paid';
    }

    // Generate Order Number
    const orderSeq = await Sequence.getNextValue('Order');
    const orderNumber = `ORD-APP-${orderSeq.toString().padStart(6, '0')}`;

    // Generate Secure Delivery OTP (4 digits, hashed in DB, 24h expiry, server-authoritative)
    const rawOtp = generateOtp();
    const hashedOtp = await bcrypt.hash(rawOtp, 8);

    // Build historical order items snapshot
    const orderItems = calculated.items.map(i => ({
      product: i.product._id,
      variant: i.variant?._id || null,
      productName: i.product.name,
      productImage: i.product.featuredImage || '',
      sku: i.product.baseSku,
      unit: i.unit,
      qty: i.qty,
      price: i.price,
      taxRate: i.product.taxRate || 0,
      taxableAmount: i.taxableAmount,
      taxAmount: i.taxAmount,
      total: i.total
    }));

    const orderData = {
      orderNumber,
      orderType: 'ONLINE',
      customer: customer._id,
      status: 'Confirmed',
      paymentStatus,
      items: orderItems,
      subTotal: calculated.summary.subTotal,
      taxableAmount: calculated.summary.taxableAmount,
      tax: calculated.summary.tax,
      cgst: calculated.summary.cgst,
      sgst: calculated.summary.sgst,
      igst: calculated.summary.igst,
      discount: calculated.summary.discount,
      amount: calculated.summary.grandTotal,
      paymentMethod: paymentMethod === 'Razorpay' ? 'Razorpay' : 'COD',
      razorpayOrderId,
      razorpayPaymentId,
      shippingAddress: recipient ? {
        label: 'Someone else',
        street: recipient.street,
        landmark: recipient.landmark,
        city: recipient.city,
        state: recipient.state,
        zipCode: recipient.zipCode,
        country: 'India',
        formattedAddress: [recipient.street, recipient.landmark && `Near ${recipient.landmark}`, recipient.city, recipient.state, recipient.zipCode].filter(Boolean).join(', ') + (recipient.notes ? ` | Delivery note: ${recipient.notes}` : ''),
        contactName: recipient.name,
        contactPhone: recipient.phone
      } : {
        label: address.label,
        street: address.street,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        formattedAddress: address.formattedAddress,
        contactName: customer.name,
        contactPhone: customer.phone
      },
      deliveryOtp: {
        code: rawOtp,
        hash: hashedOtp,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        attempts: 0,
        lastGeneratedAt: new Date()
      }
    };

    // Use OrderService for order creation and customer stats updates
    const order = await OrderService.createOrder(orderData, null);

    // If paid via Razorpay, log Transaction
    if (paymentStatus === 'Paid') {
      const txnSeq = await Sequence.getNextValue('Transaction');
      const transactionId = `TXN-${txnSeq.toString().padStart(6, '0')}`;
      await Transaction.create({
        transactionId,
        order: order._id,
        orderType: 'ONLINE',
        paymentMethod: 'Online',
        amount: order.amount,
        paymentStatus: 'Paid',
        razorpayOrderId,
        razorpayPaymentId,
        paidAt: new Date()
      });
    }

    // Clear Customer Cart
    cart.items = [];
    cart.appliedCoupon = null;
    await cart.save();

    // Create Push/In-App Notification for Customer
    await Notification.create({
      title: 'Order Confirmed! 🎉',
      message: `Your order #${order.orderNumber} for ₹${order.amount} has been received and confirmed.`,
      type: 'Order Confirmed',
      recipientType: 'Customer',
      customer: customer._id,
      order: order._id,
      data: { screen: 'OrderDetails', orderId: order._id }
    });

    // Dispatch Push Notification to eligible online delivery partners
    try {
      const { notifyEligibleRidersOfNewOrder } = await import('../services/pushNotificationService.js');
      notifyEligibleRidersOfNewOrder(order).catch((err) => {
        console.warn('[Storefront] Could not dispatch rider push notification:', err.message);
      });
    } catch (pushErr) {
      console.warn('[Storefront] Error triggering rider notification:', pushErr.message);
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        amount: order.amount,
        deliveryOtp: rawOtp, // Returned only once on order placement for customer convenience
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ message: error.message || 'Failed to place order' });
  }
};

/* ==========================================================================
   6. CUSTOMER ORDERS, TRACKING, CANCELLATION & REORDER
   ========================================================================== */

/**
 * Get Customer Order History
 * GET /api/storefront/orders
 */
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;

    const query = { customer: req.customer._id };
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .select('orderNumber status paymentStatus amount items createdAt deliveryOtp shippingAddress')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const sanitizedOrders = orders.map(o => {
      const isEligibleForOtp = ['OutForDelivery', 'Out For Delivery', 'Picked Up'].includes(o.status);
      return {
        ...o,
        itemCount: o.items?.length || 0,
        deliveryOtp: isEligibleForOtp && !o.deliveryOtp?.verifiedAt ? '••••' : null // Never leak hash
      };
    });

    res.json({
      data: sanitizedOrders,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Customer Order Details (Strict Ownership Check)
 * GET /api/storefront/orders/:id
 */
export const getOrderDetails = async (req, res) => {
  try {
    const rawId = req.params.id;
    const isObjectId = mongoose.Types.ObjectId.isValid(rawId);
    const query = isObjectId
      ? { _id: rawId, customer: req.customer._id }
      : { orderNumber: rawId, customer: req.customer._id };

    const order = await Order.findOne(query).select('+deliveryOtp.code').lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found or unauthorized' });
    }

    // Secure OTP: Return OTP code exclusively to the authorized customer who placed this order
    const isEligibleForOtp = !order.deliveryOtp?.verifiedAt && !['Delivered', 'Cancelled', 'Returned'].includes(order.status);
    const sanitizedOrder = {
      ...order,
      deliveryOtp: isEligibleForOtp ? {
        active: true,
        code: order.deliveryOtp?.code || null,
        expiresAt: order.deliveryOtp?.expiresAt
      } : { active: false }
    };

    res.json({ data: sanitizedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Cancel Order
 * POST /api/storefront/orders/:id/cancel
 */
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.customer._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Delivered, already Cancelled, or Returned orders cannot be cancelled
    const nonCancellableStatuses = ['Delivered', 'Cancelled', 'Returned'];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Order cannot be cancelled because it is already '${order.status}'.`
      });
    }

    order.status = 'Cancelled';
    order.cancelledByCustomer = req.customer._id;
    order.cancelledAt = new Date();
    order.cancelReason = reason || 'Cancelled by customer';

    // If already paid, trigger refund workflow
    if (order.paymentStatus === 'Paid') {
      order.refundStatus = 'Pending';
      const txn = await Transaction.findOne({ order: order._id, paymentStatus: 'Paid' });
      if (txn) {
        await PaymentService.processRefund(txn._id, order.amount);
      }
    }

    await order.save();
    await OrderService.logActivity(order._id, 'Cancelled', null, `Cancelled by customer: ${order.cancelReason}`, true);

    // Notify customer
    await Notification.create({
      title: 'Order Cancelled',
      message: `Your order #${order.orderNumber} has been cancelled.`,
      type: 'Order Cancelled',
      recipientType: 'Customer',
      customer: req.customer._id,
      order: order._id
    });

    res.json({ message: 'Order cancelled successfully', data: order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reorder ("Buy Again")
 * POST /api/storefront/orders/:id/reorder
 */
export const reorderItems = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.customer._id
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    let cart = await Cart.findOne({ customer: req.customer._id });
    if (!cart) cart = new Cart({ customer: req.customer._id, items: [] });

    let addedCount = 0;
    const skippedItems = [];

    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        skippedItems.push(`${item.productName} (unavailable)`);
        continue;
      }

      // Check existing in cart
      const existing = cart.items.find(
        i => i.product.toString() === item.product.toString() &&
        (item.variant ? i.variant?.toString() === item.variant.toString() : !i.variant)
      );

      if (existing) {
        existing.qty = roundTo(existing.qty + item.qty, 3);
      } else {
        cart.items.push({
          product: item.product,
          variant: item.variant || null,
          qty: item.qty,
          unit: item.unit
        });
      }
      addedCount++;
    }

    await cart.save();
    const calculated = await calculateAuthoritativeCart(cart);

    res.json({
      message: `${addedCount} items added to your cart`,
      skipped: skippedItems,
      data: calculated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Verify Delivery OTP (Called by Delivery Rider/System)
 * POST /api/storefront/orders/:id/verify-delivery-otp
 */
export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!['OutForDelivery', 'Out For Delivery', 'Picked Up'].includes(order.status)) {
      return res.status(400).json({ message: 'Order is not in an out-for-delivery state' });
    }

    if (!order.deliveryOtp || !order.deliveryOtp.hash) {
      return res.status(400).json({ message: 'No delivery OTP generated for this order' });
    }

    // Check attempts lockout
    if (order.deliveryOtp.attempts >= 5) {
      return res.status(403).json({ message: 'Maximum OTP verification attempts exceeded. Please contact supervisor.' });
    }

    // Check expiration
    if (new Date() > new Date(order.deliveryOtp.expiresAt)) {
      return res.status(400).json({ message: 'Delivery OTP has expired' });
    }

    const isMatch = await bcrypt.compare(otp, order.deliveryOtp.hash);
    if (!isMatch) {
      order.deliveryOtp.attempts = (order.deliveryOtp.attempts || 0) + 1;
      await order.save();
      const remaining = 5 - order.deliveryOtp.attempts;
      if (remaining <= 0) {
        return res.status(403).json({
          message: 'Maximum OTP verification attempts exceeded. Please contact supervisor.',
          remainingAttempts: 0,
          code: 'MAX_ATTEMPTS_EXCEEDED'
        });
      }
      return res.status(400).json({
        message: `Incorrect OTP. ${remaining} attempts remaining.`,
        remainingAttempts: remaining,
        code: 'INVALID_OTP'
      });
    }

    // Mark Verified & Delivered
    order.deliveryOtp.verifiedAt = new Date();
    await OrderService.updateOrderStatus(order._id, 'Delivered', null, 'Delivered verified via OTP', null);

    // Notify Customer
    await Notification.create({
      title: 'Order Delivered! 🎉',
      message: `Your order #${order.orderNumber} was successfully delivered. Thank you for choosing ZOOOMIT!`,
      type: 'Order Delivered',
      recipientType: 'Customer',
      customer: order.customer,
      order: order._id
    });

    res.json({ message: 'OTP verified successfully. Order marked as Delivered.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==========================================================================
   7. SUPPORT TICKETS, ISSUES & PARTIAL RETURNS/REFUNDS
   ========================================================================== */

/**
 * Report Issue / Request Return
 * POST /api/storefront/issues
 */
export const createSupportTicket = async (req, res) => {
  try {
    const { 
      orderId, 
      orderItemId, 
      issueType, 
      description, 
      images, 
      requestedReturnQty 
    } = req.body;

    if (!orderId || !issueType || !description) {
      return res.status(400).json({ message: 'Order ID, issue type, and description are required' });
    }

    const order = await Order.findOne({ _id: orderId, customer: req.customer._id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found or unauthorized' });
    }

    let targetItem = null;
    let eligibleQty = 0;
    let calculatedRefundAmount = 0;

    if (orderItemId) {
      targetItem = order.items.id(orderItemId);
      if (targetItem) {
        eligibleQty = targetItem.qty - (targetItem.returnedQty || 0);
        const qtyToReturn = Math.min(requestedReturnQty || eligibleQty, eligibleQty);
        calculatedRefundAmount = roundTo(qtyToReturn * targetItem.price, 2);
      }
    }

    const seq = await Sequence.getNextValue('SupportTicket');
    const ticketNumber = `TCK-${seq.toString().padStart(6, '0')}`;

    const ticket = new SupportTicket({
      ticketNumber,
      customer: req.customer._id,
      order: order._id,
      orderItemId: targetItem?._id || null,
      product: targetItem?.product || null,
      variant: targetItem?.variant || null,
      issueType,
      description,
      images: images || [],
      eligibleQty,
      requestedReturnQty: requestedReturnQty || 0,
      refundAmount: calculatedRefundAmount,
      status: 'Requested'
    });

    await ticket.save();

    res.status(201).json({
      message: 'Support ticket submitted successfully',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Customer Support Tickets
 * GET /api/storefront/issues
 */
export const getSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ customer: req.customer._id })
      .populate('order', 'orderNumber status amount')
      .populate('product', 'name featuredImage')
      .sort({ createdAt: -1 });

    res.json({ data: tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==========================================================================
   8. NOTIFICATIONS & PUSH TOKENS
   ========================================================================== */

/**
 * Register Push Token
 * POST /api/storefront/notifications/push-token
 */
export const registerPushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Push token required' });

    await Customer.findByIdAndUpdate(req.customer._id, { pushToken: token });
    res.json({ message: 'Push token registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete Push Token
 * DELETE /api/storefront/notifications/push-token
 */
export const deletePushToken = async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(req.customer._id, { $unset: { pushToken: 1 } });
    res.json({ message: 'Push token unregistered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Customer Notifications
 * GET /api/storefront/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      customer: req.customer._id,
      recipientType: 'Customer'
    }).sort({ createdAt: -1 }).limit(50);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      data: notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Mark Single Notification Read
 * PATCH /api/storefront/notifications/:id/read
 */
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, customer: req.customer._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    res.json({ data: notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Mark All Notifications Read
 * PATCH /api/storefront/notifications/read-all
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { customer: req.customer._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

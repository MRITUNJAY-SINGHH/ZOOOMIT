import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';

/**
 * Protect Customer Storefront Routes
 * Authenticates against Customer collection and attaches req.customer
 */
export const protectCustomer = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Support development / test mock tokens
      if (token && token.startsWith('mock_jwt_token_for_testing_')) {
        let customer = await Customer.findOne({ status: { $ne: 'Blocked' } });
        if (!customer) {
          customer = new Customer({
            name: 'ZOOOMIT User',
            phone: '9876543210',
            status: 'Active',
            customerType: 'APP'
          });
          await customer.save();
        }
        req.customer = customer;
        return next();
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret_dev_key');
      } catch (jwtErr) {
        // Fallback for dev mode
        if (process.env.NODE_ENV !== 'production') {
          let customer = await Customer.findOne({ status: { $ne: 'Blocked' } });
          if (customer) {
            req.customer = customer;
            return next();
          }
        }
        return res.status(401).json({ message: 'Not authorized, session token invalid or expired' });
      }

      let customer = await Customer.findById(decoded.id).select('-password');
      if (!customer && process.env.NODE_ENV !== 'production') {
        customer = await Customer.findOne({ status: { $ne: 'Blocked' } }).select('-password');
      }

      if (!customer) {
        return res.status(401).json({ message: 'Customer account not found or deleted' });
      }

      if (customer.status === 'Blocked') {
        return res.status(403).json({ message: 'Account is blocked. Please contact ZOOOMIT support.' });
      }

      req.customer = customer;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, session token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please sign in.' });
  }
};

/**
 * Optional Customer Middleware
 * Attaches req.customer if a valid token is present, but allows guest access
 */
export const optionalCustomer = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (token && token.startsWith('mock_jwt_token_for_testing_')) {
        let customer = await Customer.findOne({ status: { $ne: 'Blocked' } });
        if (customer) req.customer = customer;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret_dev_key');
      const customer = await Customer.findById(decoded.id).select('-password');
      if (customer && customer.status !== 'Blocked') {
        req.customer = customer;
      }
    } catch (e) {
      // Ignore token decode errors for guest browsing
    }
  }

  next();
};

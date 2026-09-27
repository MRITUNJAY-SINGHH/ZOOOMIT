import express from 'express';
import {
  sendCustomerOtp,
  verifyCustomerOtp,
  registerCustomer,
  loginCustomer,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getBanners,
  getCategories,
  getProducts,
  getProductDetails,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  checkServiceability,
  validateCheckout,
  createPaymentIntent,
  placeOrder,
  getOrders,
  getOrderDetails,
  cancelOrder,
  reorderItems,
  verifyDeliveryOtp,
  createSupportTicket,
  getSupportTickets,
  registerPushToken,
  deletePushToken,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/storefrontController.js';
import { protectCustomer } from '../middleware/storefrontAuthMiddleware.js';

const router = express.Router();

/* --- Auth & Profile --- */
router.post('/auth/send-otp', sendCustomerOtp);
router.post('/auth/verify-otp', verifyCustomerOtp);
router.post('/auth/register', registerCustomer);
router.post('/auth/login', loginCustomer);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.get('/auth/profile', protectCustomer, getProfile);
router.put('/auth/profile', protectCustomer, updateProfile);

/* --- Address Management --- */
router.get('/addresses', protectCustomer, getAddresses);
router.post('/addresses', protectCustomer, addAddress);
router.put('/addresses/:id', protectCustomer, updateAddress);
router.delete('/addresses/:id', protectCustomer, deleteAddress);
router.patch('/addresses/:id/default', protectCustomer, setDefaultAddress);

/* --- Catalog & Discovery (Public) --- */
router.get('/banners', getBanners);
router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/:idOrSlug', getProductDetails);

/* --- Persistent Cart CRUD --- */
router.get('/cart', protectCustomer, getCart);
router.post('/cart/items', protectCustomer, addToCart);
router.patch('/cart/items/:id', protectCustomer, updateCartItem);
router.delete('/cart/items/:id', protectCustomer, removeCartItem);
router.delete('/cart', protectCustomer, clearCart);
router.post('/cart/coupon', protectCustomer, applyCoupon);
router.delete('/cart/coupon', protectCustomer, removeCoupon);

/* --- Serviceability & Checkout --- */
router.post('/checkout/serviceability', checkServiceability);
router.post('/checkout/validate', protectCustomer, validateCheckout);
router.post('/checkout/create-intent', protectCustomer, createPaymentIntent);
router.post('/checkout/place-order', protectCustomer, placeOrder);

/* --- Customer Orders, Tracking, Reorder & OTP --- */
router.get('/orders', protectCustomer, getOrders);
router.get('/orders/:id', protectCustomer, getOrderDetails);
router.post('/orders/:id/cancel', protectCustomer, cancelOrder);
router.post('/orders/:id/reorder', protectCustomer, reorderItems);
router.post('/orders/:id/verify-delivery-otp', verifyDeliveryOtp);

/* --- Support Tickets, Issues & Returns --- */
router.post('/issues', protectCustomer, createSupportTicket);
router.get('/issues', protectCustomer, getSupportTickets);

/* --- Push Tokens & Notifications --- */
router.post('/notifications/push-token', protectCustomer, registerPushToken);
router.delete('/notifications/push-token', protectCustomer, deletePushToken);
router.get('/notifications', protectCustomer, getNotifications);
router.patch('/notifications/:id/read', protectCustomer, markNotificationRead);
router.patch('/notifications/read-all', protectCustomer, markAllNotificationsRead);

export default router;

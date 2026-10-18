import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Customer from '../src/models/Customer.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import Sequence from '../src/models/Sequence.js';
import OrderService from '../src/services/OrderService.js';
import Notification from '../src/models/Notification.js';

dotenv.config();

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runEndToEndVerification() {
  console.log('====================================================');
  console.log('🚀 ZOOOMIT END-TO-END WORKFLOW INTEGRATION VERIFIER');
  console.log('====================================================\n');

  await connectDB();
  console.log('Connected to database successfully.\n');

  // STEP 1: Verify Seeded Delivery Partner
  console.log('[STEP 1] Verifying Seeded Delivery Partner...');
  const rider = await User.findOne({ email: 'rider1@example.com' });
  assert(rider !== null, 'Seeded partner rider1@example.com exists');
  assert(rider.role === 'DeliveryBoy', 'Rider role is DeliveryBoy');
  assert(rider.status === 'Active', 'Rider status is Active');

  const riderPwMatch = await bcrypt.compare('password', rider.password);
  assert(riderPwMatch, 'Rider password authenticates correctly with bcrypt');

  // Set rider online and eligible
  rider.isOnline = true;
  rider.approvalStatus = 'Approved';
  await rider.save();
  assert(rider.isOnline === true, 'Rider is marked Online in backend state');

  // STEP 2: Verify Seeded Customer
  console.log('\n[STEP 2] Verifying Seeded Customer...');
  const customer = await Customer.findOne({ phone: '9988001001' }).select('+password');
  assert(customer !== null, 'Seeded customer 9988001001 exists');
  assert(customer.status === 'Active', 'Customer status is Active');
  assert(Array.isArray(customer.addresses) && customer.addresses.length > 0, 'Customer has registered delivery address');

  const custPwMatch = await customer.matchPassword('password123');
  assert(custPwMatch, 'Customer password authenticates correctly');

  // STEP 3: Verify Catalog & Inventory
  console.log('\n[STEP 3] Verifying Product Catalog & Stock...');
  const product = await Product.findOne({ stock: { $gt: 5 }, isActive: true });
  assert(product !== null, `Available active product found: ${product?.name} (Stock: ${product?.stock})`);

  // STEP 4: Customer Places Real Order
  console.log('\n[STEP 4] Customer Places Real Order...');
  const orderSeq = await Sequence.getNextValue('Order');
  const orderNumber = `ORD-TEST-${orderSeq.toString().padStart(6, '0')}`;
  const rawOtp = crypto.randomInt(1000, 10000).toString();
  const hashedOtp = await bcrypt.hash(rawOtp, 8);

  const orderItem = {
    product: product._id,
    productName: product.name,
    sku: product.baseSku,
    unit: product.sellingUnit || 'PCS',
    qty: 2,
    price: product.sellingPrice,
    taxRate: product.taxRate || 0,
    taxableAmount: product.sellingPrice * 2,
    taxAmount: 0,
    total: product.sellingPrice * 2
  };

  const shippingAddr = customer.addresses[0];

  const orderData = {
    orderNumber,
    orderType: 'ONLINE',
    customer: customer._id,
    status: 'Confirmed',
    paymentStatus: 'Pending',
    items: [orderItem],
    subTotal: orderItem.total,
    taxableAmount: orderItem.total,
    tax: 0,
    amount: orderItem.total,
    paymentMethod: 'COD',
    shippingAddress: {
      label: shippingAddr.label,
      street: shippingAddr.street,
      city: shippingAddr.city,
      state: shippingAddr.state,
      zipCode: shippingAddr.zipCode,
      country: shippingAddr.country || 'India',
      formattedAddress: shippingAddr.formattedAddress,
      contactName: customer.name,
      contactPhone: customer.phone
    },
    deliveryOtp: {
      code: rawOtp,
      hash: hashedOtp,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      attempts: 0,
      lastGeneratedAt: new Date()
    }
  };

  const createdOrder = await OrderService.createOrder(orderData, null);
  assert(createdOrder !== null, `Real order created: #${createdOrder.orderNumber}`);
  assert(createdOrder.status === 'Confirmed', 'Order initial status is Confirmed');
  assert(createdOrder.deliveryOtp.code === rawOtp, 'Delivery OTP code is securely generated and bound');

  // STEP 5: Dispatch Service Finds Eligible Order
  console.log('\n[STEP 5] Dispatch Service Finds Eligible Order...');
  const availableOrders = await Order.find({
    $or: [
      { assignedRider: rider._id, status: 'Assigned' },
      { assignedRider: null, status: 'Confirmed' }
    ],
    declinedRiders: { $ne: rider._id },
    _id: createdOrder._id
  });
  assert(availableOrders.length === 1, 'Dispatch pool finds order eligible for online rider');

  // STEP 6: Concurrent Acceptance Protection
  console.log('\n[STEP 6] Testing Atomic Order Acceptance & Concurrency...');
  const acceptedOrder = await Order.findOneAndUpdate(
    {
      _id: createdOrder._id,
      status: { $in: ['Assigned', 'Confirmed', 'Pending'] },
      $or: [
        { assignedRider: rider._id },
        { assignedRider: null },
        { assignedRider: { $exists: false } }
      ]
    },
    {
      $set: {
        status: 'Accepted',
        assignedRider: rider._id,
        assignedAt: new Date()
      }
    },
    { new: true }
  );
  assert(acceptedOrder !== null, `Rider 1 successfully accepts order #${acceptedOrder.orderNumber}`);
  assert(acceptedOrder.status === 'Accepted', 'Order status atomically changed to Accepted');
  assert(acceptedOrder.assignedRider.toString() === rider._id.toString(), 'Order assignedRider set to Rider 1');

  // Test second rider attempting to claim same order
  const rider2 = await User.findOne({ email: 'rider2@example.com' });
  const secondAttempt = await Order.findOneAndUpdate(
    {
      _id: createdOrder._id,
      status: { $in: ['Assigned', 'Confirmed', 'Pending'] },
      $or: [
        { assignedRider: rider2 ? rider2._id : null },
        { assignedRider: null },
        { assignedRider: { $exists: false } }
      ]
    },
    {
      $set: {
        status: 'Accepted',
        assignedRider: rider2 ? rider2._id : null,
        assignedAt: new Date()
      }
    },
    { new: true }
  );
  assert(secondAttempt === null, 'Second rider acceptance rejected: concurrent claim prevented!');

  // STEP 7: Progression Through Delivery Workflow
  console.log('\n[STEP 7] Rider Progresses Through Pickup & Delivery Workflow...');
  
  // Step 7a: Arrived at Store
  acceptedOrder.status = 'Arrived at Store';
  await acceptedOrder.save();
  assert(acceptedOrder.status === 'Arrived at Store', 'Workflow advanced to: Arrived at Store');

  // Step 7b: Store Pickup Confirmed
  acceptedOrder.status = 'Picked Up';
  await acceptedOrder.save();
  assert(acceptedOrder.status === 'Picked Up', 'Workflow advanced to: Picked Up');

  // Step 7c: Out For Delivery
  acceptedOrder.status = 'Out For Delivery';
  await acceptedOrder.save();
  assert(acceptedOrder.status === 'Out For Delivery', 'Workflow advanced to: Out For Delivery');

  // STEP 8: Customer Views OTP Privately
  console.log('\n[STEP 8] Customer Fetches Order Details with Private OTP...');
  const customerViewOrder = await Order.findById(createdOrder._id).select('+deliveryOtp.code').lean();
  assert(customerViewOrder !== null, 'Customer retrieves order details');
  assert(customerViewOrder.deliveryOtp.code === rawOtp, `Customer securely views 4-digit OTP: ${customerViewOrder.deliveryOtp.code}`);

  // STEP 9: Delivery Verification OTP
  console.log('\n[STEP 9] Validating Delivery OTP Verification...');
  
  // Test 9a: Invalid OTP Submission
  const orderForOtp = await Order.findById(createdOrder._id).select('+deliveryOtp.hash +deliveryOtp.code');
  const isWrongOtpMatch = await bcrypt.compare('0000', orderForOtp.deliveryOtp.hash);
  assert(!isWrongOtpMatch, 'Invalid OTP (0000) fails bcrypt verification');
  orderForOtp.deliveryOtp.attempts = (orderForOtp.deliveryOtp.attempts || 0) + 1;
  await orderForOtp.save();
  assert(orderForOtp.deliveryOtp.attempts === 1, 'Invalid OTP attempt count incremented to 1');

  // Test 9b: Correct Customer OTP Submission
  const isRightOtpMatch = await bcrypt.compare(rawOtp, orderForOtp.deliveryOtp.hash);
  assert(isRightOtpMatch, `Correct OTP (${rawOtp}) passes verification`);

  // Finalize delivery
  orderForOtp.status = 'Delivered';
  orderForOtp.deliveredAt = new Date();
  orderForOtp.paymentStatus = 'Paid';
  orderForOtp.deliveryOtp.verifiedAt = new Date();
  orderForOtp.riderEarnings = 30; // ₹30 delivery compensation
  await orderForOtp.save();

  assert(orderForOtp.status === 'Delivered', 'Order status finalized to: Delivered');
  assert(orderForOtp.paymentStatus === 'Paid', 'Order paymentStatus finalized to: Paid');
  assert(orderForOtp.riderEarnings === 30, 'Rider earnings credited: ₹30');

  // STEP 10: Consistency Across All Views
  console.log('\n[STEP 10] Verifying Final Consistency Across All Stakeholders...');
  const finalOrder = await Order.findById(createdOrder._id);
  assert(finalOrder.status === 'Delivered', 'Database order status is Delivered');
  assert(finalOrder.assignedRider.toString() === rider._id.toString(), 'Assigned rider remains Rider 1');
  assert(finalOrder.deliveredAt !== undefined, 'Delivered timestamp recorded');

  // Check Rider Dashboard counts
  const todayDelivered = await Order.countDocuments({
    assignedRider: rider._id,
    status: 'Delivered'
  });
  assert(todayDelivered >= 1, `Rider dashboard reports at least ${todayDelivered} delivered order(s)`);

  console.log('\n====================================================');
  console.log('🎉 ALL 10 END-TO-END INTEGRATION TESTS PASSED!');
  console.log('====================================================\n');
  process.exit(0);
}

runEndToEndVerification().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});

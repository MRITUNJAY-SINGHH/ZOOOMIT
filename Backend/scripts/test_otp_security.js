import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Customer from '../src/models/Customer.js';
import Order from '../src/models/Order.js';
import Sequence from '../src/models/Sequence.js';
import { verifyOtpAndDeliver, regenerateDeliveryOtp, getRiderOrderDetails } from '../src/controllers/deliveryController.js';
import { getOrderDetails } from '../src/controllers/storefrontController.js';
import { notifyEligibleRidersOfNewOrder } from '../src/services/pushNotificationService.js';

dotenv.config();

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

// Mock express response object
function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function runOtpSecurityTests() {
  console.log('====================================================');
  console.log('🔒 ZOOOMIT OTP SECURITY & VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  await connectDB();
  console.log('Database connected.\n');

  const rider = await User.findOne({ email: 'rider1@example.com' });
  const customer = await Customer.findOne({ phone: '9988001001' });
  assert(rider !== null, 'Found rider1@example.com');
  assert(customer !== null, 'Found customer 9988001001');

  // TEST 1: Cryptographically Secure 4-Digit Range Validation
  console.log('\n[TEST 1] crypto.randomInt(1000, 10000) 4-digit distribution...');
  for (let i = 0; i < 500; i++) {
    const otp = crypto.randomInt(1000, 10000).toString();
    if (otp.length !== 4 || isNaN(Number(otp)) || Number(otp) < 1000 || Number(otp) > 9999) {
      assert(false, `Generated invalid OTP: ${otp}`);
    }
  }
  assert(true, '500 iterations of crypto.randomInt() generated strictly valid 4-digit numeric codes [1000-9999]');

  // Create a base test order
  const orderSeq = await Sequence.getNextValue('Order');
  const orderNumber = `ORD-OTP-TEST-${orderSeq.toString().padStart(6, '0')}`;
  const rawOtp = crypto.randomInt(1000, 10000).toString();
  const hashedOtp = await bcrypt.hash(rawOtp, 10);

  const testOrder = new Order({
    orderNumber,
    orderType: 'ONLINE',
    customer: customer._id,
    assignedRider: rider._id,
    status: 'Out For Delivery',
    paymentStatus: 'Pending',
    items: [{
      productName: 'Kapiva Apple Cider Vinegar',
      qty: 1,
      price: 250,
      total: 250
    }],
    subTotal: 250,
    amount: 250,
    shippingAddress: {
      contactName: customer.name,
      contactPhone: customer.phone,
      street: 'Flat 402, Lotus Court',
      city: 'Bengaluru'
    },
    deliveryOtp: {
      code: rawOtp,
      hash: hashedOtp,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      attempts: 0,
      lastGeneratedAt: new Date()
    }
  });
  await testOrder.save();
  assert(true, `Created test order #${orderNumber} with hashed OTP in database`);

  // TEST 2: Customer-Only Disclosure & Rider Confidentiality
  console.log('\n[TEST 2] Verifying Customer-Only OTP Disclosure & Zero Rider Leakage...');
  
  // 2a. Customer requests order details
  const customerReq = { params: { id: testOrder._id }, customer: { _id: customer._id } };
  const customerRes = createMockRes();
  await getOrderDetails(customerReq, customerRes);
  assert(customerRes.statusCode === 200, 'Customer order details returns HTTP 200');
  assert(customerRes.data.data.deliveryOtp?.code === rawOtp, 'Authorized customer receives correct 4-digit plaintext OTP');

  // 2b. Rider requests order details
  const riderReq = { params: { id: testOrder._id }, user: { _id: rider._id } };
  const riderRes = createMockRes();
  await getRiderOrderDetails(riderReq, riderRes);
  assert(riderRes.statusCode === 200, 'Rider order details returns HTTP 200');
  assert(riderRes.data.order.deliveryOtp === undefined, 'Rider order response COMPLETELY EXCLUDES deliveryOtp (zero leak)');
  assert(!JSON.stringify(riderRes.data).includes(rawOtp), 'Plaintext OTP string does NOT appear anywhere in rider payload');

  // 2c. Push notification payload check
  const pushResult = await notifyEligibleRidersOfNewOrder(testOrder);
  const pushString = JSON.stringify(pushResult);
  assert(!pushString.includes(rawOtp), 'Plaintext OTP does NOT appear in rider push notification payloads');

  // TEST 3: Invalid OTP Rejection & Attempt Limits
  console.log('\n[TEST 3] Testing Invalid OTP Rejection & Cooldown/Attempt Counter...');
  for (let attempt = 1; attempt <= 4; attempt++) {
    const wrongRes = createMockRes();
    await verifyOtpAndDeliver({ params: { id: testOrder._id }, body: { otp: '0000' }, user: { _id: rider._id } }, wrongRes);
    assert(wrongRes.statusCode === 400, `Attempt ${attempt}: Incorrect OTP returned HTTP 400`);
    assert(wrongRes.data.code === 'INVALID_OTP', `Attempt ${attempt}: code === 'INVALID_OTP'`);
    assert(wrongRes.data.remainingAttempts === 5 - attempt, `Attempt ${attempt}: Remaining attempts accurately reported as ${5 - attempt}`);
  }

  // 5th failed attempt triggers lockout
  const lockoutRes = createMockRes();
  await verifyOtpAndDeliver({ params: { id: testOrder._id }, body: { otp: '0000' }, user: { _id: rider._id } }, lockoutRes);
  assert(lockoutRes.statusCode === 403, '5th failed attempt returns HTTP 403 Forbidden (Lockout)');
  assert(lockoutRes.data.code === 'MAX_ATTEMPTS_EXCEEDED', 'Returns MAX_ATTEMPTS_EXCEEDED');

  // Further attempts (even with correct OTP) must be blocked while attempts >= 5
  const blockedValidRes = createMockRes();
  await verifyOtpAndDeliver({ params: { id: testOrder._id }, body: { otp: rawOtp }, user: { _id: rider._id } }, blockedValidRes);
  assert(blockedValidRes.statusCode === 403, 'Correct OTP blocked after maximum attempts exceeded');

  // TEST 4: Expired OTP Rejection
  console.log('\n[TEST 4] Testing Expired OTP Rejection...');
  const expiredOrder = new Order({
    orderNumber: `ORD-EXP-${Date.now()}`,
    orderType: 'ONLINE',
    customer: customer._id,
    assignedRider: rider._id,
    status: 'Out For Delivery',
    subTotal: 150,
    amount: 150,
    deliveryOtp: {
      code: '7788',
      hash: await bcrypt.hash('7788', 10),
      expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
      attempts: 0
    }
  });
  await expiredOrder.save();

  const expiredRes = createMockRes();
  await verifyOtpAndDeliver({ params: { id: expiredOrder._id }, body: { otp: '7788' }, user: { _id: rider._id } }, expiredRes);
  assert(expiredRes.statusCode === 400, 'Expired OTP returned HTTP 400');
  assert(expiredRes.data.code === 'OTP_EXPIRED', 'Response code is OTP_EXPIRED');

  // TEST 5: Regenerate OTP & 30-Second Cooldown Enforcement
  console.log('\n[TEST 5] Testing Regenerate OTP & 30s Cooldown...');
  // Fresh order for regeneration test
  const regenOrder = new Order({
    orderNumber: `ORD-REGEN-${Date.now()}`,
    orderType: 'ONLINE',
    customer: customer._id,
    assignedRider: rider._id,
    status: 'Out For Delivery',
    subTotal: 200,
    amount: 200,
    deliveryOtp: {
      code: '1111',
      hash: await bcrypt.hash('1111', 10),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      attempts: 0,
      lastGeneratedAt: new Date(Date.now() - 60000) // 60s ago (outside cooldown)
    }
  });
  await regenOrder.save();

  // First regen call should succeed
  const regenRes1 = createMockRes();
  await regenerateDeliveryOtp({ params: { id: regenOrder._id }, user: { _id: rider._id } }, regenRes1);
  assert(regenRes1.statusCode === 200, 'First OTP regeneration succeeds');
  assert(regenRes1.data.success === true, 'Regeneration returns success message');
  assert(!regenRes1.data.code && !regenRes1.data.otp && !regenRes1.data.deliveryOtp, 'New OTP is NOT leaked to rider in regenerate response');

  // Immediate second call should be rate limited (429)
  const regenRes2 = createMockRes();
  await regenerateDeliveryOtp({ params: { id: regenOrder._id }, user: { _id: rider._id } }, regenRes2);
  assert(regenRes2.statusCode === 429, 'Immediate second regeneration rejected with HTTP 429 (Cooldown active)');

  // TEST 6: Valid OTP Verification & Idempotent Delivery Completion
  console.log('\n[TEST 6] Testing Valid OTP Verification & Idempotency...');
  const validOrder = new Order({
    orderNumber: `ORD-VALID-${Date.now()}`,
    orderType: 'ONLINE',
    customer: customer._id,
    assignedRider: rider._id,
    status: 'Out For Delivery',
    subTotal: 350,
    amount: 350,
    deliveryOtp: {
      code: '8899',
      hash: await bcrypt.hash('8899', 10),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      attempts: 0
    }
  });
  await validOrder.save();

  const validRes = createMockRes();
  await verifyOtpAndDeliver({ params: { id: validOrder._id }, body: { otp: '8899' }, user: { _id: rider._id } }, validRes);
  assert(validRes.statusCode === 200, 'Valid OTP verifies successfully with HTTP 200');
  assert(validRes.data.order.status === 'Delivered', 'Order marked Delivered');
  assert(validRes.data.riderEarnings === 30, 'Rider credited ₹30 delivery earnings');

  // TEST 7: Repeated / Replayed OTP Submission
  console.log('\n[TEST 7] Testing Replayed OTP on Already-Delivered Order...');
  const replayRes = createMockRes();
  await verifyOtpAndDeliver({ params: { id: validOrder._id }, body: { otp: '8899' }, user: { _id: rider._id } }, replayRes);
  assert(replayRes.statusCode === 400, 'Replayed OTP on already-delivered order rejected with HTTP 400');

  // TEST 8: Concurrent OTP Submission Race Condition Protection
  console.log('\n[TEST 8] Testing Concurrent OTP Submissions (Simultaneous Requests)...');
  const raceOrder = new Order({
    orderNumber: `ORD-RACE-${Date.now()}`,
    orderType: 'ONLINE',
    customer: customer._id,
    assignedRider: rider._id,
    status: 'Out For Delivery',
    subTotal: 400,
    amount: 400,
    deliveryOtp: {
      code: '5566',
      hash: await bcrypt.hash('5566', 10),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      attempts: 0
    }
  });
  await raceOrder.save();

  const req1 = { params: { id: raceOrder._id }, body: { otp: '5566' }, user: { _id: rider._id } };
  const req2 = { params: { id: raceOrder._id }, body: { otp: '5566' }, user: { _id: rider._id } };
  const res1 = createMockRes();
  const res2 = createMockRes();

  await Promise.all([
    verifyOtpAndDeliver(req1, res1),
    verifyOtpAndDeliver(req2, res2)
  ]);

  const updatedRaceOrder = await Order.findById(raceOrder._id);
  assert(updatedRaceOrder.status === 'Delivered', 'Concurrently verified order is Delivered');
  assert(updatedRaceOrder.riderEarnings === 30, 'Rider earnings locked exactly once (no duplicate credit)');

  console.log('\n====================================================');
  console.log('🎉 ALL OTP SECURITY TESTS COMPLETED & PASSED (8/8)!');
  console.log('====================================================\n');
  process.exit(0);
}

runOtpSecurityTests().catch((err) => {
  console.error('Fatal Test Failure:', err);
  process.exit(1);
});

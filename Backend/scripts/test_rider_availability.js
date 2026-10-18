import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Customer from '../src/models/Customer.js';
import Order from '../src/models/Order.js';
import { authUser } from '../src/controllers/authController.js';
import {
  getDeliveryProfile,
  toggleOnline,
  updatePushToken,
  getDashboardStats,
  getAvailableOrders,
  acceptOrder
} from '../src/controllers/deliveryController.js';

dotenv.config();

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

function createMockRes() {
  return {
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
}

async function runRiderAvailabilityTestSuite() {
  console.log('================================================================');
  console.log('🛵 ZOOOMIT RIDER AVAILABILITY & PERSISTENCE REGRESSION TEST SUITE');
  console.log('================================================================\n');

  await connectDB();
  console.log('MongoDB connection established.\n');

  const testEmail = 'rider_reg_test@example.com';
  const testPassword = 'password123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testPassword, salt);

  // Clean up any existing test rider
  await User.deleteOne({ email: testEmail });

  // --------------------------------------------------------------------------
  // TEST 1: New rider follows documented default availability (false)
  // --------------------------------------------------------------------------
  console.log('[TEST 1] New rider follows documented default availability...');
  const newRider = await User.create({
    name: 'Availability Test Rider',
    email: testEmail,
    password: testPassword,
    phone: '9876543210',
    role: 'DeliveryBoy',
    status: 'Active'
  });

  assert(newRider.isOnline === false, 'New rider defaults to isOnline: false in MongoDB schema');

  // Verify getDeliveryProfile returns false for new rider
  const req1 = { user: newRider };
  const res1 = createMockRes();
  await getDeliveryProfile(req1, res1);
  assert(res1.data.isOnline === false, 'getDeliveryProfile returns false for unconfigured rider');

  // --------------------------------------------------------------------------
  // TEST 2: Rider switches Online and status persists in MongoDB
  // --------------------------------------------------------------------------
  console.log('\n[TEST 2] Rider switches Online and status persists in MongoDB...');
  const req2 = { user: newRider, body: { isOnline: true } };
  const res2 = createMockRes();
  await toggleOnline(req2, res2);
  assert(res2.statusCode === 200, 'toggleOnline returns HTTP 200');
  assert(res2.data.isOnline === true, 'toggleOnline returns isOnline: true');

  const freshDbRider = await User.findById(newRider._id);
  assert(freshDbRider.isOnline === true, 'MongoDB document explicitly persisted isOnline: true');

  // --------------------------------------------------------------------------
  // TEST 3: Online status survives logout and login on same phone
  // --------------------------------------------------------------------------
  console.log('\n[TEST 3] Online status survives logout and login on the same phone...');
  // Simulate logout: Mobile unregisters device token, authStorage cleared, NO toggleOnline called
  const deviceTokenA = 'ExponentPushToken[device_phone_A_token]';
  // Register token A
  const reqRegA = { user: freshDbRider, body: { pushToken: deviceTokenA } };
  const resRegA = createMockRes();
  await updatePushToken(reqRegA, resRegA);

  // Logout phone A: unregister device token only
  const reqLogoutA = { user: freshDbRider, body: { pushToken: deviceTokenA, unregister: true } };
  const resLogoutA = createMockRes();
  await updatePushToken(reqLogoutA, resLogoutA);

  // Check DB: isOnline must STILL be true
  const riderAfterLogout = await User.findById(newRider._id);
  assert(riderAfterLogout.isOnline === true, 'Logout did NOT mutate isOnline in MongoDB');

  // Relogin on same phone
  const reqLoginSame = { body: { email: testEmail, password: testPassword } };
  const resLoginSame = createMockRes();
  await authUser(reqLoginSame, resLoginSame);
  assert(resLoginSame.statusCode === 200, 'Login succeeded');
  assert(resLoginSame.data.isOnline === true, 'Login response returns persisted isOnline: true');

  // --------------------------------------------------------------------------
  // TEST 4: Online status survives login on a second phone
  // --------------------------------------------------------------------------
  console.log('\n[TEST 4] Online status survives login on a second phone...');
  const deviceTokenB = 'ExponentPushToken[device_phone_B_token]';
  const reqLoginPhone2 = { body: { email: testEmail, password: testPassword } };
  const resLoginPhone2 = createMockRes();
  await authUser(reqLoginPhone2, resLoginPhone2);
  assert(resLoginPhone2.data.isOnline === true, 'Second phone login response sees isOnline: true');

  // Register device B push token
  const reqRegB = { user: riderAfterLogout, body: { pushToken: deviceTokenB } };
  const resRegB = createMockRes();
  await updatePushToken(reqRegB, resRegB);

  const riderPhone2ProfileReq = { user: riderAfterLogout };
  const riderPhone2ProfileRes = createMockRes();
  await getDeliveryProfile(riderPhone2ProfileReq, riderPhone2ProfileRes);
  assert(riderPhone2ProfileRes.data.isOnline === true, 'Phone 2 fetches profile with isOnline: true');

  // --------------------------------------------------------------------------
  // TEST 5: Rider switches Offline and that state survives logout and login
  // --------------------------------------------------------------------------
  console.log('\n[TEST 5] Rider switches Offline and state survives logout and login...');
  const reqToggleOff = { user: riderAfterLogout, body: { isOnline: false } };
  const resToggleOff = createMockRes();
  await toggleOnline(reqToggleOff, resToggleOff);
  assert(resToggleOff.data.isOnline === false, 'toggleOnline returned isOnline: false');

  const dbRiderOffline = await User.findById(newRider._id);
  assert(dbRiderOffline.isOnline === false, 'Persisted isOnline: false in MongoDB');

  // Logout
  const reqLogoutB = { user: dbRiderOffline, body: { pushToken: deviceTokenB, unregister: true } };
  const resLogoutB = createMockRes();
  await updatePushToken(reqLogoutB, resLogoutB);

  // Relogin
  const reqReloginOffline = { body: { email: testEmail, password: testPassword } };
  const resReloginOffline = createMockRes();
  await authUser(reqReloginOffline, resReloginOffline);
  assert(resReloginOffline.data.isOnline === false, 'Login response preserves isOnline: false (did NOT turn Online)');

  // --------------------------------------------------------------------------
  // TEST 6: Second device correctly reads Offline
  // --------------------------------------------------------------------------
  console.log('\n[TEST 6] Second device correctly reads Offline...');
  const reqProfileDevice2 = { user: dbRiderOffline };
  const resProfileDevice2 = createMockRes();
  await getDeliveryProfile(reqProfileDevice2, resProfileDevice2);
  assert(resProfileDevice2.data.isOnline === false, 'Device 2 reads authoritative isOnline: false from backend');

  // --------------------------------------------------------------------------
  // TEST 7: Changing availability on one device synchronizes to the other via dashboard
  // --------------------------------------------------------------------------
  console.log('\n[TEST 7] Changing availability on one device synchronizes to the other...');
  // Device 1 turns Online
  const reqDev1On = { user: dbRiderOffline, body: { isOnline: true } };
  const resDev1On = createMockRes();
  await toggleOnline(reqDev1On, resDev1On);

  // Device 2 polls dashboard
  const userDev2 = await User.findById(newRider._id);
  const reqDev2Dash = { user: userDev2 };
  const resDev2Dash = createMockRes();
  await getDashboardStats(reqDev2Dash, resDev2Dash);
  assert(resDev2Dash.data.isOnline === true, 'Device 2 dashboard receives updated isOnline: true');

  // --------------------------------------------------------------------------
  // TEST 8: Login and logout handlers do not mutate availability
  // --------------------------------------------------------------------------
  console.log('\n[TEST 8] Login and logout handlers do not mutate availability...');
  const preStatus = (await User.findById(newRider._id)).isOnline;
  // Execute login
  await authUser({ body: { email: testEmail, password: testPassword } }, createMockRes());
  assert((await User.findById(newRider._id)).isOnline === preStatus, 'Login did not mutate availability');

  // Execute logout token cleanup
  await updatePushToken({ user: userDev2, body: { pushToken: deviceTokenA, unregister: true } }, createMockRes());
  assert((await User.findById(newRider._id)).isOnline === preStatus, 'Logout token cleanup did not mutate availability');

  // --------------------------------------------------------------------------
  // TEST 9: Push-token registration and token deletion do not mutate availability
  // --------------------------------------------------------------------------
  console.log('\n[TEST 9] Push-token registration and token deletion do not mutate availability...');
  const tempToken = 'ExponentPushToken[test_temp_token_xyz]';
  await updatePushToken({ user: userDev2, body: { pushToken: tempToken } }, createMockRes());
  assert((await User.findById(newRider._id)).isOnline === preStatus, 'Token registration did not mutate availability');

  await updatePushToken({ user: userDev2, body: { pushToken: tempToken, unregister: true } }, createMockRes());
  assert((await User.findById(newRider._id)).isOnline === preStatus, 'Token deletion did not mutate availability');

  // --------------------------------------------------------------------------
  // TEST 10: Multi-device push token isolation (logout on phone 1 keeps phone 2)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 10] Multi-device push token isolation...');
  const phone1Token = 'ExponentPushToken[phone_1_unique_token]';
  const phone2Token = 'ExponentPushToken[phone_2_unique_token]';

  // Register phone 1
  await updatePushToken({ user: userDev2, body: { pushToken: phone1Token } }, createMockRes());
  // Register phone 2
  await updatePushToken({ user: userDev2, body: { pushToken: phone2Token } }, createMockRes());

  let riderTokens = await User.findById(newRider._id);
  assert(
    riderTokens.expoPushTokens.includes(phone1Token) && riderTokens.expoPushTokens.includes(phone2Token),
    'Both device tokens successfully registered in expoPushTokens array'
  );

  // Phone 1 logs out (unregisters only phone 1)
  await updatePushToken({ user: userDev2, body: { pushToken: phone1Token, unregister: true } }, createMockRes());
  riderTokens = await User.findById(newRider._id);
  assert(!riderTokens.expoPushTokens.includes(phone1Token), 'Phone 1 token cleanly removed on logout');
  assert(riderTokens.expoPushTokens.includes(phone2Token), 'Phone 2 token remained safely registered');
  assert(riderTokens.isOnline === true, 'Availability remained intact during multi-device token unregistration');

  // --------------------------------------------------------------------------
  // TEST 11: Failed status updates do not show a false successful state
  // --------------------------------------------------------------------------
  console.log('\n[TEST 11] Failed status updates do not mutate or report false success...');
  // Set rider status to 'Inactive'
  await User.findByIdAndUpdate(newRider._id, { status: 'Inactive' });
  const inactiveUser = await User.findById(newRider._id);

  const reqBlocked = { user: inactiveUser, body: { isOnline: false } };
  const resBlocked = createMockRes();
  await toggleOnline(reqBlocked, resBlocked);
  assert(resBlocked.statusCode === 403, 'Inactive account receives HTTP 403');
  assert(resBlocked.data.message.includes('inactive'), 'Error message informs account is inactive');

  // Restore Active status
  await User.findByIdAndUpdate(newRider._id, { status: 'Active' });
  const activeUser = await User.findById(newRider._id);

  // --------------------------------------------------------------------------
  // TEST 12: Offline riders cannot receive new dispatch assignments
  // --------------------------------------------------------------------------
  console.log('\n[TEST 12] Offline riders cannot receive new dispatch assignments...');
  // Explicitly set rider Offline
  await toggleOnline({ user: activeUser, body: { isOnline: false } }, createMockRes());
  const offlineRider = await User.findById(newRider._id);
  assert(offlineRider.isOnline === false, 'Rider is now Offline');

  // Create a test available unassigned order with required schema fields
  const customer = await Customer.findOne();
  const testOrder = await Order.create({
    orderNumber: `ORD-AVAIL-${Date.now()}`,
    orderType: 'ONLINE',
    customer: customer?._id || new mongoose.Types.ObjectId(),
    status: 'Confirmed',
    paymentStatus: 'Pending',
    paymentMethod: 'COD',
    assignedRider: null,
    subTotal: 350,
    taxableAmount: 350,
    tax: 0,
    amount: 350,
    items: [
      {
        productName: 'Fresh Alphonso Mangoes',
        sku: 'MNG-001',
        unit: 'KG',
        price: 175,
        qty: 2,
        taxRate: 0,
        taxableAmount: 350,
        taxAmount: 0,
        total: 350
      }
    ],
    shippingAddress: {
      contactName: 'Availability Customer',
      contactPhone: '9988001001',
      street: '123 Test St',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      formattedAddress: '123 Test St, Delhi'
    }
  });

  // Query available orders while offline
  const reqAvailOff = { user: offlineRider };
  const resAvailOff = createMockRes();
  await getAvailableOrders(reqAvailOff, resAvailOff);
  assert(Array.isArray(resAvailOff.data) && resAvailOff.data.length === 0, 'Offline rider receives empty available orders list');

  // Dashboard stats reflects newAvailableCount: 0 when offline
  const reqDashOff = { user: offlineRider };
  const resDashOff = createMockRes();
  await getDashboardStats(reqDashOff, resDashOff);
  assert(resDashOff.data.newAvailableCount === 0, 'Dashboard returns newAvailableCount: 0 for offline rider');

  // Attempting to accept order while offline must be blocked with HTTP 400 RIDER_OFFLINE
  const reqAcceptOff = { user: offlineRider, params: { id: testOrder._id } };
  const resAcceptOff = createMockRes();
  await acceptOrder(reqAcceptOff, resAcceptOff);
  assert(resAcceptOff.statusCode === 400, 'Accepting order while offline returns HTTP 400');
  assert(resAcceptOff.data.code === 'RIDER_OFFLINE', 'Returns code: RIDER_OFFLINE');

  // --------------------------------------------------------------------------
  // TEST 13: Online, eligible riders remain dispatch candidates
  // --------------------------------------------------------------------------
  console.log('\n[TEST 13] Online, eligible riders remain dispatch candidates...');
  // Turn rider Online
  await toggleOnline({ user: offlineRider, body: { isOnline: true } }, createMockRes());
  const onlineRider = await User.findById(newRider._id);
  assert(onlineRider.isOnline === true, 'Rider is now Online');

  // Query available orders while online
  const reqAvailOn = { user: onlineRider };
  const resAvailOn = createMockRes();
  await getAvailableOrders(reqAvailOn, resAvailOn);
  const foundOrder = resAvailOn.data.find((o) => o._id.toString() === testOrder._id.toString());
  assert(foundOrder !== undefined, 'Online rider sees the unassigned confirmed order');

  // Now accept the order
  const reqAcceptOn = { user: onlineRider, params: { id: testOrder._id } };
  const resAcceptOn = createMockRes();
  await acceptOrder(reqAcceptOn, resAcceptOn);
  assert(resAcceptOn.statusCode === 200, 'Online rider accepts order successfully with HTTP 200');
  assert(resAcceptOn.data.order.status === 'Accepted', 'Order status moved to Accepted');

  // --------------------------------------------------------------------------
  // TEST 14: Concurrent changes do not cause stale local state to overwrite
  // --------------------------------------------------------------------------
  console.log('\n[TEST 14] Idempotent target state protects against concurrent toggle clobbering...');
  // Two concurrent calls requesting isOnline: true
  const [resC1, resC2] = await Promise.all([
    (async () => {
      const res = createMockRes();
      await toggleOnline({ user: onlineRider, body: { isOnline: true } }, res);
      return res;
    })(),
    (async () => {
      const res = createMockRes();
      await toggleOnline({ user: onlineRider, body: { isOnline: true } }, res);
      return res;
    })()
  ]);
  assert(resC1.data.isOnline === true && resC2.data.isOnline === true, 'Concurrent requests both evaluate to true idempotently');

  // --------------------------------------------------------------------------
  // TEST 15: Existing accepted orders are NOT lost when availability changes
  // --------------------------------------------------------------------------
  console.log('\n[TEST 15] Existing accepted orders are preserved when rider toggles Offline...');
  // Rider turns Offline while having an active accepted order
  await toggleOnline({ user: onlineRider, body: { isOnline: false } }, createMockRes());
  const riderNowOff = await User.findById(newRider._id);
  assert(riderNowOff.isOnline === false, 'Rider is now Offline');

  // Verify accepted order remains assigned and active
  const orderInDb = await Order.findById(testOrder._id);
  assert(orderInDb.status === 'Accepted', 'Order status remains Accepted');
  assert(orderInDb.assignedRider.toString() === newRider._id.toString(), 'Order remains assigned to the rider');

  // Dashboard activeOrder still returns this accepted order
  const reqDashActive = { user: riderNowOff };
  const resDashActive = createMockRes();
  await getDashboardStats(reqDashActive, resDashActive);
  assert(
    resDashActive.data.activeOrder !== null &&
    resDashActive.data.activeOrder._id.toString() === testOrder._id.toString(),
    'Active accepted order is preserved on dashboard even when rider is Offline'
  );

  // Clean up test data
  await Order.deleteOne({ _id: testOrder._id });
  await User.deleteOne({ _id: newRider._id });

  console.log('\n================================================================');
  console.log('🎉 ALL 15 RIDER AVAILABILITY & DISPATCH REGRESSION TESTS PASSED!');
  console.log('================================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runRiderAvailabilityTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

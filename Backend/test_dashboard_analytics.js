import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order.js';
import Product from './src/models/Product.js';
import Customer from './src/models/Customer.js';
import Transaction from './src/models/Transaction.js';
import { parseDateRange } from './src/controllers/reportController.js';
import cache, { clearReportsCache } from './src/utils/cache.js';

dotenv.config();

const runTests = async () => {
  console.log('\n==================================================');
  console.log('  KUIKLO DASHBOARD ERP ANALYTICS TEST SUITE');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kuiklo_db');
  console.log('✓ Connected to MongoDB');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // 1. Test Date Range Parser
    console.log('\n--- 1. Testing parseDateRange across all 9 presets ---');
    const today = parseDateRange('today');
    assert(today.start <= today.end, 'Today start <= end');

    const yesterday = parseDateRange('yesterday');
    assert(yesterday.start < today.start, 'Yesterday start is before today');

    const thisWeek = parseDateRange('this_week');
    assert(thisWeek.start <= today.start, 'This week start is valid');

    const lastWeek = parseDateRange('last_week');
    assert(lastWeek.end < thisWeek.start, 'Last week end is before this week start');

    const thisMonth = parseDateRange('this_month');
    assert(thisMonth.start.getDate() === 1, 'This month start is 1st of month');

    const lastMonth = parseDateRange('last_month');
    assert(lastMonth.end < thisMonth.start, 'Last month end is before this month start');

    const last30 = parseDateRange('last_30_days');
    const diffDays = Math.round((last30.end - last30.start) / (1000 * 60 * 60 * 24));
    assert(diffDays >= 29 && diffDays <= 30, `Last 30 days covers 30 days (actual: ${diffDays})`);

    const thisYear = parseDateRange('this_year');
    assert(thisYear.start.getMonth() === 0 && thisYear.start.getDate() === 1, 'This year starts on Jan 1');

    const custom = parseDateRange('custom', '2026-08-01', '2026-08-15');
    assert(custom.start.getFullYear() === 2026 && custom.start.getMonth() === 7 && custom.start.getDate() === 1, 'Custom start is Aug 1');
    assert(custom.end.getFullYear() === 2026 && custom.end.getMonth() === 7 && custom.end.getDate() === 15, 'Custom end is Aug 15');

    // 2. Test Net Sales & Refund Mathematics
    console.log('\n--- 2. Testing Sales & Refunds Mathematics ---');
    const orders = await Order.find({ paymentStatus: { $in: ['Paid', 'PartiallyRefunded'] }, status: { $nin: ['Cancelled', 'Returned'] } });
    let manualGross = 0;
    let manualRefunds = 0;
    orders.forEach(o => {
      manualGross += o.amount || 0;
      manualRefunds += o.refundAmount || 0;
    });
    const expectedNet = Math.round((manualGross - manualRefunds) * 100) / 100;
    assert(expectedNet >= 0, `Expected Net Sales (${expectedNet}) is non-negative`);

    // 3. Test Cache Invalidation & Middleware
    console.log('\n--- 3. Testing Report Cache Invalidation & Middleware ---');
    const { cacheMiddleware } = await import('./src/middleware/cacheMiddleware.js');
    const middleware = cacheMiddleware(300);
    
    // Simulate initial GET request
    let nextCalled = false;
    const mockReq1 = { method: 'GET', url: '/api/reports/dashboard', query: {}, headers: {} };
    const mockRes1 = {
      statusCode: 200,
      json: function(body) { return body; }
    };
    middleware(mockReq1, mockRes1, () => { nextCalled = true; });
    assert(nextCalled, 'cacheMiddleware passes through on cache miss');

    // Simulate response caching
    mockRes1.json({ success: true, count: 123 });
    assert(cache.get('report_/api/reports/dashboard')?.count === 123, 'cacheMiddleware cached response');

    // Simulate second GET request (Cache Hit)
    let hitResult = null;
    const mockResHit = {
      json: function(body) { hitResult = body; return body; }
    };
    middleware(mockReq1, mockResHit, () => {});
    assert(hitResult?.count === 123, 'cacheMiddleware successfully returns cached response');

    // Simulate Refresh GET request
    const mockReqRefresh = { method: 'GET', url: '/api/reports/dashboard?refresh=true', query: { refresh: 'true' }, headers: {} };
    let refreshNextCalled = false;
    middleware(mockReqRefresh, mockResHit, () => { refreshNextCalled = true; });
    assert(refreshNextCalled, 'cacheMiddleware bypasses cache when refresh=true');

    clearReportsCache();
    assert(cache.get('report_/api/reports/dashboard') === undefined, 'clearReportsCache() instantly wiped report cache');

    // 4. Test Orders Lifecycle Pipeline
    console.log('\n--- 4. Testing Order Pipeline Queries ---');
    const [totalO, deliveredO, cancelledO] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['Delivered', 'Completed'] } }),
      Order.countDocuments({ status: 'Cancelled' })
    ]);
    assert(totalO >= (deliveredO + cancelledO), `Total orders (${totalO}) >= Delivered (${deliveredO}) + Cancelled (${cancelledO})`);

    // 5. Test Recent Transactions Query & Controller
    console.log('\n--- 5. Testing Recent Transactions Query & Controller ---');
    const { getRecentTransactions } = await import('./src/controllers/reportController.js');
    let txResponse = null;
    const mockTxRes = {
      json: function(data) { txResponse = data; return data; },
      status: function(code) { return { json: (e) => { txResponse = e; } }; }
    };
    await getRecentTransactions({}, mockTxRes);
    assert(Array.isArray(txResponse), `getRecentTransactions controller returned array of length ${txResponse?.length}`);
    if (txResponse?.length > 0) {
      console.log(`    Sample Tx: ID=${txResponse[0]._id}, Method=${txResponse[0].paymentMethod}, Amount=₹${txResponse[0].amount}`);
    }

    console.log('\n==================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();

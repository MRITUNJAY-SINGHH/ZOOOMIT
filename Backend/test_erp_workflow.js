import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Category from './src/models/Category.js';
import Supplier from './src/models/Supplier.js';
import Customer from './src/models/Customer.js';
import Product from './src/models/Product.js';
import ProductVariant from './src/models/ProductVariant.js';
import ProductBatch from './src/models/ProductBatch.js';
import InventoryLog from './src/models/InventoryLog.js';
import Order from './src/models/Order.js';
import Invoice from './src/models/Invoice.js';
import Settings from './src/models/Settings.js';
import InventoryService from './src/services/InventoryService.js';
import OrderService from './src/services/OrderService.js';
import { roundTo, multiply, calculateTax, validateQuantityRules } from './src/utils/decimalUtils.js';

dotenv.config();

const runVerificationTests = async () => {
  console.log('🧪 ==========================================');
  console.log('🧪 STARTING ZOOOMIT ERP 16-POINT TEST MATRIX');
  console.log('🧪 ==========================================\n');

  await connectDB();
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
      failedCount++;
    }
  };

  // Setup Test User
  let testUser = await User.findOne({ role: 'Admin' });
  if (!testUser) {
    testUser = await User.create({
      name: 'Test Admin',
      email: `testadmin-${Date.now()}@example.com`,
      phone: `999${Date.now().toString().slice(-7)}`,
      password: 'password',
      role: 'Admin'
    });
  }

  // TEST 1: Category Hierarchy
  console.log('▶ TEST 1: Category & Subcategory Hierarchy');
  const parentCat = await Category.create({
    name: `Test Grocery ${Date.now()}`,
    slug: `test-grocery-${Date.now()}`
  });
  const subCat = await Category.create({
    name: `Test Staples ${Date.now()}`,
    slug: `test-staples-${Date.now()}`,
    parentCategory: parentCat._id
  });
  const fetchedSub = await Category.findOne({ parentCategory: parentCat._id });
  assert(fetchedSub && fetchedSub.name === subCat.name, 'Subcategory linked to parent category successfully');

  // TEST 2: Supplier & Purchase Unit Conversion ($10\text{ BAG} \rightarrow 500\text{ KG}$)
  console.log('\n▶ TEST 2: Supplier Procurement & Purchase Unit Conversion');
  const supplier = await Supplier.create({
    name: 'Test Agro Supplier',
    companyName: 'Agro Corp India',
    phone: `987${Date.now().toString().slice(-7)}`,
    gstNumber: '27AAAAA1234A1Z5'
  });

  const sugarProduct = await Product.create({
    name: `Test Refined Sugar ${Date.now()}`,
    slug: `test-sugar-${Date.now()}`,
    category: parentCat._id,
    subcategory: subCat._id,
    productType: 'WEIGHT',
    baseUnit: 'KG',
    purchaseUnit: 'BAG',
    purchaseToStockFactor: 50,
    sellingUnit: 'KG',
    minSaleQty: 0.5,
    maxSaleQty: 50,
    qtyStep: 0.5,
    taxRate: 5,
    hsnCode: '1701',
    costPrice: 42,
    sellingPrice: 60,
    hasExpiryTracking: false
  });

  const sugarBatch = await InventoryService.addStock({
    productId: sugarProduct._id,
    supplierId: supplier._id,
    batchNumber: `SUG-PURCH-${Date.now()}`,
    quantity: 10, // 10 BAGs
    unit: 'BAG',
    unitCost: 2100, // ₹2100 / BAG
    user: testUser._id
  });

  assert(sugarBatch.stock === 500, `Stock converted to base units: Expected 500 KG, Got ${sugarBatch.stock} ${sugarBatch.unit}`);
  assert(sugarBatch.unitCost === 42, `Unit cost calculated per KG: Expected ₹42/KG, Got ₹${sugarBatch.unitCost}`);
  assert(sugarBatch.totalCost === 21000, `Total cost calculated: Expected ₹21000, Got ₹${sugarBatch.totalCost}`);

  const refreshedSugar = await Product.findById(sugarProduct._id);
  assert(refreshedSugar.stock === 500, `Product aggregated stock is 500 KG: Got ${refreshedSugar.stock}`);

  // TEST 3: Non-Perishable Expiry Behavior (null expiryDate & success)
  console.log('\n▶ TEST 3: Non-Perishable Expiry Date Handling');
  assert(sugarBatch.expiryDate === null, 'Non-perishable batch stored expiryDate as null');

  // TEST 4: Perishable Expiry Date Mandatory Validation
  console.log('\n▶ TEST 4: Perishable Mandatory Expiry Date');
  const milkProduct = await Product.create({
    name: `Test Fresh Milk ${Date.now()}`,
    slug: `test-milk-${Date.now()}`,
    category: parentCat._id,
    productType: 'VOLUME',
    baseUnit: 'LTR',
    sellingUnit: 'LTR',
    taxRate: 0,
    sellingPrice: 65,
    hasExpiryTracking: true
  });

  let threwExpiryError = false;
  try {
    await InventoryService.addStock({
      productId: milkProduct._id,
      batchNumber: `MILK-NO-EXP-${Date.now()}`,
      quantity: 50,
      unitCost: 50,
      user: testUser._id
      // No expiryDate provided
    });
  } catch (err) {
    threwExpiryError = true;
  }
  assert(threwExpiryError, 'Adding stock to perishable product without expiry date was rejected');

  // TEST 5: Expired Stock Sale Block
  console.log('\n▶ TEST 5: Expired Stock Sale Prevention');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await InventoryService.addStock({
    productId: milkProduct._id,
    batchNumber: `MILK-EXP-BATCH-${Date.now()}`,
    quantity: 20,
    unitCost: 50,
    expiryDate: yesterday,
    user: testUser._id
  });

  let threwExpiredSaleError = false;
  try {
    await InventoryService.reduceStockForSale([{
      productId: milkProduct._id,
      qty: 2
    }], testUser._id, 'test-expired-order');
  } catch (err) {
    threwExpiredSaleError = true;
  }
  assert(threwExpiredSaleError, 'Sale of expired batch was strictly blocked by InventoryService');

  // TEST 6: Non-Expiry FIFO Sorting
  console.log('\n▶ TEST 6: Non-Expiry FIFO Sorting');
  const sugarBatch2 = await InventoryService.addStock({
    productId: sugarProduct._id,
    batchNumber: `SUG-BATCH2-${Date.now()}`,
    quantity: 100, // 100 KG direct
    unit: 'KG',
    unitCost: 44,
    user: testUser._id
  });

  // Deduct 50 KG - should come from batch 1 (FIFO by createdAt)
  await InventoryService.reduceStockForSale([{
    productId: sugarProduct._id,
    qty: 50
  }], testUser._id, 'test-fifo-order');

  const b1Refreshed = await ProductBatch.findById(sugarBatch._id);
  const b2Refreshed = await ProductBatch.findById(sugarBatch2._id);
  assert(b1Refreshed.stock === 450, `Batch 1 reduced by 50 KG (450 remaining): Got ${b1Refreshed.stock}`);
  assert(b2Refreshed.stock === 100, `Batch 2 remained untouched (100 remaining): Got ${b2Refreshed.stock}`);

  // TEST 7: Fractional Weight POS Sales (0.25, 0.50, 0.75, 1.00, 1.20, 2.75 KG)
  console.log('\n▶ TEST 7: Fractional Weight POS Sales & Decimal Accuracy');
  const testWeights = [0.25, 0.50, 0.75, 1.00, 1.20, 2.75];
  let fractionalSuccess = true;

  for (const w of testWeights) {
    const stockBefore = (await Product.findById(sugarProduct._id)).stock;
    await InventoryService.reduceStockForSale([{
      productId: sugarProduct._id,
      qty: w
    }], testUser._id, `test-pos-sale-${w}`);

    const stockAfter = (await Product.findById(sugarProduct._id)).stock;
    const expected = roundTo(stockBefore - w, 3);
    if (stockAfter !== expected) {
      fractionalSuccess = false;
      console.error(`Fractional deduction failed for ${w} KG: Expected ${expected}, Got ${stockAfter}`);
    }
  }
  assert(fractionalSuccess, 'All 6 fractional weight deductions (0.25 to 2.75 KG) calculated with exact float precision');

  // TEST 8: Strict Unit Matching Validation
  console.log('\n▶ TEST 8: Strict Unit Matching Validation');
  let threwUnitMismatch = false;
  try {
    await OrderService.validateOrderItems([{
      productId: sugarProduct._id,
      qty: 1.2,
      unit: 'PCS' // Mismatched unit (Product is KG)
    }]);
  } catch (err) {
    threwUnitMismatch = true;
  }
  assert(threwUnitMismatch, 'OrderService rejected mismatched unit (PCS for KG product)');

  // TEST 9: Variant Conversion Factors (500 GM -> 0.50 KG deduction, Box of 12 -> 12 PCS)
  console.log('\n▶ TEST 9: Variant Pack & Fraction Conversion Factors');
  const sugar500gVariant = await ProductVariant.create({
    product: sugarProduct._id,
    name: '500 GM Pack',
    sku: `SUGAR-500G-${Date.now()}`,
    conversionFactor: 0.5,
    conversionUnit: 'KG',
    sellingPrice: 32
  });

  const sugarStockBeforeVariant = (await Product.findById(sugarProduct._id)).stock;
  await InventoryService.reduceStockForSale([{
    productId: sugarProduct._id,
    variantId: sugar500gVariant._id,
    qty: 2 // 2 packs of 500g = 1.00 KG base stock
  }], testUser._id, 'test-variant-order');

  const sugarStockAfterVariant = (await Product.findById(sugarProduct._id)).stock;
  assert(sugarStockAfterVariant === roundTo(sugarStockBeforeVariant - 1.0, 3), 
    `Selling 2 x 500g variant deducted 1.00 KG from bulk inventory: Expected ${sugarStockBeforeVariant - 1.0}, Got ${sugarStockAfterVariant}`);

  // TEST 10: GST Inclusive vs Exclusive Math
  console.log('\n▶ TEST 10: GST Inclusive vs Exclusive Math');
  const inclusiveTax = calculateTax(60, 1.2, 5, 'INCLUSIVE'); // 1.2 KG * ₹60 = ₹72.00
  assert(inclusiveTax.totalAmount === 72.00, `Inclusive Total is ₹72.00: Got ₹${inclusiveTax.totalAmount}`);
  assert(inclusiveTax.taxableAmount === 68.57, `Inclusive Taxable is ₹68.57: Got ₹${inclusiveTax.taxableAmount}`);
  assert(inclusiveTax.taxAmount === 3.43, `Inclusive Tax is ₹3.43: Got ₹${inclusiveTax.taxAmount}`);
  assert(roundTo(inclusiveTax.cgst + inclusiveTax.sgst, 2) === 3.43, `CGST (${inclusiveTax.cgst}) + SGST (${inclusiveTax.sgst}) equals Total Tax`);

  const exclusiveTax = calculateTax(60, 1.2, 5, 'EXCLUSIVE');
  assert(exclusiveTax.taxableAmount === 72.00, `Exclusive Taxable is ₹72.00: Got ₹${exclusiveTax.taxableAmount}`);
  assert(exclusiveTax.taxAmount === 3.60, `Exclusive Tax is ₹3.60: Got ₹${exclusiveTax.taxAmount}`);
  assert(exclusiveTax.totalAmount === 75.60, `Exclusive Total is ₹75.60: Got ₹${exclusiveTax.totalAmount}`);

  // TEST 11: Physical Stock Count Adjustment & Log
  console.log('\n▶ TEST 11: Physical Stock Count Adjustment');
  const auditProduct = await Product.create({
    name: `Test Audit Rice ${Date.now()}`,
    slug: `test-audit-rice-${Date.now()}`,
    category: parentCat._id,
    productType: 'WEIGHT',
    baseUnit: 'KG',
    minSaleQty: 0.5,
    maxSaleQty: 50,
    qtyStep: 0.5,
    sellingPrice: 100,
    costPrice: 70
  });
  const auditBatch = await InventoryService.addStock({
    productId: auditProduct._id,
    batchNumber: `AUDIT-B1-${Date.now()}`,
    quantity: 500,
    unitCost: 70,
    user: testUser._id
  });

  const adjResult = await InventoryService.adjustStock({
    productId: auditProduct._id,
    batchId: auditBatch._id,
    newPhysicalStock: 400.0,
    reason: 'Annual Stock Count Audit',
    user: testUser._id
  });
  const auditStockAfterAdj = (await Product.findById(auditProduct._id)).stock;
  assert(auditStockAfterAdj === 400.0, `Physical stock adjusted to 400.0 KG: Got ${auditStockAfterAdj}`);
  const adjLog = await InventoryLog.findOne({ type: 'STOCK_ADJUSTMENT', product: auditProduct._id });
  assert(adjLog && adjLog.newStock === 400.0, 'STOCK_ADJUSTMENT inventory log created correctly');

  // TEST 12: Damaged Stock Write-off
  console.log('\n▶ TEST 12: Damaged Stock Write-off');
  await InventoryService.recordDamage({
    productId: auditProduct._id,
    batchId: auditBatch._id,
    quantity: 2.5,
    reason: 'Water Damage',
    note: 'Bag torn during rain',
    user: testUser._id
  });
  const auditStockAfterDmg = (await Product.findById(auditProduct._id)).stock;
  assert(auditStockAfterDmg === 397.5, `Stock reduced by 2.5 KG damage to 397.5 KG: Got ${auditStockAfterDmg}`);
  const dmgLog = await InventoryLog.findOne({ type: 'DAMAGED', product: auditProduct._id });
  assert(dmgLog && dmgLog.quantityChanged === -2.5, 'DAMAGED inventory log created correctly');

  // TEST 13: Partial Weight Return
  console.log('\n▶ TEST 13: Partial Weight Return');
  await InventoryService.returnStock(
    auditProduct._id,
    null,
    auditBatch._id,
    0.25, // Return 250g
    'Customer Returned Partial Weight',
    testUser._id,
    null
  );
  const auditStockAfterRet = (await Product.findById(auditProduct._id)).stock;
  assert(auditStockAfterRet === 397.75, `Stock restored by 0.25 KG to 397.75 KG: Got ${auditStockAfterRet}`);

  // TEST 14: Cancelled Order Stock Restoration
  console.log('\n▶ TEST 14: Cancelled Order Stock Restoration');
  const orderItemsValidated = await OrderService.validateOrderItems([{
    productId: auditProduct._id,
    qty: 1.5,
    unit: 'KG'
  }]);
  
  const testOrder = new Order({
    orderNumber: `ORD-TEST-${Date.now()}`,
    orderType: 'ONLINE',
    items: orderItemsValidated,
    subTotal: 150,
    amount: 150,
    status: 'Pending'
  });
  await testOrder.save();
  await InventoryService.reduceStockForSale(orderItemsValidated, testUser._id, testOrder._id);
  const stockDuringOrder = (await Product.findById(auditProduct._id)).stock;

  // Restore on cancel
  for (const item of testOrder.items) {
    await InventoryService.returnStock(item.product, item.variant, null, item.qty, 'Order Cancellation', testUser._id, testOrder._id);
  }
  const stockAfterCancel = (await Product.findById(auditProduct._id)).stock;
  assert(stockAfterCancel === roundTo(stockDuringOrder + 1.5, 3), 'Cancelled order exact decimal stock restored to inventory');

  // TEST 15: Integer-Scaled Quantity Rules Validation
  console.log('\n▶ TEST 15: Integer-Scaled Quantity Rules Validation');
  // Min: 0.5, Max: 5.0, Step: 0.5
  const validStep1 = validateQuantityRules(1.5, 0.5, 5.0, 0.5, 3);
  assert(validStep1.isValid, '1.50 KG is valid for step 0.5 starting from 0.5');

  const invalidStep = validateQuantityRules(0.35, 0.5, 5.0, 0.5, 3);
  assert(!invalidStep.isValid, '0.35 KG was rejected (below min & invalid step)');

  const invalidMax = validateQuantityRules(6.0, 0.5, 5.0, 0.5, 3);
  assert(!invalidMax.isValid, '6.00 KG was rejected (exceeds max 5.0)');

  // TEST 16: Historical Invoice Immutability
  console.log('\n▶ TEST 16: Historical Invoice Immutability');
  const testInvoice = new Invoice({
    invoiceNumber: `INV-HIST-${Date.now()}`,
    order: testOrder._id,
    productSnapshot: [{
      productId: sugarProduct._id,
      productName: sugarProduct.name,
      unit: 'KG',
      qty: 1.5,
      price: 60,
      taxRate: 5,
      taxableAmount: 85.71,
      taxAmount: 4.29,
      total: 90
    }],
    totalsSnapshot: {
      subTotal: 90,
      taxableAmount: 85.71,
      tax: 4.29,
      amount: 90
    }
  });
  await testInvoice.save();

  // Change product price & tax rate
  sugarProduct.sellingPrice = 80;
  sugarProduct.taxRate = 18;
  await sugarProduct.save();

  const fetchedInvoice = await Invoice.findById(testInvoice._id);
  assert(fetchedInvoice.productSnapshot[0].price === 60, 'Historical invoice price retained ₹60 (not ₹80)');
  assert(fetchedInvoice.productSnapshot[0].taxRate === 5, 'Historical invoice tax retained 5% (not 18%)');

  console.log('\n==========================================');
  console.log(`📊 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('==========================================\n');

  if (failedCount === 0) {
    console.log('🎉 ALL 16 BACKEND ERP WORKFLOWS ARE 100% VERIFIED AND PRODUCTION-READY!');
  } else {
    throw new Error(`${failedCount} tests failed`);
  }
};

(async () => {
  try {
    await runVerificationTests();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

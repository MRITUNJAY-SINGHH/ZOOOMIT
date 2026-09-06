import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Product from './src/models/Product.js';
import ProductBatch from './src/models/ProductBatch.js';
import ProductVariant from './src/models/ProductVariant.js';
import Supplier from './src/models/Supplier.js';
import Category from './src/models/Category.js';
import InventoryService from './src/services/InventoryService.js';
import { getProductSupplierHistory } from './src/controllers/productController.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 STARTING SMART PRODUCT & SUPPLIER STOCK ENTRY TESTS');
  console.log('🧪 ========================================================\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected successfully.\n');

    // 1. Setup Suppliers A, B, C
    const suppA = await Supplier.create({
      name: 'ABC Traders',
      companyName: 'ABC Grain Wholesalers Pvt Ltd',
      phone: '9811111111',
      gstNumber: '27ABCDE1234F1Z5',
      paymentTerms: 'Net 30'
    });

    const suppB = await Supplier.create({
      name: 'XYZ Wholesale',
      companyName: 'XYZ Mega Supplies LLP',
      phone: '9822222222',
      gstNumber: '27XYZDE5678F1Z9',
      paymentTerms: 'Immediate'
    });

    const suppC = await Supplier.create({
      name: 'Global Agro Exports',
      companyName: 'Global Agro Ltd',
      phone: '9833333333',
      paymentTerms: 'Net 15'
    });

    const cat = await Category.create({
      name: `Grains & Staples ${Date.now()}`,
      slug: `grains-staples-${Date.now()}`
    });

    // 2. Create Product with preferredSupplier = suppA
    const product = await Product.create({
      name: `Premium Sugar ${Date.now()}`,
      slug: `premium-sugar-${Date.now()}`,
      category: cat._id,
      productType: 'WEIGHT',
      baseUnit: 'KG',
      purchaseUnit: 'BAG',
      purchaseToStockFactor: 50,
      sellingUnit: 'KG',
      costPrice: 42,
      sellingPrice: 48,
      taxRate: 5,
      preferredSupplier: suppA._id
    });

    console.log('▶ TEST 1: Preferred Supplier Assignment on Product');
    assert(product.preferredSupplier.toString() === suppA._id.toString(), 'Product has preferredSupplier assigned to ABC Traders');

    // 3. Inward Stock from Supplier B (XYZ Wholesale) - 10 BAG (500 KG) @ ₹2,100/BAG = ₹42/KG
    console.log('\n▶ TEST 2: Multi-Supplier Batch Inwarding (Supplier B)');
    const batchB = await InventoryService.addStock({
      productId: product._id,
      supplierId: suppB._id,
      batchNumber: `BATCH-B-${Date.now()}`,
      quantity: 10,
      unit: 'BAG',
      unitCost: 2100,
      totalCost: 21000
    });
    assert(batchB.stock === 500, 'Batch B stock converted to 500 KG base units');
    assert(batchB.unitCost === 42, 'Batch B base unit cost is ₹42/KG');

    // 4. Inward Stock from Supplier A (ABC Traders) - 20 BAG (1,000 KG) @ ₹2,050/BAG = ₹41/KG
    console.log('\n▶ TEST 3: Multi-Supplier Batch Inwarding (Supplier A - Preferred)');
    const batchA = await InventoryService.addStock({
      productId: product._id,
      supplierId: suppA._id,
      batchNumber: `BATCH-A-${Date.now()}`,
      quantity: 20,
      unit: 'BAG',
      unitCost: 2050,
      totalCost: 41000
    });
    assert(batchA.stock === 1000, 'Batch A stock converted to 1,000 KG base units');
    assert(batchA.unitCost === 41, 'Batch A base unit cost is ₹41/KG');

    // 5. Inward Stock from Supplier C (Global Agro) - 50 KG direct loose @ ₹43/KG = ₹2,150
    console.log('\n▶ TEST 4: Multi-Supplier Batch Inwarding (Supplier C - Base Unit)');
    const batchC = await InventoryService.addStock({
      productId: product._id,
      supplierId: suppC._id,
      batchNumber: `BATCH-C-${Date.now()}`,
      quantity: 50,
      unit: 'KG',
      unitCost: 43,
      totalCost: 2150
    });
    assert(batchC.stock === 50, 'Batch C stock added as 50 KG base units');

    // 6. Test getProductSupplierHistory Controller Logic
    console.log('\n▶ TEST 5: getProductSupplierHistory Aggregation & Intelligence');
    
    // Simulate req & res for getProductSupplierHistory
    let responseData = null;
    const mockReq = { params: { id: product._id.toString() } };
    const mockRes = {
      json: (data) => { responseData = data; },
      status: () => mockRes
    };

    await getProductSupplierHistory(mockReq, mockRes);

    assert(responseData !== null, 'Supplier history endpoint returned valid response');
    assert(responseData.suppliers.length === 3, `Derived exactly 3 distinct suppliers from batches: Got ${responseData.suppliers.length}`);
    
    // Check preferred supplier
    assert(responseData.preferredSupplier._id.toString() === suppA._id.toString(), 'Preferred supplier is correctly populated as ABC Traders');
    assert(responseData.recommendedSupplier._id.toString() === suppA._id.toString(), 'Recommended supplier prioritizes preferred supplier (ABC Traders)');

    // Verify supplier details
    const suppAEntry = responseData.suppliers.find(s => s.supplier._id.toString() === suppA._id.toString());
    assert(suppAEntry && suppAEntry.isPreferred === true, 'Supplier A entry is marked isPreferred: true');
    assert(suppAEntry && suppAEntry.lastPurchaseUnit === 'BAG', 'Supplier A last purchase unit is BAG');
    assert(suppAEntry && suppAEntry.lastUnitCost === 2050, 'Supplier A last unit cost is ₹2,050');

    const suppBEntry = responseData.suppliers.find(s => s.supplier._id.toString() === suppB._id.toString());
    assert(suppBEntry && suppBEntry.isPreferred === false, 'Supplier B entry is marked isPreferred: false');
    assert(suppBEntry && suppBEntry.lastUnitCost === 2100, 'Supplier B last unit cost is ₹2,100');

    // 7. Product with NO preferred supplier (recommends most recent supplier)
    console.log('\n▶ TEST 6: Auto-Recommendation with No Preferred Supplier');
    const productNoPref = await Product.create({
      name: `Basmati Rice ${Date.now()}`,
      slug: `basmati-rice-${Date.now()}`,
      category: cat._id,
      baseUnit: 'KG',
      purchaseUnit: 'BAG',
      purchaseToStockFactor: 25,
      costPrice: 80,
      sellingPrice: 100,
      preferredSupplier: null
    });

    await InventoryService.addStock({
      productId: productNoPref._id,
      supplierId: suppB._id,
      batchNumber: `BATCH-RICE-${Date.now()}`,
      quantity: 4,
      unit: 'BAG',
      unitCost: 2000,
      totalCost: 8000
    });

    let noPrefData = null;
    const mockReq2 = { params: { id: productNoPref._id.toString() } };
    const mockRes2 = {
      json: (data) => { noPrefData = data; },
      status: () => mockRes2
    };

    await getProductSupplierHistory(mockReq2, mockRes2);
    assert(noPrefData.preferredSupplier === null, 'No preferred supplier is set');
    assert(noPrefData.recommendedSupplier._id.toString() === suppB._id.toString(), 'Recommended supplier falls back to most recent batch supplier (XYZ Wholesale)');
    assert(noPrefData.lastPurchaseSummary.supplierName === suppB.companyName, 'Context summary displays XYZ Mega Supplies LLP');
    assert(noPrefData.lastPurchaseSummary.unitCost === 2000, 'Context summary displays ₹2,000 / BAG');

    // 8. Cleanup test documents
    await Product.deleteMany({ _id: { $in: [product._id, productNoPref._id] } });
    await ProductBatch.deleteMany({ product: { $in: [product._id, productNoPref._id] } });
    await Supplier.deleteMany({ _id: { $in: [suppA._id, suppB._id, suppC._id] } });
    await Category.deleteOne({ _id: cat._id });

    console.log('\n========================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');

    if (failed === 0) {
      console.log('🎉 ALL SMART STOCK ENTRY & SUPPLIER TESTS PASSED 100%!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();

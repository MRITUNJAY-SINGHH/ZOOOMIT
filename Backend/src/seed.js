import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Category from './models/Category.js';
import Supplier from './models/Supplier.js';
import Customer from './models/Customer.js';
import Product from './models/Product.js';
import ProductVariant from './models/ProductVariant.js';
import ProductBatch from './models/ProductBatch.js';
import Coupon from './models/Coupon.js';
import Order from './models/Order.js';
import OrderActivity from './models/OrderActivity.js';
import Transaction from './models/Transaction.js';
import Invoice from './models/Invoice.js';
import InventoryLog from './models/InventoryLog.js';
import HeldBill from './models/HeldBill.js';
import Notification from './models/Notification.js';
import Settings from './models/Settings.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

dotenv.config();

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const slugify = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const fullPermissions = {
  view: true, create: true, edit: true, delete: true
};

const viewOnly = {
  view: true, create: false, edit: false, delete: false
};

const none = {
  view: false, create: false, edit: false, delete: false
};

const users = [
  {
    name: 'Super Admin',
    email: 'admin@example.com',
    phone: '9000000001',
    password: 'password',
    role: 'Admin',
    status: 'Active',
    permissions: { 
      products: fullPermissions, inventory: fullPermissions, orders: fullPermissions, 
      coupons: fullPermissions, pos: fullPermissions, reports: fullPermissions, payments: fullPermissions,
      staff: fullPermissions, customers: fullPermissions, suppliers: fullPermissions, settings: fullPermissions 
    }
  },
  {
    name: 'Store Manager',
    email: 'manager@example.com',
    phone: '9000000002',
    password: 'password',
    role: 'Staff',
    status: 'Active',
    permissions: { 
      products: fullPermissions, inventory: fullPermissions, orders: fullPermissions, 
      coupons: fullPermissions, pos: fullPermissions, reports: fullPermissions, payments: fullPermissions,
      staff: fullPermissions, customers: fullPermissions, suppliers: fullPermissions, settings: fullPermissions 
    }
  },
  {
    name: 'POS Cashier',
    email: 'cashier@example.com',
    phone: '9000000003',
    password: 'password',
    role: 'Staff',
    status: 'Active',
    permissions: { 
      products: { view: true, create: false, edit: false, delete: false }, 
      inventory: none, 
      orders: { view: true, create: true, edit: false, delete: false }, 
      coupons: { view: true, create: false, edit: false, delete: false }, 
      pos: fullPermissions, 
      reports: none, 
      payments: none,
      staff: none, 
      customers: { view: true, create: true, edit: true, delete: false }, 
      suppliers: none, 
      settings: none 
    }
  },
  {
    name: 'Inventory Manager',
    email: 'inventory@example.com',
    phone: '9000000004',
    password: 'password',
    role: 'Staff',
    status: 'Active',
    permissions: { 
      products: fullPermissions, inventory: fullPermissions, orders: none, coupons: none, 
      pos: none, reports: none, payments: none, staff: none, customers: none, suppliers: fullPermissions, settings: none 
    }
  },
  ...Array.from({ length: 4 }).map((_, index) => ({
    name: `Delivery Rider ${index + 1}`,
    email: `rider${index + 1}@example.com`,
    phone: `900000001${index}`,
    password: 'password',
    role: 'DeliveryBoy',
    status: 'Active',
    permissions: { 
      products: none, inventory: none, orders: { view: true, create: false, edit: true, delete: false }, 
      coupons: none, pos: none, reports: none, payments: none,
      staff: none, customers: { view: true, create: false, edit: false, delete: false }, suppliers: none, settings: none
    }
  }))
];

const categoryHierarchy = [
  {
    name: 'Fresh Grocery',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    description: 'Fresh grains, staples, pulses and organic produce',
    subcategories: ['Staples & Grains', 'Pulses & Daals', 'Edible Oils & Ghee', 'Spices & Masalas']
  },
  {
    name: 'Dairy and Bakery',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80',
    description: 'Fresh milk, butter, cheese, bread and bakery essentials',
    subcategories: ['Milk & Cream', 'Breads & Buns', 'Cheese & Paneer', 'Eggs & Butter']
  },
  {
    name: 'Beverages',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80',
    description: 'Tea, coffee, fruit juices and carbonated soft drinks',
    subcategories: ['Tea & Coffee', 'Cold Drinks & Juices', 'Energy Drinks', 'Mineral Water']
  },
  {
    name: 'Snacks & Packaged Foods',
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=900&q=80',
    description: 'Biscuits, chips, namkeen, noodles and ready meals',
    subcategories: ['Biscuits & Cookies', 'Chips & Crisps', 'Instant Noodles', 'Chocolates & Sweets']
  },
  {
    name: 'Personal Care & Cleaning',
    image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?auto=format&fit=crop&w=900&q=80',
    description: 'Household soaps, detergents, shampoos and disinfectants',
    subcategories: ['Soaps & Handwash', 'Hair & Skin Care', 'Laundry Detergents', 'Surface Cleaners']
  }
];

const supplierProfiles = [
  {
    name: 'Reliance Agro Wholesale',
    companyName: 'Reliance Retail Ventures Ltd',
    contactPerson: 'Mukesh Agrawal',
    phone: '9876500001',
    alternatePhone: '9876500099',
    email: 'agro.orders@reliance.example',
    address: 'Warehouse Complex 14, APMC Market',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400703',
    gstNumber: '27AAACR1234F1Z5',
    pan: 'AAACR1234F',
    supplierCode: 'SUP-AGRO-001',
    paymentTerms: 'Net 30',
    creditLimit: 500000,
    bankDetails: { accountName: 'Reliance Retail Agro', accountNumber: '001122334455', ifscCode: 'HDFC0000123', bankName: 'HDFC Bank', branch: 'Vashi' }
  },
  {
    name: 'Amul Dairy Federation',
    companyName: 'Gujarat Cooperative Milk Marketing Federation',
    contactPerson: 'Ramesh Patel',
    phone: '9876500002',
    alternatePhone: '9876500098',
    email: 'supply@amuldepot.example',
    address: 'Amul Dairy Road, Anand',
    city: 'Anand',
    state: 'Gujarat',
    country: 'India',
    pincode: '388001',
    gstNumber: '24AAACG5678K1Z2',
    pan: 'AAACG5678K',
    supplierCode: 'SUP-AMUL-002',
    paymentTerms: 'Immediate',
    creditLimit: 200000,
    bankDetails: { accountName: 'Amul Depot Anand', accountNumber: '998877665544', ifscCode: 'SBIN0000456', bankName: 'State Bank of India', branch: 'Anand Main' }
  },
  {
    name: 'Tata Consumer Goods Supply',
    companyName: 'Tata Consumer Products Limited',
    contactPerson: 'Sunil Verma',
    phone: '9876500003',
    email: 'sales@tataconsumer.example',
    address: 'Plot 45, Industrial Area Phase 1',
    city: 'Gurugram',
    state: 'Haryana',
    country: 'India',
    pincode: '122016',
    gstNumber: '06AAACT9012M1Z8',
    pan: 'AAACT9012M',
    supplierCode: 'SUP-TATA-003',
    paymentTerms: 'Net 15',
    creditLimit: 350000,
    bankDetails: { accountName: 'Tata Consumer North', accountNumber: '554433221100', ifscCode: 'ICIC0000789', bankName: 'ICICI Bank', branch: 'Cyber City' }
  },
  {
    name: 'Hindustan Unilever Depot',
    companyName: 'Hindustan Unilever Limited',
    contactPerson: 'Karan Mehra',
    phone: '9876500004',
    email: 'fmcg@hulsupply.example',
    address: 'B-Block, Logix Park',
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    pincode: '201301',
    gstNumber: '09AAACH3456N1Z1',
    pan: 'AAACH3456N',
    supplierCode: 'SUP-HUL-004',
    paymentTerms: 'Net 30',
    creditLimit: 400000,
    bankDetails: { accountName: 'HUL Distribution Hub', accountNumber: '776655443322', ifscCode: 'KKBK0000321', bankName: 'Kotak Mahindra Bank', branch: 'Sector 62' }
  }
];

const customers = [
  { name: 'Aarav Sharma', phone: '9988001001', email: 'aarav.sharma@example.com', customerType: 'APP', street: 'Flat 402, Green Heights', city: 'Mumbai', state: 'Maharashtra', zipCode: '400053' },
  { name: 'Priya Nair', phone: '9988001002', email: 'priya.nair@example.com', customerType: 'APP', street: 'Villa 12, Palm Meadows', city: 'Bengaluru', state: 'Karnataka', zipCode: '560066' },
  { name: 'Kabir Mehta', phone: '9988001003', email: 'kabir.mehta@example.com', customerType: 'APP', street: '14/B, Golf Course Road', city: 'Gurugram', state: 'Haryana', zipCode: '122002' },
  { name: 'Ananya Iyer', phone: '9988001004', email: 'ananya.iyer@example.com', customerType: 'APP', street: '7th Cross, Indiranagar', city: 'Bengaluru', state: 'Karnataka', zipCode: '560038' },
  { name: 'Rohan Gupta', phone: '9988001005', email: 'rohan.gupta@example.com', customerType: 'WALK_IN', street: 'Shop 4, Market Complex', city: 'Delhi', state: 'Delhi', zipCode: '110001' }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding fresh database with complete ERP & Retail configurations...');

    // 0. Settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({
        storeName: 'ZOOOMIT Retail & Grocery ERP',
        storePhone: '+91 9876543210',
        storeEmail: 'support@zooom.example',
        address: 'Main Retail Hub, Sector 18, Commercial Belt, New Delhi 110001',
        gstNumber: '07AAAAA0000A1Z5',
        taxMode: 'INCLUSIVE',
        invoicePrefixOnline: 'INV-2026-',
        invoicePrefixOffline: 'POS-2026-',
        invoiceFooter: 'Thank you for shopping at ZOOOMIT! Save paper, shop fresh.',
        allowNegativeStock: false
      });
      await settings.save();
    }

    // 1. Users
    const createdUsers = [];
    for (const u of users) {
      let existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        existingUser = new User(u);
        if (u.role === 'DeliveryBoy') {
          existingUser.approvalStatus = 'Approved';
          existingUser.isOnline = true;
        }
        await existingUser.save();
      } else {
        existingUser.password = u.password;
        existingUser.status = 'Active';
        if (u.role === 'DeliveryBoy') {
          existingUser.approvalStatus = 'Approved';
          existingUser.isOnline = true;
        }
        await existingUser.save();
      }
      createdUsers.push(existingUser);
    }
    const adminUser = createdUsers[0];

    // 1b. Customer (Idempotent Test Account for Customer App)
    let testCustomer = await Customer.findOne({ phone: '9988001001' });
    if (!testCustomer) {
      testCustomer = new Customer({
        name: 'Aarav Sharma',
        phone: '9988001001',
        email: 'aarav.sharma@example.com',
        password: 'password123',
        customerType: 'APP',
        status: 'Active',
        addresses: [
          {
            label: 'Home',
            street: 'Flat 402, Lotus Court, Green Glen Layout',
            landmark: 'Near Outer Ring Road Hub',
            city: 'Bengaluru',
            state: 'Karnataka',
            zipCode: '560103',
            country: 'India',
            formattedAddress: 'Flat 402, Lotus Court, Green Glen Layout, Near Outer Ring Road Hub, Bengaluru, Karnataka 560103',
            isDefault: true
          }
        ]
      });
      await testCustomer.save();
    } else {
      testCustomer.password = 'password123';
      testCustomer.status = 'Active';
      testCustomer.customerType = 'APP';
      if (!testCustomer.addresses || testCustomer.addresses.length === 0) {
        testCustomer.addresses = [
          {
            label: 'Home',
            street: 'Flat 402, Lotus Court, Green Glen Layout',
            landmark: 'Near Outer Ring Road Hub',
            city: 'Bengaluru',
            state: 'Karnataka',
            zipCode: '560103',
            country: 'India',
            formattedAddress: 'Flat 402, Lotus Court, Green Glen Layout, Near Outer Ring Road Hub, Bengaluru, Karnataka 560103',
            isDefault: true
          }
        ];
      }
      await testCustomer.save();
    }

    // 2. Categories & Subcategories
    const categoryMap = {};
    for (const catData of categoryHierarchy) {
      let rootCat = await Category.findOne({ slug: slugify(catData.name) });
      if (!rootCat) {
        rootCat = new Category({
          name: catData.name,
          slug: slugify(catData.name),
          image: catData.image,
          description: catData.description,
          parentCategory: null,
          status: 'Active'
        });
        await rootCat.save();
      }
      categoryMap[catData.name] = { root: rootCat, subcategories: {} };

      for (const subName of catData.subcategories) {
        let subCat = await Category.findOne({ slug: slugify(subName) });
        if (!subCat) {
          subCat = new Category({
            name: subName,
            slug: slugify(subName),
            description: `${subName} under ${catData.name}`,
            parentCategory: rootCat._id,
            status: 'Active'
          });
          await subCat.save();
        }
        categoryMap[catData.name].subcategories[subName] = subCat;
      }
    }

    // 3. Suppliers
    const createdSuppliers = [];
    for (const sData of supplierProfiles) {
      let sup = await Supplier.findOne({ phone: sData.phone });
      if (!sup) {
        sup = new Supplier(sData);
        await sup.save();
      }
      createdSuppliers.push(sup);
    }

    // 4. Customers
    const createdCustomers = [];
    for (const cData of customers) {
      let cust = await Customer.findOne({ phone: cData.phone });
      if (!cust) {
        cust = new Customer({
          name: cData.name,
          phone: cData.phone,
          email: cData.email,
          customerType: cData.customerType,
          addresses: [{ label: 'Primary', street: cData.street, city: cData.city, state: cData.state, zipCode: cData.zipCode, country: 'India' }]
        });
        await cust.save();
      }
      createdCustomers.push(cust);
    }

    // 5. Rich Products Dataset
    const productCatalog = [
      {
        name: 'Madhur Pure & Hygienic Sugar',
        slug: 'madhur-pure-hygienic-sugar',
        brand: 'Madhur',
        category: categoryMap['Fresh Grocery'].root._id,
        subcategory: categoryMap['Fresh Grocery'].subcategories['Staples & Grains']._id,
        productType: 'WEIGHT',
        baseUnit: 'KG',
        purchaseUnit: 'BAG',
        purchaseToStockFactor: 50, // 1 BAG = 50 KG
        sellingUnit: 'KG',
        minSaleQty: 0.5,
        maxSaleQty: 25,
        qtyStep: 0.5,
        taxRate: 5,
        hsnCode: '1701',
        baseSku: 'SUGAR-001',
        barcode: '8901000000001',
        mrp: 65,
        costPrice: 42,
        sellingPrice: 60,
        description: 'Sulphur-free refined crystalline sugar for daily sweetening.',
        featuredImage: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=900&q=80',
        hasExpiryTracking: false,
        variants: [
          { name: '500 GM Pack', sku: 'SUGAR-500GM', sellingPrice: 32, conversionFactor: 0.5, conversionUnit: 'KG' },
          { name: '1 KG Pack', sku: 'SUGAR-1KG', sellingPrice: 60, conversionFactor: 1.0, conversionUnit: 'KG' },
          { name: '5 KG Bag', sku: 'SUGAR-5KG', sellingPrice: 290, conversionFactor: 5.0, conversionUnit: 'KG' }
        ],
        initialBatch: { batchNumber: 'SUG-B1-2026', purchaseQty: 10, unitCost: 2100 } // 10 BAGs = 500 KG @ 2100/BAG = ₹42/KG
      },
      {
        name: 'Daawat Rozana Basmati Rice',
        slug: 'daawat-rozana-basmati-rice',
        brand: 'Daawat',
        category: categoryMap['Fresh Grocery'].root._id,
        subcategory: categoryMap['Fresh Grocery'].subcategories['Staples & Grains']._id,
        productType: 'WEIGHT',
        baseUnit: 'KG',
        purchaseUnit: 'BAG',
        purchaseToStockFactor: 25, // 1 BAG = 25 KG
        sellingUnit: 'KG',
        minSaleQty: 1,
        maxSaleQty: 50,
        qtyStep: 1,
        taxRate: 5,
        hsnCode: '1006',
        baseSku: 'RICE-001',
        barcode: '8901000000002',
        mrp: 140,
        costPrice: 85,
        sellingPrice: 120,
        description: 'Aromatic long grain basmati rice for daily meals.',
        featuredImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
        hasExpiryTracking: false,
        initialBatch: { batchNumber: 'RICE-B1-2026', purchaseQty: 8, unitCost: 2125 } // 8 BAGs = 200 KG @ 2125/BAG = ₹85/KG
      },
      {
        name: 'Amul Taaza Homogenised Fresh Milk',
        slug: 'amul-taaza-fresh-milk',
        brand: 'Amul',
        category: categoryMap['Dairy and Bakery'].root._id,
        subcategory: categoryMap['Dairy and Bakery'].subcategories['Milk & Cream']._id,
        productType: 'VOLUME',
        baseUnit: 'LTR',
        purchaseUnit: 'CRATE',
        purchaseToStockFactor: 12, // 1 CRATE = 12 LTR
        sellingUnit: 'LTR',
        minSaleQty: 0.5,
        maxSaleQty: 20,
        qtyStep: 0.5,
        taxRate: 0,
        hsnCode: '0401',
        baseSku: 'MILK-001',
        barcode: '8901000000003',
        mrp: 70,
        costPrice: 56,
        sellingPrice: 66,
        description: 'Fresh toned homogenised pasteurised milk.',
        featuredImage: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80',
        hasExpiryTracking: true,
        initialBatch: { batchNumber: 'MILK-B1-2026', purchaseQty: 10, unitCost: 672, expiryDate: daysFromNow(20) } // 10 Crates = 120 LTR
      },
      {
        name: 'Britannia Daily Whole Wheat Bread',
        slug: 'britannia-whole-wheat-bread',
        brand: 'Britannia',
        category: categoryMap['Dairy and Bakery'].root._id,
        subcategory: categoryMap['Dairy and Bakery'].subcategories['Breads & Buns']._id,
        productType: 'PACK',
        baseUnit: 'PACK',
        purchaseUnit: 'CRATE',
        purchaseToStockFactor: 20,
        sellingUnit: 'PACK',
        minSaleQty: 1,
        maxSaleQty: 10,
        qtyStep: 1,
        taxRate: 0,
        hsnCode: '1905',
        baseSku: 'BREAD-001',
        barcode: '8901000000004',
        mrp: 60,
        costPrice: 42,
        sellingPrice: 52,
        description: 'Fresh wholesome brown wheat bread.',
        featuredImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
        hasExpiryTracking: true,
        initialBatch: { batchNumber: 'BRD-B1-2026', purchaseQty: 5, unitCost: 840, expiryDate: daysFromNow(5) } // 5 Crates = 100 Packs
      },
      {
        name: 'Thums Up Charged Carbonated Beverage 750ml',
        slug: 'thums-up-beverage-750ml',
        brand: 'Thums Up',
        category: categoryMap['Beverages'].root._id,
        subcategory: categoryMap['Beverages'].subcategories['Cold Drinks & Juices']._id,
        productType: 'PIECE',
        baseUnit: 'PCS',
        purchaseUnit: 'BOX',
        purchaseToStockFactor: 24, // 1 Box = 24 PCS
        sellingUnit: 'PCS',
        minSaleQty: 1,
        maxSaleQty: 24,
        qtyStep: 1,
        taxRate: 28,
        hsnCode: '2202',
        baseSku: 'THUMS-001',
        barcode: '8901000000005',
        mrp: 45,
        costPrice: 28,
        sellingPrice: 40,
        description: 'Strong spicy carbonated cola drink.',
        featuredImage: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80',
        hasExpiryTracking: true,
        variants: [
          { name: 'Box of 12 Bottles', sku: 'THUMS-BOX12', sellingPrice: 460, conversionFactor: 12, conversionUnit: 'PCS' }
        ],
        initialBatch: { batchNumber: 'THUM-B1-2026', purchaseQty: 5, unitCost: 672, expiryDate: daysFromNow(120) } // 5 Boxes = 120 PCS
      },
      {
        name: 'Parle-G Original Glucose Biscuits',
        slug: 'parle-g-glucose-biscuits',
        brand: 'Parle',
        category: categoryMap['Snacks & Packaged Foods'].root._id,
        subcategory: categoryMap['Snacks & Packaged Foods'].subcategories['Biscuits & Cookies']._id,
        productType: 'PACK',
        baseUnit: 'PACK',
        purchaseUnit: 'BOX',
        purchaseToStockFactor: 48,
        sellingUnit: 'PACK',
        minSaleQty: 1,
        maxSaleQty: 20,
        qtyStep: 1,
        taxRate: 18,
        hsnCode: '1905',
        baseSku: 'PARLE-001',
        barcode: '8901000000006',
        mrp: 35,
        costPrice: 22,
        sellingPrice: 30,
        description: 'Iconic golden glucose biscuits rich in nutrition.',
        featuredImage: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=900&q=80',
        hasExpiryTracking: true,
        initialBatch: { batchNumber: 'PARL-B1-2026', purchaseQty: 5, unitCost: 1056, expiryDate: daysFromNow(180) } // 5 Boxes = 240 Packs
      },
      {
        name: 'Vim Dishwash Bar 500g',
        slug: 'vim-dishwash-bar-500g',
        brand: 'Vim',
        category: categoryMap['Personal Care & Cleaning'].root._id,
        subcategory: categoryMap['Personal Care & Cleaning'].subcategories['Surface Cleaners']._id,
        productType: 'PIECE',
        baseUnit: 'PCS',
        purchaseUnit: 'BOX',
        purchaseToStockFactor: 30,
        sellingUnit: 'PCS',
        minSaleQty: 1,
        maxSaleQty: 15,
        qtyStep: 1,
        taxRate: 18,
        hsnCode: '3402',
        baseSku: 'VIM-001',
        barcode: '8901000000007',
        mrp: 30,
        costPrice: 18,
        sellingPrice: 25,
        description: 'Tough grease remover bar with lemon power.',
        featuredImage: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=900&q=80',
        hasExpiryTracking: false,
        initialBatch: { batchNumber: 'VIM-B1-2026', purchaseQty: 4, unitCost: 540 } // 4 Boxes = 120 PCS
      }
    ];

    const InventoryService = (await import('./services/InventoryService.js')).default;

    for (const p of productCatalog) {
      let product = await Product.findOne({ barcode: p.barcode });
      if (!product) {
        const { variants, initialBatch, ...prodFields } = p;
        product = new Product(prodFields);
        await product.save();

        if (variants && variants.length > 0) {
          for (const v of variants) {
            const variantDoc = new ProductVariant({ ...v, product: product._id });
            await variantDoc.save();
          }
        }

        if (initialBatch) {
          await InventoryService.addStock({
            productId: product._id,
            supplierId: createdSuppliers[0]._id,
            batchNumber: initialBatch.batchNumber,
            quantity: initialBatch.purchaseQty,
            unit: product.purchaseUnit,
            unitCost: initialBatch.unitCost,
            expiryDate: initialBatch.expiryDate || null,
            user: adminUser._id,
            note: 'Initial Seed Inventory Stock'
          });
        }
      }
    }

    // =========================================================================
    // 6. Seed Complete Test Orders for Both Delivery Partners & Dispatch Pool
    // =========================================================================
    console.log('📦 Seeding delivery partner test orders (Active Accepted, Delivered, and Upcoming Pool)...');

    const rider1 = await User.findOne({ email: 'rider1@example.com' });
    const rider2 = await User.findOne({ email: 'rider2@example.com' });
    if (rider1) {
      rider1.isOnline = true;
      rider1.status = 'Active';
      rider1.approvalStatus = 'Approved';
      await rider1.save();
    }
    if (rider2) {
      rider2.isOnline = true;
      rider2.status = 'Active';
      rider2.approvalStatus = 'Approved';
      await rider2.save();
    }

    // Ensure all 5 customers exist
    const customerDocs = [];
    for (const cust of customers) {
      let cDoc = await Customer.findOne({ phone: cust.phone });
      if (!cDoc) {
        cDoc = new Customer({
          name: cust.name,
          phone: cust.phone,
          email: cust.email,
          password: 'password123',
          customerType: cust.customerType || 'APP',
          status: 'Active',
          addresses: [
            {
              label: 'Home',
              street: cust.street,
              landmark: 'Near Main Road',
              city: cust.city,
              state: cust.state,
              zipCode: cust.zipCode,
              country: 'India',
              formattedAddress: `${cust.street}, ${cust.city}, ${cust.state} ${cust.zipCode}`,
              isDefault: true
            }
          ]
        });
        await cDoc.save();
      }
      customerDocs.push(cDoc);
    }

    const seededProducts = await Product.find({ isActive: true });
    const getProd = (sku) => seededProducts.find((p) => p.baseSku === sku) || seededProducts[0];

    const pAtta = getProd('ATTA-001');
    const pDal = getProd('DAL-001');
    const pOil = getProd('OIL-001');
    const pMilk = getProd('MILK-001');
    const pCola = getProd('THUMS-001');
    const pBiscuit = getProd('PARLE-001');
    const pVim = getProd('VIM-001');

    const makeItem = (prod, qty = 1) => {
      const price = prod?.sellingPrice || 50;
      const total = price * qty;
      return {
        product: prod?._id,
        productName: prod?.name || 'Grocery Item',
        productImage: prod?.featuredImage,
        sku: prod?.baseSku || 'SKU',
        unit: prod?.sellingUnit || 'PCS',
        qty,
        price,
        taxRate: prod?.taxRate || 0,
        taxableAmount: total,
        taxAmount: 0,
        total
      };
    };

    const buildOtp = async (plainCode = '4821') => {
      const hash = await bcrypt.hash(plainCode, 8);
      return {
        code: plainCode,
        hash,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        attempts: 0,
        lastGeneratedAt: new Date()
      };
    };

    const testOrdersSpec = [
      // -----------------------------------------------------------------------
      // RIDER 1: Active In-Progress Delivery (Accepted)
      // -----------------------------------------------------------------------
      {
        orderNumber: 'ORD-R1-ACTIVE-01',
        orderType: 'ONLINE',
        customer: customerDocs[0]?._id,
        status: 'Accepted',
        paymentStatus: 'Pending',
        paymentMethod: 'COD',
        assignedRider: rider1?._id,
        assignedAt: new Date(Date.now() - 20 * 60 * 1000),
        riderEarnings: 30,
        items: [makeItem(pAtta, 1), makeItem(pMilk, 2), makeItem(pBiscuit, 3)],
        shippingAddress: {
          contactName: customerDocs[0]?.name || 'Aarav Sharma',
          contactPhone: customerDocs[0]?.phone || '9988001001',
          street: 'Flat 402, Lotus Court, Green Glen Layout',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560103',
          country: 'India',
          formattedAddress: 'Flat 402, Lotus Court, Green Glen Layout, Bengaluru 560103'
        },
        otpCode: '4821'
      },
      // -----------------------------------------------------------------------
      // RIDER 1: Past Delivered Orders (Today) -> Total ₹90 (3 * ₹30)
      // -----------------------------------------------------------------------
      {
        orderNumber: 'ORD-R1-DELIVERED-01',
        orderType: 'ONLINE',
        customer: customerDocs[1]?._id,
        status: 'Delivered',
        paymentStatus: 'Paid',
        paymentMethod: 'Online',
        assignedRider: rider1?._id,
        assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        riderEarnings: 30,
        items: [makeItem(pOil, 2), makeItem(pDal, 1)],
        shippingAddress: {
          contactName: customerDocs[1]?.name || 'Priya Nair',
          contactPhone: customerDocs[1]?.phone || '9988001002',
          street: 'Villa 12, Palm Meadows',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560066',
          country: 'India',
          formattedAddress: 'Villa 12, Palm Meadows, Bengaluru 560066'
        }
      },
      {
        orderNumber: 'ORD-R1-DELIVERED-02',
        orderType: 'ONLINE',
        customer: customerDocs[2]?._id,
        status: 'Delivered',
        paymentStatus: 'Paid',
        paymentMethod: 'COD',
        assignedRider: rider1?._id,
        assignedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 4.2 * 60 * 60 * 1000),
        riderEarnings: 30,
        items: [makeItem(pCola, 4), makeItem(pBiscuit, 2)],
        shippingAddress: {
          contactName: customerDocs[2]?.name || 'Kabir Mehta',
          contactPhone: customerDocs[2]?.phone || '9988001003',
          street: '14/B, Golf Course Road',
          city: 'Gurugram',
          state: 'Haryana',
          zipCode: '122002',
          country: 'India',
          formattedAddress: '14/B, Golf Course Road, Gurugram 122002'
        }
      },
      {
        orderNumber: 'ORD-R1-DELIVERED-03',
        orderType: 'ONLINE',
        customer: customerDocs[3]?._id,
        status: 'Delivered',
        paymentStatus: 'Paid',
        paymentMethod: 'Online',
        assignedRider: rider1?._id,
        assignedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 6.5 * 60 * 60 * 1000),
        riderEarnings: 30,
        items: [makeItem(pVim, 3), makeItem(pMilk, 1)],
        shippingAddress: {
          contactName: customerDocs[3]?.name || 'Ananya Iyer',
          contactPhone: customerDocs[3]?.phone || '9988001004',
          street: '7th Cross, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560038',
          country: 'India',
          formattedAddress: '7th Cross, Indiranagar, Bengaluru 560038'
        }
      },

      // -----------------------------------------------------------------------
      // RIDER 2: Active In-Progress Delivery (Accepted)
      // -----------------------------------------------------------------------
      {
        orderNumber: 'ORD-R2-ACTIVE-01',
        orderType: 'ONLINE',
        customer: customerDocs[1]?._id,
        status: 'Accepted',
        paymentStatus: 'Paid',
        paymentMethod: 'Online',
        assignedRider: rider2?._id,
        assignedAt: new Date(Date.now() - 15 * 60 * 1000),
        riderEarnings: 30,
        items: [makeItem(pDal, 2), makeItem(pOil, 1), makeItem(pCola, 2)],
        shippingAddress: {
          contactName: customerDocs[1]?.name || 'Priya Nair',
          contactPhone: customerDocs[1]?.phone || '9988001002',
          street: 'Villa 12, Palm Meadows',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560066',
          country: 'India',
          formattedAddress: 'Villa 12, Palm Meadows, Bengaluru 560066'
        },
        otpCode: '7194'
      },
      // -----------------------------------------------------------------------
      // RIDER 2: Past Delivered Orders (Today) -> Total ₹60 (2 * ₹30)
      // -----------------------------------------------------------------------
      {
        orderNumber: 'ORD-R2-DELIVERED-01',
        orderType: 'ONLINE',
        customer: customerDocs[3]?._id,
        status: 'Delivered',
        paymentStatus: 'Paid',
        paymentMethod: 'COD',
        assignedRider: rider2?._id,
        assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 3.4 * 60 * 60 * 1000),
        riderEarnings: 30,
        items: [makeItem(pAtta, 1), makeItem(pVim, 2)],
        shippingAddress: {
          contactName: customerDocs[3]?.name || 'Ananya Iyer',
          contactPhone: customerDocs[3]?.phone || '9988001004',
          street: '7th Cross, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560038',
          country: 'India',
          formattedAddress: '7th Cross, Indiranagar, Bengaluru 560038'
        }
      },
      {
        orderNumber: 'ORD-R2-DELIVERED-02',
        orderType: 'ONLINE',
        customer: customerDocs[0]?._id,
        status: 'Delivered',
        paymentStatus: 'Paid',
        paymentMethod: 'Online',
        assignedRider: rider2?._id,
        assignedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
        riderEarnings: 30,
        items: [makeItem(pMilk, 3), makeItem(pBiscuit, 4)],
        shippingAddress: {
          contactName: customerDocs[0]?.name || 'Aarav Sharma',
          contactPhone: customerDocs[0]?.phone || '9988001001',
          street: 'Flat 402, Lotus Court, Green Glen Layout',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560103',
          country: 'India',
          formattedAddress: 'Flat 402, Lotus Court, Green Glen Layout, Bengaluru 560103'
        }
      },

      // -----------------------------------------------------------------------
      // DISPATCH POOL: Upcoming / Available Orders (Waiting to be accepted)
      // Visible to BOTH Rider 1 and Rider 2 when Online!
      // -----------------------------------------------------------------------
      {
        orderNumber: 'ORD-POOL-UPCOMING-01',
        orderType: 'ONLINE',
        customer: customerDocs[2]?._id,
        status: 'Confirmed',
        paymentStatus: 'Pending',
        paymentMethod: 'COD',
        assignedRider: null,
        items: [makeItem(pAtta, 1), makeItem(pOil, 1), makeItem(pBiscuit, 2)],
        shippingAddress: {
          contactName: customerDocs[2]?.name || 'Kabir Mehta',
          contactPhone: customerDocs[2]?.phone || '9988001003',
          street: '14/B, Golf Course Road',
          city: 'Gurugram',
          state: 'Haryana',
          zipCode: '122002',
          country: 'India',
          formattedAddress: '14/B, Golf Course Road, Gurugram 122002'
        },
        otpCode: '3582'
      },
      {
        orderNumber: 'ORD-POOL-UPCOMING-02',
        orderType: 'ONLINE',
        customer: customerDocs[3]?._id,
        status: 'Confirmed',
        paymentStatus: 'Paid',
        paymentMethod: 'Online',
        assignedRider: null,
        items: [makeItem(pMilk, 2), makeItem(pDal, 1), makeItem(pCola, 2)],
        shippingAddress: {
          contactName: customerDocs[3]?.name || 'Ananya Iyer',
          contactPhone: customerDocs[3]?.phone || '9988001004',
          street: '7th Cross, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560038',
          country: 'India',
          formattedAddress: '7th Cross, Indiranagar, Bengaluru 560038'
        },
        otpCode: '6249'
      },
      {
        orderNumber: 'ORD-POOL-UPCOMING-03',
        orderType: 'ONLINE',
        customer: customerDocs[4]?._id || customerDocs[0]?._id,
        status: 'Confirmed',
        paymentStatus: 'Pending',
        paymentMethod: 'COD',
        assignedRider: null,
        items: [makeItem(pVim, 2), makeItem(pBiscuit, 3), makeItem(pCola, 1)],
        shippingAddress: {
          contactName: customerDocs[4]?.name || 'Rohan Gupta',
          contactPhone: customerDocs[4]?.phone || '9988001005',
          street: 'Shop 4, Market Complex',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India',
          formattedAddress: 'Shop 4, Market Complex, Delhi 110001'
        },
        otpCode: '8910'
      },
      {
        orderNumber: 'ORD-POOL-UPCOMING-04',
        orderType: 'ONLINE',
        customer: customerDocs[1]?._id,
        status: 'Confirmed',
        paymentStatus: 'Paid',
        paymentMethod: 'Online',
        assignedRider: null,
        items: [makeItem(pDal, 2), makeItem(pOil, 2)],
        shippingAddress: {
          contactName: customerDocs[1]?.name || 'Priya Nair',
          contactPhone: customerDocs[1]?.phone || '9988001002',
          street: 'Villa 12, Palm Meadows',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560066',
          country: 'India',
          formattedAddress: 'Villa 12, Palm Meadows, Bengaluru 560066'
        },
        otpCode: '5037'
      }
    ];

    for (const spec of testOrdersSpec) {
      const subTotal = spec.items.reduce((sum, it) => sum + (it.total || 0), 0);
      const amount = subTotal;
      const deliveryOtp = spec.otpCode ? await buildOtp(spec.otpCode) : undefined;

      const orderPayload = {
        orderNumber: spec.orderNumber,
        orderType: spec.orderType,
        customer: spec.customer,
        status: spec.status,
        paymentStatus: spec.paymentStatus,
        paymentMethod: spec.paymentMethod,
        assignedRider: spec.assignedRider || null,
        assignedAt: spec.assignedAt || (spec.assignedRider ? new Date() : null),
        deliveredAt: spec.deliveredAt || null,
        riderEarnings: spec.riderEarnings || 0,
        items: spec.items,
        subTotal,
        taxableAmount: subTotal,
        tax: 0,
        amount,
        shippingAddress: spec.shippingAddress,
        declinedRiders: []
      };

      if (deliveryOtp) {
        orderPayload.deliveryOtp = deliveryOtp;
      }

      let existingOrder = await Order.findOne({ orderNumber: spec.orderNumber });
      if (!existingOrder) {
        existingOrder = new Order(orderPayload);
        await existingOrder.save();
      } else {
        Object.assign(existingOrder, orderPayload);
        await existingOrder.save();
      }

      const existingActivity = await OrderActivity.findOne({
        order: existingOrder._id,
        status: spec.status
      });
      if (!existingActivity) {
        await OrderActivity.create({
          order: existingOrder._id,
          status: spec.status,
          user: spec.assignedRider || adminUser._id,
          system: !spec.assignedRider,
          note: `Seed order setup: ${spec.status}`
        });
      }
    }

    console.log('✅ Seed Database Finished successfully.');
  } catch (error) {
    console.error('Seed Error:', error);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    await seedDatabase();
    process.exit(0);
  })();
}

export default seedDatabase;

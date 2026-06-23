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

dotenv.config();

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const slugify = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const imageUrl = (query, index) =>
  `https://images.unsplash.com/photo-${index}?auto=format&fit=crop&w=900&q=80`;

const users = [
  {
    name: 'Super Admin',
    email: 'admin@example.com',
    phone: '9000000001',
    password: 'password',
    role: 'Admin',
    status: 'Active',
    permissions: { products: true, inventory: true, orders: true, coupons: true, pos: true, reports: true, payments: true }
  },
  {
    name: 'Store Manager',
    email: 'manager@example.com',
    phone: '9000000002',
    password: 'password',
    role: 'Staff',
    status: 'Active',
    permissions: { products: true, inventory: true, orders: true, coupons: true, pos: true, reports: true, payments: true }
  },
  {
    name: 'POS Cashier',
    email: 'cashier@example.com',
    phone: '9000000003',
    password: 'password',
    role: 'Staff',
    status: 'Active',
    permissions: { products: false, inventory: false, orders: true, coupons: false, pos: true, reports: false, payments: false }
  },
  {
    name: 'Inventory Staff',
    email: 'inventory@example.com',
    phone: '9000000004',
    password: 'password',
    role: 'Staff',
    status: 'Active',
    permissions: { products: true, inventory: true, orders: false, coupons: false, pos: false, reports: false, payments: false }
  },
  {
    name: 'Report Analyst',
    email: 'reports@example.com',
    phone: '9000000005',
    password: 'password',
    role: 'Staff',
    status: 'Active',
    permissions: { products: false, inventory: false, orders: true, coupons: false, pos: false, reports: true, payments: true }
  },
  ...Array.from({ length: 6 }).map((_, index) => ({
    name: `Delivery Rider ${index + 1}`,
    email: `rider${index + 1}@example.com`,
    phone: `900000001${index}`,
    password: 'password',
    role: 'DeliveryBoy',
    status: index === 5 ? 'Inactive' : 'Active',
    permissions: { products: false, inventory: false, orders: true, coupons: false, pos: false, reports: false, payments: false }
  }))
];

const categoryNames = [
  'Fresh Grocery',
  'Dairy and Bakery',
  'Beverages',
  'Personal Care',
  'Home Cleaning',
  'Electronics',
  'Kitchen Essentials',
  'Baby Care',
  'Pet Supplies',
  'Health and Wellness'
];

const suppliers = [
  ['Reliance Fresh Distribution', '9876500001', 'orders@reliancefresh.example', 'Warehouse 12, Navi Mumbai, Maharashtra'],
  ['Amul Dairy Depot', '9876500002', 'supply@amuldepot.example', 'Dairy Market Road, Anand, Gujarat'],
  ['Hindustan Grocery Traders', '9876500003', 'sales@hgt.example', 'Azadpur Mandi, Delhi'],
  ['TechNest Wholesale', '9876500004', 'partner@technest.example', 'Electronic City, Bengaluru, Karnataka'],
  ['Urban Home Care Supply', '9876500005', 'billing@urbanhome.example', 'Industrial Area Phase 2, Chandigarh'],
  ['GreenFarm Organics', '9876500006', 'hello@greenfarm.example', 'Organic Hub, Pune, Maharashtra'],
  ['Metro FMCG Partners', '9876500007', 'ops@metrofmcg.example', 'BTM Layout, Bengaluru, Karnataka'],
  ['Aarogya Wellness Supply', '9876500008', 'care@aarogya.example', 'MG Road, Indore, Madhya Pradesh'],
  ['Little Steps Baby Products', '9876500009', 'orders@littlesteps.example', 'Sector 63, Noida, Uttar Pradesh'],
  ['PetKart Distribution', '9876500010', 'support@petkart.example', 'Kukatpally, Hyderabad, Telangana']
];

const customers = [
  ['Aarav Sharma', '9988001001', 'aarav.sharma@example.com', 'APP'],
  ['Priya Nair', '9988001002', 'priya.nair@example.com', 'APP'],
  ['Kabir Mehta', '9988001003', 'kabir.mehta@example.com', 'APP'],
  ['Ananya Iyer', '9988001004', 'ananya.iyer@example.com', 'APP'],
  ['Rohan Gupta', '9988001005', 'rohan.gupta@example.com', 'APP'],
  ['Meera Singh', '9988001006', 'meera.singh@example.com', 'APP'],
  ['Vikram Patel', '9988001007', 'vikram.patel@example.com', 'APP'],
  ['Sneha Reddy', '9988001008', 'sneha.reddy@example.com', 'APP'],
  ['Walk In Customer 1', '9988001009', '', 'WALK_IN'],
  ['Walk In Customer 2', '9988001010', '', 'WALK_IN']
];

const productSeeds = [
  ['Organic Basmati Rice 5kg', 'GreenFarm', 'Fresh Grocery', 899, 610, 749, 45, 8, '8901000000011', 'Premium aged basmati rice with long grains and rich aroma.', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80'],
  ['Aashirvaad Whole Wheat Atta 10kg', 'Aashirvaad', 'Fresh Grocery', 620, 440, 535, 38, 10, '8901000000012', 'Stone-ground whole wheat flour for soft chapatis.', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80'],
  ['Amul Taaza Milk 1L', 'Amul', 'Dairy and Bakery', 72, 58, 66, 18, 20, '8901000000013', 'Fresh toned milk pouch for daily household use.', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80'],
  ['Britannia Brown Bread 400g', 'Britannia', 'Dairy and Bakery', 60, 42, 52, 12, 15, '8901000000014', 'Soft brown bread made with whole wheat flour.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80'],
  ['Tata Tea Premium 1kg', 'Tata Tea', 'Beverages', 580, 395, 495, 28, 8, '8901000000015', 'Rich Assam tea blend packed for strong Indian chai.', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=900&q=80'],
  ['Nescafe Classic Coffee 200g', 'Nescafe', 'Beverages', 720, 510, 625, 24, 6, '8901000000016', 'Instant coffee granules with bold aroma and taste.', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=900&q=80'],
  ['Dove Daily Shine Shampoo 650ml', 'Dove', 'Personal Care', 699, 478, 599, 31, 7, '8901000000017', 'Gentle nourishing shampoo for daily hair care.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80'],
  ['Dettol Liquid Handwash 900ml', 'Dettol', 'Personal Care', 299, 198, 249, 56, 12, '8901000000018', 'Antibacterial handwash refill for hygiene protection.', 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?auto=format&fit=crop&w=900&q=80'],
  ['Harpic Bathroom Cleaner 1L', 'Harpic', 'Home Cleaning', 225, 145, 189, 42, 10, '8901000000019', 'Powerful bathroom disinfectant and stain remover.', 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=900&q=80'],
  ['Surf Excel Matic Liquid 2L', 'Surf Excel', 'Home Cleaning', 480, 330, 415, 37, 10, '8901000000020', 'Laundry liquid detergent for washing machines.', 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?auto=format&fit=crop&w=900&q=80'],
  ['boAt Airdopes 141', 'boAt', 'Electronics', 4490, 1450, 1999, 19, 5, '8901000000021', 'Wireless earbuds with low latency and long playback.', 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80'],
  ['Philips LED Bulb 12W Pack of 4', 'Philips', 'Electronics', 720, 390, 549, 34, 8, '8901000000022', 'Energy efficient LED bulbs for home lighting.', 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=900&q=80'],
  ['Prestige Non Stick Fry Pan 240mm', 'Prestige', 'Kitchen Essentials', 1295, 760, 999, 22, 5, '8901000000023', 'Durable non-stick fry pan for everyday cooking.', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80'],
  ['Cello Stainless Steel Bottle 1L', 'Cello', 'Kitchen Essentials', 799, 430, 649, 40, 8, '8901000000024', 'Leak-proof insulated steel water bottle.', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80'],
  ['Pampers Baby Dry Pants M 76 Count', 'Pampers', 'Baby Care', 1499, 1040, 1299, 16, 5, '8901000000025', 'Absorbent baby diaper pants with overnight dryness.', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=900&q=80'],
  ['Himalaya Baby Lotion 400ml', 'Himalaya', 'Baby Care', 360, 235, 299, 29, 7, '8901000000026', 'Gentle moisturising lotion for baby skin.', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80'],
  ['Pedigree Adult Dog Food 3kg', 'Pedigree', 'Pet Supplies', 840, 610, 735, 21, 6, '8901000000027', 'Complete dry food for adult dogs.', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80'],
  ['Whiskas Tuna Cat Food 1.2kg', 'Whiskas', 'Pet Supplies', 560, 385, 485, 18, 5, '8901000000028', 'Balanced cat food with tuna flavour.', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80'],
  ['Dabur Honey 1kg', 'Dabur', 'Health and Wellness', 499, 325, 429, 33, 8, '8901000000029', 'Pure honey for daily nutrition and wellness.', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=900&q=80'],
  ['Kapiva Apple Cider Vinegar 500ml', 'Kapiva', 'Health and Wellness', 399, 230, 329, 25, 6, '8901000000030', 'Raw apple cider vinegar with mother culture.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80']
];

const coupons = [
  ['WELCOME10', 'Percentage', 10, 199, 100, 200],
  ['KUIKLO50', 'Fixed', 50, 499, null, 150],
  ['FRESH15', 'Percentage', 15, 799, 180, 80],
  ['DAIRY25', 'Fixed', 25, 199, null, 120],
  ['CLEAN20', 'Percentage', 20, 999, 250, 60],
  ['TECH300', 'Fixed', 300, 1999, null, 40],
  ['BABY12', 'Percentage', 12, 699, 150, 70],
  ['PET100', 'Fixed', 100, 899, null, 50],
  ['HEALTH18', 'Percentage', 18, 599, 120, 90],
  ['SUPER75', 'Fixed', 75, 749, null, 100]
];

const clearSeededData = async () => {
  await Promise.all([
    Category.deleteMany({ slug: { $in: categoryNames.map(slugify) } }),
    Supplier.deleteMany({ email: { $in: suppliers.map((supplier) => supplier[2]) } }),
    Customer.deleteMany({ phone: { $in: customers.map((customer) => customer[1]) } }),
    Coupon.deleteMany({ code: { $in: coupons.map((coupon) => coupon[0]) } }),
    Product.deleteMany({ barcode: { $in: productSeeds.map((product) => product[8]) } }),
    ProductVariant.deleteMany({ sku: /^SEED-/ }),
    ProductBatch.deleteMany({ batchNumber: /^BATCH-SEED-/ }),
    Order.deleteMany({ orderNumber: /^SEED-ORD-/ }),
    OrderActivity.deleteMany({ note: /^Seed/ }),
    Transaction.deleteMany({ transactionId: /^SEED-TXN-/ }),
    Invoice.deleteMany({ invoiceNumber: /^SEED-INV-/ }),
    InventoryLog.deleteMany({ reason: /^Seed/ }),
    HeldBill.deleteMany({ referenceName: /^Seed/ }),
    Notification.deleteMany({ message: /^Seed/ })
  ]);
};

const seedDatabase = async () => {
  try {
    await connectDB();
    await clearSeededData();

    const createdUsers = [];
    for (const user of users) {
      const existing = await User.findOne({ email: user.email });
      if (existing) {
        existing.set({ ...user, password: existing.password });
        await existing.save();
        createdUsers.push(existing);
      } else {
        createdUsers.push(await User.create(user));
      }
    }

    const admin = createdUsers.find((user) => user.role === 'Admin');
    const staff = createdUsers.find((user) => user.email === 'manager@example.com') || admin;
    const riders = createdUsers.filter((user) => user.role === 'DeliveryBoy');

    const createdCategories = await Category.insertMany(
      categoryNames.map((name, index) => ({
        name,
        slug: slugify(name),
        image: imageUrl(name, 1506806732259 + index),
        status: 'Active'
      }))
    );
    const categoryByName = new Map(createdCategories.map((category) => [category.name, category]));

    const createdSuppliers = await Supplier.insertMany(
      suppliers.map(([name, phone, email, address], index) => ({
        name,
        phone,
        email,
        address,
        status: index === 9 ? 'Inactive' : 'Active'
      }))
    );

    const createdCustomers = await Customer.insertMany(
      customers.map(([name, phone, email, customerType], index) => ({
        name,
        phone,
        email,
        customerType,
        status: index === 9 ? 'Inactive' : 'Active',
        addresses: [{
          label: index % 2 === 0 ? 'Home' : 'Office',
          street: `${100 + index}, Market Street`,
          city: ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad'][index % 5],
          state: ['Maharashtra', 'Delhi', 'Karnataka', 'Maharashtra', 'Telangana'][index % 5],
          zipCode: `4000${index + 10}`,
          country: 'India'
        }]
      }))
    );

    const createdProducts = await Product.insertMany(
      productSeeds.map(([name, brand, categoryName, mrp, costPrice, sellingPrice, stock, lowStockThreshold, barcode, description, featuredImage], index) => ({
        name,
        slug: slugify(name),
        tags: [brand, categoryName, index % 2 === 0 ? 'popular' : 'daily-use'],
        brand,
        category: categoryByName.get(categoryName)._id,
        baseSku: `SEED-SKU-${String(index + 1).padStart(3, '0')}`,
        barcode,
        mrp,
        costPrice,
        sellingPrice,
        description,
        featuredImage,
        galleryImages: [featuredImage],
        stock,
        lowStockThreshold,
        isTrackInventory: true,
        isFeatured: index < 8,
        isActive: true,
        sortOrder: index + 1
      }))
    );

    const variantDocs = [];
    const batchDocs = [];
    const purchaseLogDocs = [];

    createdProducts.forEach((product, index) => {
      const variantStockA = Math.max(4, Math.floor(product.stock * 0.55));
      const variantStockB = Math.max(3, product.stock - variantStockA);
      variantDocs.push(
        {
          product: product._id,
          name: index % 2 === 0 ? 'Standard Pack' : 'Regular',
          sku: `SEED-${String(index + 1).padStart(3, '0')}-A`,
          mrp: product.mrp,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          stock: variantStockA,
          attributes: [{ key: 'Pack', value: 'Standard' }],
          isActive: true
        },
        {
          product: product._id,
          name: index % 2 === 0 ? 'Value Pack' : 'Family Pack',
          sku: `SEED-${String(index + 1).padStart(3, '0')}-B`,
          mrp: Math.round(product.mrp * 1.18),
          costPrice: Math.round(product.costPrice * 1.14),
          sellingPrice: Math.round(product.sellingPrice * 1.12),
          stock: variantStockB,
          attributes: [{ key: 'Pack', value: 'Value' }],
          isActive: true
        }
      );

      const supplier = createdSuppliers[index % createdSuppliers.length];
      const batchOneStock = Math.max(2, Math.floor(product.stock * 0.6));
      const batchTwoStock = product.stock - batchOneStock;
      const expiryOffset = index % 5 === 0 ? -3 : 20 + index * 7;

      batchDocs.push(
        {
          product: product._id,
          batchNumber: `BATCH-SEED-${String(index + 1).padStart(3, '0')}-A`,
          supplier: supplier._id,
          stock: batchOneStock,
          costPrice: product.costPrice,
          manufacturingDate: daysFromNow(-90 - index),
          expiryDate: daysFromNow(expiryOffset)
        },
        {
          product: product._id,
          batchNumber: `BATCH-SEED-${String(index + 1).padStart(3, '0')}-B`,
          supplier: supplier._id,
          stock: batchTwoStock,
          costPrice: product.costPrice,
          manufacturingDate: daysFromNow(-45 - index),
          expiryDate: daysFromNow(120 + index * 10)
        }
      );
    });

    await ProductVariant.insertMany(variantDocs);
    const createdBatches = await ProductBatch.insertMany(batchDocs);

    createdProducts.forEach((product, index) => {
      purchaseLogDocs.push({
        product: product._id,
        batch: createdBatches[index * 2]._id,
        type: 'PURCHASE',
        previousStock: 0,
        quantityChanged: product.stock,
        newStock: product.stock,
        reason: `Seed opening stock for ${product.name}`,
        user: staff._id,
        date: daysFromNow(-20 + index)
      });
    });
    await InventoryLog.insertMany(purchaseLogDocs);

    const createdCoupons = await Coupon.insertMany(
      coupons.map(([code, type, value, minimumOrderValue, maximumDiscount, usageLimit], index) => ({
        code,
        type,
        value,
        expiryDate: daysFromNow(30 + index * 9),
        minimumOrderValue,
        maximumDiscount,
        usagePerUser: index % 3 === 0 ? 2 : 1,
        usageLimit,
        usedCount: index,
        status: index === 9 ? 'Inactive' : 'Active'
      }))
    );

    const orderDocs = [];
    for (let index = 0; index < 15; index += 1) {
      const customer = createdCustomers[index % createdCustomers.length];
      const first = createdProducts[index % createdProducts.length];
      const second = createdProducts[(index + 3) % createdProducts.length];
      const firstQty = (index % 3) + 1;
      const secondQty = (index % 2) + 1;
      const items = [
        {
          product: first._id,
          productName: first.name,
          productImage: first.featuredImage,
          sku: first.baseSku,
          barcode: first.barcode,
          qty: firstQty,
          price: first.sellingPrice,
          total: firstQty * first.sellingPrice
        },
        {
          product: second._id,
          productName: second.name,
          productImage: second.featuredImage,
          sku: second.baseSku,
          barcode: second.barcode,
          qty: secondQty,
          price: second.sellingPrice,
          total: secondQty * second.sellingPrice
        }
      ];
      const subTotal = items.reduce((sum, item) => sum + item.total, 0);
      const discount = index % 4 === 0 ? 75 : index % 5 === 0 ? 100 : 0;
      const tax = Math.round(subTotal * 0.05);
      const amount = subTotal + tax - discount;
      const orderType = index % 3 === 0 ? 'OFFLINE' : 'ONLINE';
      const statusCycle = ['Pending', 'Confirmed', 'Assigned', 'OutForDelivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'];
      const status = statusCycle[index % statusCycle.length];
      const paymentStatus = ['Cancelled', 'Pending'].includes(status) ? 'Pending' : status === 'Refunded' ? 'Refunded' : status === 'Returned' ? 'PartiallyRefunded' : 'Paid';

      orderDocs.push({
        orderNumber: `SEED-ORD-${String(index + 1).padStart(5, '0')}`,
        billNumber: orderType === 'OFFLINE' ? `SEED-POS-${String(index + 1).padStart(5, '0')}` : undefined,
        orderType,
        customer: customer._id,
        status,
        paymentStatus,
        refundStatus: status === 'Refunded' ? 'Processed' : status === 'Cancelled' && orderType === 'ONLINE' ? 'Pending' : 'None',
        items,
        subTotal,
        tax,
        discount,
        amount,
        coupon: discount > 0 ? createdCoupons[index % createdCoupons.length]._id : undefined,
        assignedRider: ['Assigned', 'OutForDelivery', 'Delivered'].includes(status) ? riders[index % riders.length]?._id : undefined,
        assignedAt: ['Assigned', 'OutForDelivery', 'Delivered'].includes(status) ? daysFromNow(-index) : undefined,
        deliveredAt: status === 'Delivered' ? daysFromNow(-index + 1) : undefined,
        cancelledBy: status === 'Cancelled' ? admin._id : undefined,
        cancelledAt: status === 'Cancelled' ? daysFromNow(-index + 1) : undefined,
        cancelReason: status === 'Cancelled' ? 'Customer requested cancellation before dispatch.' : undefined,
        date: daysFromNow(-index),
        createdAt: daysFromNow(-index),
        updatedAt: daysFromNow(-index)
      });
    }

    const createdOrders = await Order.insertMany(orderDocs);

    const invoiceDocs = [];
    const transactionDocs = [];
    const orderActivityDocs = [];
    const saleLogDocs = [];

    createdOrders.forEach((order, index) => {
      invoiceDocs.push({
        invoiceNumber: `SEED-INV-${String(index + 1).padStart(5, '0')}`,
        order: order._id,
        customerSnapshot: {
          name: createdCustomers[index % createdCustomers.length].name,
          phone: createdCustomers[index % createdCustomers.length].phone,
          email: createdCustomers[index % createdCustomers.length].email
        },
        productSnapshot: order.items.map((item) => ({
          productName: item.productName,
          sku: item.sku,
          qty: item.qty,
          price: item.price,
          total: item.total
        })),
        billingAddressSnapshot: createdCustomers[index % createdCustomers.length].addresses[0],
        totalsSnapshot: {
          subTotal: order.subTotal,
          tax: order.tax,
          discount: order.discount,
          amount: order.amount
        },
        isCancelled: ['Cancelled', 'Returned', 'Refunded'].includes(order.status),
        date: order.createdAt
      });

      transactionDocs.push({
        transactionId: `SEED-TXN-${String(index + 1).padStart(6, '0')}`,
        order: order._id,
        orderType: order.orderType,
        paymentMethod: order.orderType === 'OFFLINE' ? ['Cash', 'UPI', 'Card'][index % 3] : ['UPI', 'Card', 'NetBanking', 'Wallet'][index % 4],
        paymentStatus: order.paymentStatus === 'Pending' ? 'Pending' : order.paymentStatus,
        refundStatus: order.refundStatus,
        amount: order.amount,
        refundAmount: ['Refunded', 'PartiallyRefunded'].includes(order.paymentStatus) ? Math.round(order.amount * 0.35) : 0,
        referenceNumber: `REF-SEED-${100000 + index}`,
        razorpayOrderId: order.orderType === 'ONLINE' ? `order_seed_${index + 1}` : undefined,
        razorpayPaymentId: order.orderType === 'ONLINE' && order.paymentStatus !== 'Pending' ? `pay_seed_${index + 1}` : undefined,
        razorpayRefundId: order.refundStatus === 'Processed' ? `rfnd_seed_${index + 1}` : undefined,
        paidAt: order.paymentStatus === 'Pending' ? undefined : order.createdAt
      });

      orderActivityDocs.push(
        { order: order._id, status: 'Order Created', user: staff._id, system: false, note: `Seed order ${order.orderNumber} created`, timestamp: order.createdAt },
        { order: order._id, status: order.paymentStatus === 'Pending' ? 'Order Created' : 'Payment Received', user: staff._id, system: true, note: `Seed payment status ${order.paymentStatus}`, timestamp: daysFromNow(-index + 0.1) }
      );

      if (['Delivered', 'Returned', 'Refunded'].includes(order.status)) {
        orderActivityDocs.push({ order: order._id, status: 'Delivered', user: riders[index % riders.length]?._id, system: false, note: `Seed delivered order ${order.orderNumber}`, timestamp: daysFromNow(-index + 0.4) });
      }
      if (order.status === 'Cancelled') {
        orderActivityDocs.push({ order: order._id, status: 'Cancelled', user: admin._id, system: false, note: `Seed cancelled order ${order.orderNumber}`, timestamp: daysFromNow(-index + 0.3) });
      }

      order.items.forEach((item) => {
        saleLogDocs.push({
          product: item.product,
          type: 'SALE',
          previousStock: 100,
          quantityChanged: -item.qty,
          newStock: 100 - item.qty,
          reason: `Seed sale for ${order.orderNumber}`,
          user: staff._id,
          order: order._id,
          date: order.createdAt
        });
      });
    });

    await Promise.all([
      Invoice.insertMany(invoiceDocs),
      Transaction.insertMany(transactionDocs),
      OrderActivity.insertMany(orderActivityDocs),
      InventoryLog.insertMany(saleLogDocs)
    ]);

    for (const customer of createdCustomers) {
      const customerOrders = createdOrders.filter((order) => String(order.customer) === String(customer._id));
      customer.totalOrders = customerOrders.length;
      customer.totalSpent = customerOrders.reduce((sum, order) => sum + (order.paymentStatus === 'Pending' ? 0 : order.amount), 0);
      await customer.save();
    }

    await HeldBill.insertMany(
      Array.from({ length: 10 }).map((_, index) => {
        const product = createdProducts[index % createdProducts.length];
        return {
          staffId: staff._id,
          customer: createdCustomers[index % createdCustomers.length]._id,
          referenceName: `Seed Hold Bill ${index + 1}`,
          items: [{
            productId: product._id,
            productName: product.name,
            sku: product.baseSku,
            barcode: product.barcode,
            price: product.sellingPrice,
            qty: (index % 3) + 1,
            total: product.sellingPrice * ((index % 3) + 1)
          }],
          totals: {
            subTotal: product.sellingPrice * ((index % 3) + 1),
            tax: 0,
            discount: 0,
            amount: product.sellingPrice * ((index % 3) + 1)
          }
        };
      })
    );

    await Notification.insertMany([
      ...createdProducts.slice(0, 4).map((product) => ({
        type: 'Low Stock',
        message: `Seed low stock alert for ${product.name}`,
        product: product._id,
        isRead: false
      })),
      ...createdBatches.slice(0, 4).map((batch) => ({
        type: 'Expiring Product',
        message: `Seed expiry alert for batch ${batch.batchNumber}`,
        product: batch.product,
        batch: batch._id,
        isRead: false
      })),
      ...createdOrders.slice(0, 4).map((order) => ({
        type: order.status === 'Cancelled' ? 'Cancelled Order' : 'New Order',
        message: `Seed notification for ${order.orderNumber}`,
        order: order._id,
        isRead: false
      }))
    ]);

    await Settings.findOneAndUpdate(
      {},
      {
        storeName: 'Kuiklo Supermart',
        storeLogo: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=400&q=80',
        address: 'Kuiklo Supermart, Sector 18 Market, Noida, Uttar Pradesh 201301',
        gstNumber: '09AAACK1234A1Z5',
        invoicePrefixOnline: 'INV-2026-',
        invoicePrefixOffline: 'POS-2026-',
        invoiceFooter: 'Thank you for shopping with Kuiklo. Returns accepted as per store policy.',
        lowStockThresholdDefault: 10,
        expiryAlertDays: [30, 15, 10, 5]
      },
      { upsert: true, new: true }
    );

    console.log('Seed completed successfully.');
    console.log('Login: admin@example.com / password');
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Categories: ${createdCategories.length}`);
    console.log(`Suppliers: ${createdSuppliers.length}`);
    console.log(`Customers: ${createdCustomers.length}`);
    console.log(`Products: ${createdProducts.length}`);
    console.log(`Variants: ${variantDocs.length}`);
    console.log(`Batches: ${createdBatches.length}`);
    console.log(`Coupons: ${createdCoupons.length}`);
    console.log(`Orders: ${createdOrders.length}`);
    console.log(`Transactions: ${transactionDocs.length}`);
    console.log(`Invoices: ${invoiceDocs.length}`);
    console.log(`Inventory logs: ${purchaseLogDocs.length + saleLogDocs.length}`);
    console.log('Database is ready for frontend testing.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();

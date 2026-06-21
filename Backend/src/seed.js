import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDB();
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminExists) {
      const adminUser = new User({
        name: 'Super Admin',
        email: 'admin@example.com',
        phone: '1234567890',
        password: 'password', // will be hashed by pre-save hook
        role: 'Admin',
        status: 'Active',
        permissions: {
          products: true,
          inventory: true,
          orders: true,
          coupons: true,
          pos: true,
          reports: true,
          payments: true
        }
      });
      await adminUser.save();
      console.log('✅ Admin User seeded (admin@example.com / password)');
    } else {
      console.log('⚠️ Admin User already exists, skipping.');
    }

    const staffExists = await User.findOne({ email: 'staff@example.com' });
    if (!staffExists) {
      const staffUser = new User({
        name: 'Store Staff',
        email: 'staff@example.com',
        phone: '1234567891',
        password: 'password',
        role: 'Staff',
        status: 'Active',
        permissions: {
          products: true,
          inventory: false,
          orders: true,
          coupons: false,
          pos: true,
          reports: false,
          payments: false
        }
      });
      await staffUser.save();
      console.log('✅ Staff User seeded (staff@example.com / password)');
    }

    const deliveryExists = await User.findOne({ email: 'delivery@example.com' });
    if (!deliveryExists) {
      const deliveryUser = new User({
        name: 'Delivery Partner',
        email: 'delivery@example.com',
        phone: '1234567892',
        password: 'password',
        role: 'DeliveryBoy',
        status: 'Active',
        permissions: {
          products: false,
          inventory: false,
          orders: true,
          coupons: false,
          pos: false,
          reports: false,
          payments: false
        }
      });
      await deliveryUser.save();
      console.log('✅ Delivery User seeded (delivery@example.com / password)');
    }

    console.log('🌱 Database Seeding Completed!');
    process.exit();
  } catch (error) {
    console.error('❌ Seeding Error: ', error);
    process.exit(1);
  }
};

seedUsers();

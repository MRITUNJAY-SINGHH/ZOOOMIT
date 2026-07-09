import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OrderService from './services/OrderService.js';
import Order from './models/Order.js';

dotenv.config({ path: './.env' });

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const order = await Order.findOne();
    if (!order) return console.log('No order found');

    const fakeUserId = new mongoose.Types.ObjectId();
    const fakeRiderId = new mongoose.Types.ObjectId();

    console.log(`Current status: ${order.status}`);
    
    order.status = 'Confirmed';
    await order.save();
    
    await OrderService.assignRider(order._id, fakeRiderId, fakeUserId);
    console.log('1. Successfully assigned rider!');

    await OrderService.updateOrderStatus(order._id, 'OutForDelivery', fakeUserId, 'Testing');
    console.log('2. Successfully marked OutForDelivery!');

    await OrderService.updateOrderStatus(order._id, 'Delivered', fakeUserId, 'Testing');
    console.log('3. Successfully marked Delivered!');

    console.log('All transitions successful!');
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();

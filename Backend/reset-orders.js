import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function resetOrders() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // Reset all orders to Pending, remove rider assignments
  const result = await db.collection('orders').updateMany(
    {},
    {
      $set: {
        status: 'Pending',
        paymentStatus: 'Pending',
        assignedRider: null,
        assignedAt: null,
        deliveredAt: null,
        cancelledBy: null,
        cancelledAt: null,
        cancelReason: null,
        refundStatus: 'None'
      }
    }
  );

  console.log(`✅ Reset ${result.modifiedCount} orders back to Pending.`);

  // Clear all order activity/timeline logs
  const activityResult = await db.collection('orderactivities').deleteMany({});
  console.log(`✅ Cleared ${activityResult.deletedCount} activity logs.`);

  await mongoose.disconnect();
  console.log('Done! All orders are fresh and ready for re-testing.');
  process.exit(0);
}

resetOrders().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

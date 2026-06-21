import cron from 'node-cron';
import RefundQueue from '../models/RefundQueue.js';
import PaymentService from './PaymentService.js';
import Transaction from '../models/Transaction.js';

export const startWorkers = () => {
  // Retry pending/failed refunds every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const pendingRefunds = await RefundQueue.find({ status: { $in: ['Pending', 'Retrying'] } });
      if (pendingRefunds.length === 0) return;

      console.log(`[Worker] Found ${pendingRefunds.length} pending refunds. Processing...`);

      for (const refund of pendingRefunds) {
        if (refund.attempts >= 3) {
          refund.status = 'Failed';
          await refund.save();
          continue;
        }

        refund.status = 'Retrying';
        refund.attempts += 1;
        refund.lastAttemptAt = new Date();
        await refund.save();

        try {
          const success = await PaymentService.processRefund(refund.transaction, refund.amount);
          
          if (success) {
            refund.status = 'Processed';
            await refund.save();
            
            // Clean up: delete successful queue item to prevent bloated table
            await RefundQueue.findByIdAndDelete(refund._id);
          } else {
            // Revert back to pending so it can be retried
            refund.status = 'Pending';
            await refund.save();
          }
        } catch (error) {
          refund.errorReason = error.message;
          refund.status = 'Pending';
          await refund.save();
        }
      }
    } catch (error) {
      console.error('[Worker] Refund queue error:', error);
    }
  });
};

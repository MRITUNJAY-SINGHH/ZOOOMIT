import Razorpay from 'razorpay';
import Transaction from '../models/Transaction.js';
import Order from '../models/Order.js';

class PaymentService {
  constructor() {
    this.razorpay = null;
    this.initialize();
  }

  initialize() {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
  }

  /**
   * Process refund via Razorpay
   * Non-blocking: Catch errors internally to allow order state flow to continue
   */
  async processRefund(transactionId, amount) {
    if (!this.razorpay) {
      console.error('Razorpay not initialized. Missing API keys.');
      return false;
    }

    try {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction || !transaction.razorpayPaymentId) {
        console.error('Cannot refund: Transaction or Razorpay Payment ID missing.');
        return false;
      }

      // Convert amount to paisa
      const refundOptions = {
        payment_id: transaction.razorpayPaymentId,
        amount: Math.round(amount * 100),
        receipt: `ref_${transactionId}`
      };

      const refund = await this.razorpay.payments.refund(refundOptions.payment_id, refundOptions);

      // Update Transaction
      transaction.razorpayRefundId = refund.id;
      transaction.refundStatus = 'Processed';
      transaction.refundAmount += amount;
      
      if (transaction.refundAmount >= transaction.amount) {
        transaction.paymentStatus = 'Refunded';
      } else {
        transaction.paymentStatus = 'PartiallyRefunded';
      }
      await transaction.save();

      return true;
    } catch (error) {
      console.error('Razorpay Refund API Error:', error);
      
      // Mark transaction refund attempt failed
      const transaction = await Transaction.findById(transactionId);
      if (transaction) {
        transaction.refundStatus = 'Failed';
        await transaction.save();
        
        const { default: NotificationService } = await import('./NotificationService.js');
        await NotificationService.createNotification({
          type: 'Refund Failure',
          message: `Razorpay refund failed for Transaction ${transaction.transactionId}. Queued for retry.`,
          order: transaction.order
        });
      }

      // Enqueue for retry
      const { default: RefundQueue } = await import('../models/RefundQueue.js');
      await RefundQueue.create({
        transaction: transactionId,
        amount: amount,
        errorReason: error.message
      });
      return false;
    }
  }
}

export default new PaymentService();

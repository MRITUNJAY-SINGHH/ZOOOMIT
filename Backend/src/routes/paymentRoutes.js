import express from 'express';
import crypto from 'crypto';
import Transaction from '../models/Transaction.js';
import Order from '../models/Order.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('payments'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.transactionId = { $regex: search, $options: 'i' };
    }

    const total = await Transaction.countDocuments(query);
    const txns = await Transaction.find(query)
      .sort('-createdAt')
      .populate('order', 'orderNumber status')
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      data: txns,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(200).send('Webhook secret not configured');

    const signature = req.headers['x-razorpay-signature'];
    const eventId = req.headers['x-razorpay-event-id'];
    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    if (eventId) {
      const { default: ProcessedWebhook } = await import('../models/ProcessedWebhook.js');
      const processed = await ProcessedWebhook.findOne({ webhookId: eventId });
      if (processed) return res.status(200).send('Already processed');
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const orderId = payment.order_id;
      
      const transaction = await Transaction.findOne({ razorpayOrderId: orderId });
      if (transaction) {
        transaction.paymentStatus = 'Paid';
        transaction.razorpayPaymentId = payment.id;
        transaction.paidAt = new Date();
        await transaction.save();

        const order = await Order.findById(transaction.order);
        if (order) {
          order.paymentStatus = 'Paid';
          await order.save();
        }
      }
    } else if (event === 'refund.processed') {
      const refund = payload.refund.entity;
      const paymentId = refund.payment_id;

      const transaction = await Transaction.findOne({ razorpayPaymentId: paymentId });
      if (transaction) {
        transaction.refundStatus = 'Processed';
        transaction.razorpayRefundId = refund.id;
        
        // Note: Actual refundAmount logic is handled by PaymentService during request,
        // but webhook confirms success state.
        if (transaction.refundAmount >= transaction.amount) {
          transaction.paymentStatus = 'Refunded';
        } else if (transaction.refundAmount > 0) {
          transaction.paymentStatus = 'PartiallyRefunded';
        }
        await transaction.save();

        const order = await Order.findById(transaction.order);
        if (order) {
          order.refundStatus = 'Processed';
          order.paymentStatus = transaction.paymentStatus;
          await order.save();
        }
      }
    } else if (event === 'refund.failed') {
      const refund = payload.refund.entity;
      const paymentId = refund.payment_id;

      const transaction = await Transaction.findOne({ razorpayPaymentId: paymentId });
      if (transaction) {
        transaction.refundStatus = 'Failed';
        await transaction.save();

        const order = await Order.findById(transaction.order);
        if (order) {
          order.refundStatus = 'Failed';
          await order.save();
        }
      }
    }

    if (eventId) {
      const { default: ProcessedWebhook } = await import('../models/ProcessedWebhook.js');
      await ProcessedWebhook.create({ webhookId: eventId, event: event });
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

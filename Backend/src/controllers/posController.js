import mongoose from 'mongoose';
import HeldBill from '../models/HeldBill.js';
import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import ProductBatch from '../models/ProductBatch.js';
import InventoryLog from '../models/InventoryLog.js';
import ReturnDocument from '../models/ReturnDocument.js';
import Settings from '../models/Settings.js';
import InventoryService from '../services/InventoryService.js';
import { clearReportsCache } from '../utils/cache.js';
import { roundTo, multiply, calculateTax } from '../utils/decimalUtils.js';

// --- OFFLINE SYNC LOGIC ---

export const posSync = async (req, res) => {
  const { offlineOrders } = req.body;
  if (!Array.isArray(offlineOrders)) return res.status(400).json({ message: 'offlineOrders must be an array' });

  let successCount = 0;
  let failedOrders = [];

  for (const order of offlineOrders) {
    try {
      let responseData = null;
      let statusCode = 200;
      
      const mockReq = { 
        body: order.payload, 
        user: req.user 
      };
      
      const mockRes = {
        status: (code) => { statusCode = code; return mockRes; },
        json: (data) => { responseData = data; }
      };

      await posCheckout(mockReq, mockRes);

      if (statusCode >= 200 && statusCode < 300) {
        successCount++;
      } else {
        throw new Error(responseData?.message || 'Sync failed');
      }
    } catch (e) {
      failedOrders.push({
        ...order,
        error: e.message
      });
    }
  }

  console.log(`[SYNC] Offline Queue Processed: ${successCount} Success, ${failedOrders.length} Failed.`);
  res.json({ successCount, failedOrders });
};

// --- HOLD BILL LOGIC ---

export const holdBill = async (req, res) => {
  try {
    const { referenceName, customer, items, totals } = req.body;
    const heldBill = await HeldBill.create({
      staffId: req.user._id,
      customer: customer || null,
      referenceName,
      items,
      totals
    });
    res.status(201).json(heldBill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHeldBills = async (req, res) => {
  try {
    const bills = await HeldBill.find({ staffId: req.user._id }).populate('customer', 'name phone');
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resumeBill = async (req, res) => {
  try {
    const bill = await HeldBill.findById(req.params.id).populate('customer', 'name phone');
    if (!bill) return res.status(404).json({ message: 'Held bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHeldBill = async (req, res) => {
  try {
    await HeldBill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Held bill deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- TRANSACTIONAL CHECKOUT LOGIC ---

export const posCheckout = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let resultPayload;

    await session.withTransaction(async () => {
      let { customer, customerSnapshot, customerAddress, items, discount = 0, paymentMethod = 'Cash', offlineId } = req.body;

      if (!items || items.length === 0) {
        throw new Error('Cannot checkout an empty cart');
      }

      // Idempotency Check
      if (offlineId) {
        const existingOrder = await Order.findOne({ offlineId }).session(session);
        if (existingOrder) {
          const invoice = await Invoice.findOne({ order: existingOrder._id }).session(session);
          const transaction = await Transaction.findOne({ order: existingOrder._id }).session(session);
          throw { isIdempotent: true, order: existingOrder, invoice, transaction };
        }
      }

      // Fetch Settings
      const settings = await Settings.findOne().session(session) || {};
      const taxMode = settings.taxMode || 'INCLUSIVE';

      // Customer Lookup or Auto-Creation
      if (!customer && customerSnapshot && customerSnapshot.phone) {
        const Customer = (await import('../models/Customer.js')).default;
        let existingCustomer = await Customer.findOne({ phone: customerSnapshot.phone }).session(session);
        
        if (existingCustomer) {
          customer = existingCustomer._id;
          if (customerAddress && existingCustomer.addresses.length === 0) {
            existingCustomer.addresses.push({ label: 'Billing/Shipping', ...customerAddress });
            await existingCustomer.save({ session });
          }
        } else {
          const newCustomer = new Customer({
            name: customerSnapshot.name || 'Walk-in',
            phone: customerSnapshot.phone,
            email: customerSnapshot.email,
            customerType: 'WALK_IN',
            addresses: customerAddress ? [{ label: 'Billing/Shipping', ...customerAddress }] : []
          });
          await newCustomer.save({ session });
          customer = newCustomer._id;
        }
      }

      // 1. Process items and calculate exact GST breakdowns
      let computedSubTotal = 0;
      let computedTaxable = 0;
      let computedTax = 0;
      let computedCgst = 0;
      let computedSgst = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.productId || item.product).session(session);
        if (!product) throw new Error(`Product ${item.productId || item.product} not found`);

        const unitPrice = Number(item.price !== undefined ? item.price : product.sellingPrice);
        const qty = roundTo(item.qty, 3);
        const lineGross = multiply(unitPrice, qty, 2);
        const taxRate = Number(product.taxRate) || 0;

        const taxCalc = calculateTax(unitPrice, qty, taxRate, taxMode);

        computedSubTotal = roundTo(computedSubTotal + lineGross, 2);
        computedTaxable = roundTo(computedTaxable + taxCalc.taxableAmount, 2);
        computedTax = roundTo(computedTax + taxCalc.taxAmount, 2);
        computedCgst = roundTo(computedCgst + taxCalc.cgst, 2);
        computedSgst = roundTo(computedSgst + taxCalc.sgst, 2);

        orderItems.push({
          product: product._id,
          variant: item.variantId || item.variant || null,
          productName: product.name,
          productImage: product.featuredImage || (product.galleryImages && product.galleryImages[0]) || '',
          sku: product.baseSku,
          barcode: product.barcode,
          unit: item.unit || product.sellingUnit || product.baseUnit || 'PCS',
          qty,
          price: unitPrice,
          taxRate,
          taxableAmount: taxCalc.taxableAmount,
          taxAmount: taxCalc.taxAmount,
          hsnCode: product.hsnCode || '',
          total: taxMode === 'EXCLUSIVE' ? taxCalc.totalAmount : lineGross
        });
      }

      const totalDiscount = Number(discount) || 0;
      const finalAmount = taxMode === 'EXCLUSIVE' 
        ? roundTo(computedTaxable + computedTax - totalDiscount, 2)
        : roundTo(computedSubTotal - totalDiscount, 2);

      // 2. Generate Numbers
      const Sequence = (await import('../models/Sequence.js')).default;
      const orderSeq = await Sequence.getNextValue('Order', session);
      const orderNumber = `ORD-2026-${orderSeq.toString().padStart(5, '0')}`;
      
      const posSeq = await Sequence.getNextValue('POS', session);
      const prefixOffline = settings.invoicePrefixOffline || 'POS-2026-';
      const billNumber = `${prefixOffline}${posSeq.toString().padStart(6, '0')}`;

      // 3. Create Order
      const order = new Order({
        orderNumber,
        billNumber,
        orderType: 'OFFLINE',
        customer: customer || null,
        items: orderItems,
        subTotal: computedSubTotal,
        taxableAmount: computedTaxable,
        tax: computedTax,
        cgst: computedCgst,
        sgst: computedSgst,
        igst: computedTax,
        discount: totalDiscount,
        amount: finalAmount,
        status: 'Delivered',
        paymentStatus: 'Paid',
        offlineId
      });
      await order.save({ session });

      // 4. Deduct Inventory via InventoryService
      await InventoryService.reduceStockForSale(orderItems, req.user._id, order._id, session);

      // 5. Create Transaction
      const transactionId = `TXN-${Date.now()}`;
      const transaction = new Transaction({
        transactionId,
        order: order._id,
        orderType: 'OFFLINE',
        paymentMethod,
        paymentStatus: 'Paid',
        amount: finalAmount,
        paidAt: new Date()
      });
      await transaction.save({ session });

      // 6. Create Invoice
      const invoiceSeq = await Sequence.getNextValue('Invoice', session);
      const prefixOnline = settings.invoicePrefixOnline || 'INV-2026-';
      const invoiceNumber = `${prefixOnline}${invoiceSeq.toString().padStart(6, '0')}`;

      const invoice = new Invoice({
        invoiceNumber,
        order: order._id,
        paymentMethod,
        status: 'Paid',
        customerSnapshot: {
          name: customerSnapshot?.name || (customer ? (await (await import('../models/Customer.js')).default.findById(customer).session(session))?.name : 'Walk-in'),
          phone: customerSnapshot?.phone,
          email: customerSnapshot?.email
        },
        billingAddressSnapshot: customerAddress ? { street: customerAddress.street, city: customerAddress.city, state: customerAddress.state, zipCode: customerAddress.zipCode } : {},
        shippingAddressSnapshot: customerAddress ? { street: customerAddress.street, city: customerAddress.city, state: customerAddress.state, zipCode: customerAddress.zipCode } : {},
        productSnapshot: orderItems.map(i => ({
          productId: i.product,
          productName: i.productName,
          sku: i.sku,
          unit: i.unit,
          hsnCode: i.hsnCode,
          qty: i.qty,
          price: i.price,
          taxRate: i.taxRate,
          taxableAmount: i.taxableAmount,
          taxAmount: i.taxAmount,
          total: i.total
        })),
        totalsSnapshot: {
          subTotal: computedSubTotal,
          taxableAmount: computedTaxable,
          tax: computedTax,
          cgst: computedCgst,
          sgst: computedSgst,
          igst: computedTax,
          discount: totalDiscount,
          amount: finalAmount
        },
        notes: settings.invoiceFooter || 'Thank you for shopping with us!'
      });
      await invoice.save({ session });

      resultPayload = { order, invoice, transaction };
    });

    clearReportsCache();
    res.status(201).json(resultPayload);
  } catch (error) {
    if (error.isIdempotent) {
      return res.status(200).json({
        message: 'Order already processed (idempotent)',
        order: error.order,
        invoice: error.invoice,
        transaction: error.transaction
      });
    }
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// --- POS RETURN LOGIC ---

export const posReturn = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let returnDocResult;

    await session.withTransaction(async () => {
      const { orderId, returnItems, reason, refundMethod } = req.body;
      
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new Error('Order not found');

      let totalRefundAmount = 0;
      const processedReturnItems = [];

      for (const retItem of returnItems) {
        const itemIndex = order.items.findIndex(i => i.product.toString() === (retItem.productId || retItem.product).toString());
        if (itemIndex === -1) throw new Error(`Item ${retItem.productId} not found in this order`);

        const orderItem = order.items[itemIndex];
        const returnQty = roundTo(retItem.quantity || retItem.qty, 3);
        const maxReturnable = roundTo(orderItem.qty - (orderItem.returnedQty || 0), 3);

        if (returnQty > maxReturnable) {
          throw new Error(`Cannot return ${returnQty} ${orderItem.unit || 'units'} of ${orderItem.productName}. Maximum returnable is ${maxReturnable}`);
        }

        const refundPerUnit = divide(orderItem.total, orderItem.qty, 2);
        const itemRefundAmount = multiply(returnQty, refundPerUnit, 2);
        totalRefundAmount = roundTo(totalRefundAmount + itemRefundAmount, 2);

        // Update returnedQty on order
        order.items[itemIndex].returnedQty = roundTo((order.items[itemIndex].returnedQty || 0) + returnQty, 3);

        // Restock inventory batch
        await InventoryService.returnStock(
          orderItem.product, 
          orderItem.variant, 
          null, 
          returnQty, 
          `POS Return: ${order.orderNumber}`, 
          req.user._id, 
          order._id, 
          session
        );

        processedReturnItems.push({
          product: orderItem.product,
          productName: orderItem.productName,
          unit: orderItem.unit,
          qtyReturned: returnQty,
          price: orderItem.price,
          refundAmount: itemRefundAmount
        });
      }

      // Check if full return or partial return
      const totalOriginalQty = order.items.reduce((acc, i) => acc + i.qty, 0);
      const totalReturnedQty = order.items.reduce((acc, i) => acc + (i.returnedQty || 0), 0);
      
      if (totalReturnedQty >= totalOriginalQty) {
        order.status = 'Returned';
        order.paymentStatus = 'Refunded';
      } else {
        order.paymentStatus = 'PartiallyRefunded';
      }
      await order.save({ session });

      // Generate Return Document
      const Sequence = (await import('../models/Sequence.js')).default;
      const returnSeq = await Sequence.getNextValue('ReturnDocument', session);
      const documentNumber = `RET-${new Date().getFullYear()}-${returnSeq.toString().padStart(6, '0')}`;

      const returnDoc = new ReturnDocument({
        documentNumber,
        order: order._id,
        customerSnapshot: { name: 'Customer' },
        items: processedReturnItems,
        refundAmount: totalRefundAmount,
        refundMethod: refundMethod || 'Cash',
        reason: reason || 'Customer Return',
        processedBy: req.user._id
      });
      await returnDoc.save({ session });

      returnDocResult = { returnDoc, order };
    });

    clearReportsCache();
    res.status(201).json(returnDocResult);
  } catch (error) {
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

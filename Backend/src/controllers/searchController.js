import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

export const globalSearch = async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query) {
      return res.status(200).json({ products: [], orders: [], customers: [], invoices: [] });
    }

    const regex = new RegExp(query, 'i');
    const limit = 5;

    const [products, orders, customers, invoices] = await Promise.all([
      Product.find({
        $or: [{ name: regex }, { sku: regex }, { brand: regex }, { 'category.name': regex }]
      })
        .select('name sku sellingPrice featuredImage brand category')
        .limit(limit)
        .lean(),

      Order.find({
        $or: [{ orderNumber: regex }, { billNumber: regex }]
      })
        .select('orderNumber billNumber status totalAmount createdAt customer orderType')
        .limit(limit)
        .lean(),

      Customer.find({
        $or: [{ name: regex }, { phone: regex }, { email: regex }]
      })
        .select('name phone email type')
        .limit(limit)
        .lean(),

      Invoice.find({
        invoiceNumber: regex
      })
        .select('invoiceNumber createdAt "totalsSnapshot.amount"')
        .limit(limit)
        .lean()
    ]);

    res.status(200).json({
      products,
      orders,
      customers,
      invoices
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Global search failed' });
  }
};

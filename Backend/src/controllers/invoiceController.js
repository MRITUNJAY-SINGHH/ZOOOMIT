import Invoice from '../models/Invoice.js';

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  try {
    const { search, status, order, page = 1, limit = 15 } = req.query;
    
    let query = {};
    
    // If querying by order, we might want cancelled invoices too
    if (order) {
      query.order = order;
    } else {
      query.isCancelled = false;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.email': { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
      
    const total = await Invoice.countDocuments(query);

    res.json({
      invoices,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('order');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new invoice (manual/standalone)
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req, res) => {
  try {
    const { 
      invoiceDate, 
      dueDate, 
      paymentMethod, 
      customerSnapshot, 
      billingAddressSnapshot, 
      shippingAddressSnapshot, 
      productSnapshot, 
      totalsSnapshot, 
      notes,
      currency,
      status
    } = req.body;

    // Generate Invoice Number
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(6, '0')}`;

    const invoice = new Invoice({
      invoiceNumber,
      date: invoiceDate || Date.now(),
      dueDate,
      paymentMethod,
      customerSnapshot,
      billingAddressSnapshot,
      shippingAddressSnapshot,
      productSnapshot,
      totalsSnapshot,
      notes,
      currency: currency || 'INR',
      status: status || 'Draft'
    });

    const createdInvoice = await invoice.save();
    res.status(201).json(createdInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { 
      invoiceDate,
      dueDate, 
      paymentMethod, 
      customerSnapshot, 
      billingAddressSnapshot, 
      shippingAddressSnapshot, 
      productSnapshot, 
      totalsSnapshot, 
      notes,
      currency,
      status 
    } = req.body;

    if (invoiceDate) invoice.date = invoiceDate;
    if (dueDate) invoice.dueDate = dueDate;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (customerSnapshot) invoice.customerSnapshot = customerSnapshot;
    if (billingAddressSnapshot) invoice.billingAddressSnapshot = billingAddressSnapshot;
    if (shippingAddressSnapshot) invoice.shippingAddressSnapshot = shippingAddressSnapshot;
    if (productSnapshot) invoice.productSnapshot = productSnapshot;
    if (totalsSnapshot) invoice.totalsSnapshot = totalsSnapshot;
    if (notes !== undefined) invoice.notes = notes;
    if (currency) invoice.currency = currency;
    if (status) invoice.status = status;

    const updatedInvoice = await invoice.save();
    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete invoice (soft delete)
// @route   DELETE /api/invoices/:id
// @access  Private
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Instead of actual delete, we mark as cancelled so historical data isn't destroyed
    invoice.isCancelled = true;
    invoice.status = 'Cancelled';
    await invoice.save();
    
    res.json({ message: 'Invoice removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk delete invoices
// @route   POST /api/invoices/bulk-delete
// @access  Private
export const bulkDeleteInvoices = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No invoice IDs provided' });
    }

    await Invoice.updateMany(
      { _id: { $in: ids } },
      { $set: { isCancelled: true, status: 'Cancelled' } }
    );
    
    res.json({ message: 'Invoices deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Old pdf method moved to pdfController.js

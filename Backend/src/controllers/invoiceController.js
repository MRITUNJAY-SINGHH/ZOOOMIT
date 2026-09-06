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

// @desc    Generate PDF for Invoice
// @route   GET /api/invoices/:id/pdf
// @access  Private
export const generateInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('order');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Attempt to dynamically load puppeteer to prevent crashing if not fully installed yet
    let puppeteer;
    try {
      puppeteer = await import('puppeteer');
    } catch (e) {
      return res.status(500).json({ message: 'PDF generation library not installed properly.' });
    }

    // Generate minimal HTML for the invoice
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { margin: 0; font-size: 28px; }
          .details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
          th { background-color: #f9f9f9; }
          .text-right { text-align: right; }
          .total-section { float: right; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .total-row.grand { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; margin-top: 5px; padding-top: 10px; }
          .clear { clear: both; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>#${invoice.invoiceNumber}</p>
        </div>
        
        <div class="details">
          <strong>Billed To:</strong><br>
          ${invoice.customerSnapshot?.name || 'Walk-in Customer'}<br>
          ${invoice.customerSnapshot?.phone || ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.productSnapshot.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.qty}</td>
                <td class="text-right">₹${item.price}</td>
                <td class="text-right">₹${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-row"><span>Subtotal:</span><span>₹${invoice.totalsSnapshot.subTotal}</span></div>
          <div class="total-row"><span>Tax:</span><span>₹${invoice.totalsSnapshot.tax}</span></div>
          <div class="total-row"><span>Discount:</span><span>₹${invoice.totalsSnapshot.discount}</span></div>
          <div class="total-row grand"><span>Total:</span><span>₹${invoice.totalsSnapshot.amount}</span></div>
        </div>
        <div class="clear"></div>
      </body>
      </html>
    `;

    const browser = await puppeteer.default.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${invoice.invoiceNumber}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Gen error:', error);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};

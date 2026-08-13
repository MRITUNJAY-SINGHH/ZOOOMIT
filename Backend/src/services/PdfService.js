import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http';

export default class PdfService {

  // --- External Image Fetcher ---
  static async fetchImageBuffer(url) {
    if (!url) return null;
    const client = url.startsWith('https') ? https : http;
    return new Promise((resolve) => {
      client.get(url, (res) => {
        if (res.statusCode !== 200) return resolve(null);
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      }).on('error', () => resolve(null));
    });
  }

  static formatCurrency(amount) {
    return 'Rs. ' + Number(amount).toFixed(2);
  }

  // --- Main PDF Entry Points ---

  static async generateInvoicePdf(invoice, settings, options = { format: 'a4' }) {
    return new Promise(async (resolve) => {
      const isPos = options.format === 'pos';

      let doc;
      if (isPos) {
        // POS: 80mm width is 226.77 points. Height depends on items.
        const itemCount = invoice.productSnapshot?.length || 1;
        // Estimate height: Header (150) + Items (count * 25) + Totals (150) + Footer (100) + Margin
        const posHeight = 350 + (itemCount * 30); 
        doc = new PDFDocument({ margin: 10, size: [226.77, posHeight] });
      } else {
        // Standard A4
        doc = new PDFDocument({ margin: 40, size: 'A4' });
      }

      // Resolve early to start streaming
      resolve(doc);

      const logoBuffer = await this.fetchImageBuffer(settings?.storeLogo);
      const signatureBuffer = await this.fetchImageBuffer(settings?.authorizedSignature);

      const data = {
        title: 'INVOICE',
        refNo: invoice.invoiceNumber,
        date: invoice.createdAt,
        customerSnapshot: invoice.customerSnapshot,
        billingAddressSnapshot: invoice.billingAddressSnapshot,
        shippingAddressSnapshot: invoice.shippingAddressSnapshot,
        paymentMethod: invoice.paymentMethod,
        status: invoice.status,
        notes: invoice.notes,
        productSnapshot: invoice.productSnapshot,
        totalsSnapshot: invoice.totalsSnapshot
      };

      if (isPos) {
        await this.generatePosLayout(doc, data, settings, logoBuffer);
      } else {
        await this.generateA4Layout(doc, data, settings, logoBuffer, signatureBuffer);
      }

      doc.end();
    });
  }

  static async generateCancelledPdf(cancelledDoc, settings) {
    return new Promise(async (resolve) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      resolve(doc);

      // Watermark
      doc.save().fontSize(80).fillOpacity(0.1).fillColor('red')
         .translate(100, 300).rotate(-45)
         .text('CANCELLED', { align: 'center' }).restore();

      const snap = cancelledDoc.snapshot;
      const logoBuffer = await this.fetchImageBuffer(settings?.storeLogo);

      const data = {
        title: 'CANCELLATION',
        refNo: cancelledDoc.documentNumber,
        date: cancelledDoc.createdAt,
        customerSnapshot: snap.customer,
        paymentMethod: snap.paymentStatus,
        status: 'Cancelled',
        notes: `Reason: ${cancelledDoc.cancellationReason}`,
        productSnapshot: snap.items.map(i => ({
          productName: i.productName, sku: i.sku || 'N/A', qty: i.qty, price: i.price, total: i.qty * i.price
        })),
        totalsSnapshot: { subTotal: snap.subTotal, tax: snap.tax, discount: snap.discount, amount: snap.amount }
      };

      await this.generateA4Layout(doc, data, settings, logoBuffer, null);
      doc.end();
    });
  }

  static async generateReturnPdf(returnDoc, settings) {
    return new Promise(async (resolve) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      resolve(doc);

      const logoBuffer = await this.fetchImageBuffer(settings?.storeLogo);
      
      this.generateA4Header(doc, settings, logoBuffer, 'RETURN RECEIPT', returnDoc.documentNumber, returnDoc.createdAt);

      doc.fontSize(10).fillColor('#333')
         .text(`Original Ref: ${returnDoc.originalInvoiceNumber || 'N/A'}`, 40, 160)
         .text(`Return Reason: ${returnDoc.returnReason || 'N/A'}`, 40, 175)
         .text(`Refund Status: ${returnDoc.refundStatus} via ${returnDoc.refundMethod || 'N/A'}`, 40, 190);

      doc.moveDown(2);

      let position = 230;
      doc.font('Helvetica-Bold');
      doc.fontSize(10)
         .text('No.', 40, position, { width: 30, align: 'left' })
         .text('Product', 70, position, { width: 180, align: 'left' })
         .text('Orig Qty', 250, position, { width: 60, align: 'center' })
         .text('Ret Qty', 310, position, { width: 60, align: 'center' })
         .text('Price', 370, position, { width: 70, align: 'right' })
         .text('Refund Amt', 440, position, { width: 90, align: 'right' });
      this.generateHr(doc, position + 15);
      
      doc.font('Helvetica');
      position += 25;

      returnDoc.returnedItems.forEach((item, i) => {
        doc.text(i + 1, 40, position, { width: 30, align: 'left' })
           .text(item.productName, 70, position, { width: 180, align: 'left' })
           .text(item.originalQty, 250, position, { width: 60, align: 'center' })
           .text(item.returnedQty, 310, position, { width: 60, align: 'center' })
           .text(this.formatCurrency(item.price), 370, position, { width: 70, align: 'right' })
           .text(this.formatCurrency(item.amount), 440, position, { width: 90, align: 'right' });
        
        this.generateHr(doc, position + 15);
        position += 25;
      });

      doc.font('Helvetica-Bold');
      doc.text('Total Refund', 350, position + 10, { width: 80, align: 'right' })
         .text(this.formatCurrency(returnDoc.returnAmount), 440, position + 10, { width: 90, align: 'right' });

      doc.end();
    });
  }

  // --- Layout Engines ---

  static async generateA4Layout(doc, data, settings, logoBuffer, signatureBuffer) {
    this.generateA4Header(doc, settings, logoBuffer, data.title, data.refNo, data.date);
    
    // Customer Info
    const customer = data.customerSnapshot || {};
    doc.fillColor('#333').fontSize(10);
    
    // Billed To Column
    doc.font('Helvetica-Bold').text('Billed To:', 40, 160);
    doc.font('Helvetica');
    doc.text(customer.name || 'Walk-In Customer', 40, 175);
    
    let billedY = 190;
    if (data.billingAddressSnapshot?.address) {
      doc.text(data.billingAddressSnapshot.address, 40, billedY, { width: 220 });
      billedY = doc.y;
    }
    if (customer.phone) { doc.text(`Tel: ${customer.phone}`, 40, billedY); billedY = doc.y; }
    if (customer.email) { doc.text(`Email: ${customer.email}`, 40, billedY); billedY = doc.y; }

    // Shipped To Column
    if (data.shippingAddressSnapshot?.address || data.billingAddressSnapshot?.address) {
      doc.font('Helvetica-Bold').text('Shipped To:', 280, 160);
      doc.font('Helvetica');
      doc.text(customer.name || 'Walk-In Customer', 280, 175);
      
      let shipY = 190;
      const shipAddr = data.shippingAddressSnapshot?.address || data.billingAddressSnapshot?.address;
      doc.text(shipAddr, 280, shipY, { width: 220 });
      shipY = doc.y;
      if (customer.phone) { doc.text(`Tel: ${customer.phone}`, 280, shipY); }
    }

    // Items
    let position = Math.max(260, doc.y + 30);
    doc.font('Helvetica-Bold');
    doc.text('No.', 40, position, { width: 30, align: 'center' })
       .text('Description', 70, position, { width: 220, align: 'left' })
       .text('Qty', 290, position, { width: 50, align: 'center' })
       .text('Price', 340, position, { width: 80, align: 'right' })
       .text('Amount', 420, position, { width: 100, align: 'right' });
    this.generateHr(doc, position + 15);
    doc.font('Helvetica');

    position += 25;
    data.productSnapshot.forEach((item, i) => {
      doc.text(i + 1, 40, position, { width: 30, align: 'center' })
         .text(item.productName, 70, position, { width: 220, align: 'left' })
         .text(item.qty, 290, position, { width: 50, align: 'center' })
         .text(this.formatCurrency(item.price), 340, position, { width: 80, align: 'right' })
         .text(this.formatCurrency(item.total), 420, position, { width: 100, align: 'right' });
      
      this.generateHr(doc, position + 15);
      position += 25;
      
      if (position > 700) {
        doc.addPage();
        position = 50;
      }
    });

    // Totals
    const t = data.totalsSnapshot;
    doc.font('Helvetica-Bold')
       .text('Payment Info', 40, position + 20)
       .font('Helvetica')
       .text(`Method: ${data.paymentMethod || 'Cash'}`, 40, position + 35)
       .text(`Status: ${data.status || 'Paid'}`, 40, position + 50);

    doc.font('Helvetica-Bold')
       .text('Subtotal:', 320, position + 20, { align: 'right', width: 100 })
       .font('Helvetica').text(this.formatCurrency(t.subTotal), 420, position + 20, { align: 'right', width: 100 })
       .font('Helvetica-Bold')
       .text('Tax:', 320, position + 35, { align: 'right', width: 100 })
       .font('Helvetica').text(this.formatCurrency(t.tax), 420, position + 35, { align: 'right', width: 100 })
       .font('Helvetica-Bold')
       .text('Discount:', 320, position + 50, { align: 'right', width: 100 })
       .font('Helvetica').text(this.formatCurrency(t.discount), 420, position + 50, { align: 'right', width: 100 })
       .font('Helvetica-Bold')
       .text('Grand Total:', 320, position + 70, { align: 'right', width: 100 })
       .text(this.formatCurrency(t.amount), 420, position + 70, { align: 'right', width: 100 });

    // Footer & Signature
    const bottomY = doc.page.height - 100;
    
    if (signatureBuffer) {
      doc.image(signatureBuffer, 400, bottomY - 50, { fit: [120, 50], align: 'right' });
    }
    doc.font('Helvetica-Bold').fontSize(10).text('Authorized Signature', 400, bottomY, { width: 120, align: 'right' });
    
    if (settings?.invoiceFooter) {
      doc.font('Helvetica').fontSize(9).fillColor('#666').text(settings.invoiceFooter, 40, bottomY + 20, { align: 'center', width: 515 });
    }
  }

  static async generatePosLayout(doc, data, settings, logoBuffer) {
    const margin = 10;
    const width = 206.77; // 226.77 - 2*10
    
    doc.font('Helvetica');

    let y = doc.y;

    if (logoBuffer) {
      doc.image(logoBuffer, { fit: [width, 50], align: 'center' });
      doc.moveDown(0.5);
      y = doc.y;
    }

    doc.font('Helvetica-Bold').fontSize(12).text(settings?.storeName || 'Zooom STORE', margin, y, { align: 'center', width });
    y = doc.y + 2;
    doc.font('Helvetica').fontSize(8).text(settings?.address || 'Address Not Set', margin, y, { align: 'center', width });
    if (settings?.storePhone) {
      doc.text(`Tel: ${settings.storePhone}`, margin, doc.y, { align: 'center', width });
    }
    if (settings?.gstNumber) {
      doc.text(`GST: ${settings.gstNumber}`, margin, doc.y, { align: 'center', width });
    }

    y = doc.y + 10;
    this.generatePosHr(doc, y);
    y += 5;

    // Info
    doc.text(`Invoice No: ${data.refNo}`, margin, y);
    const dateStr = new Date(data.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    doc.text(`Date: ${dateStr}`, margin, doc.y);
    
    const customer = data.customerSnapshot?.name || 'Walk-in Customer';
    doc.text(`Customer: ${customer}`, margin, doc.y);

    y = doc.y + 5;
    this.generatePosHr(doc, y);
    y += 5;

    // Items Header
    doc.font('Helvetica-Bold');
    doc.text('Item', margin, y, { width: 90, align: 'left' });
    doc.text('Qty', margin + 90, y, { width: 30, align: 'center' });
    doc.text('Price', margin + 120, y, { width: 40, align: 'right' });
    doc.text('Total', margin + 160, y, { width: 45, align: 'right' });
    
    y = doc.y + 3;
    this.generatePosHr(doc, y);
    y += 5;
    
    doc.font('Helvetica');

    data.productSnapshot.forEach((item) => {
      // Split name if too long
      const pName = item.productName.substring(0, 20);
      
      doc.text(pName, margin, y, { width: 90, align: 'left' });
      doc.text(item.qty, margin + 90, y, { width: 30, align: 'center' });
      doc.text(item.price.toFixed(2), margin + 120, y, { width: 40, align: 'right' });
      doc.text(item.total.toFixed(2), margin + 160, y, { width: 45, align: 'right' });
      
      y = doc.y + 2;
    });

    y += 3;
    this.generatePosHr(doc, y);
    y += 5;

    // Totals
    const t = data.totalsSnapshot;
    doc.font('Helvetica')
       .text('Subtotal', margin, y, { width: 100 })
       .text(this.formatCurrency(t.subTotal), margin + 100, y, { width: 106, align: 'right' });
    y = doc.y + 2;

    if (t.discount > 0) {
      doc.text('Discount', margin, y, { width: 100 })
         .text(this.formatCurrency(t.discount), margin + 100, y, { width: 106, align: 'right' });
      y = doc.y + 2;
    }

    if (t.tax > 0) {
      doc.text('Tax/GST', margin, y, { width: 100 })
         .text(this.formatCurrency(t.tax), margin + 100, y, { width: 106, align: 'right' });
      y = doc.y + 2;
    }

    doc.font('Helvetica-Bold').fontSize(10)
       .text('Grand Total', margin, y, { width: 100 })
       .text(this.formatCurrency(t.amount), margin + 100, y, { width: 106, align: 'right' });
    
    y = doc.y + 5;
    this.generatePosHr(doc, y);
    y += 5;

    doc.font('Helvetica').fontSize(8);
    doc.text(`Payment: ${data.paymentMethod || 'Cash'}`, margin, y);
    doc.text(`Status: ${data.status || 'Paid'}`, margin, doc.y);

    y = doc.y + 10;
    if (settings?.invoiceFooter) {
      doc.text(settings.invoiceFooter, margin, y, { align: 'center', width });
    } else {
      doc.text('Thank you for shopping with us!', margin, y, { align: 'center', width });
    }
  }

  // --- Sub-Components ---

  static generateA4Header(doc, settings, logoBuffer, title, refNo, date) {
    if (logoBuffer) {
      doc.image(logoBuffer, 40, 40, { fit: [100, 50] });
    } else {
      doc.fillColor('#333').fontSize(20).text(settings?.storeName || 'Zooom STORE', 40, 40);
    }
    
    doc.fillColor('#333').fontSize(10)
       .text(settings?.storeName || 'Zooom STORE', 40, 100)
       .text(settings?.address || 'Address Not Set', 40, 115)
       .text(`Tel: ${settings?.storePhone || ''}`, 40, 130)
       .text(settings?.gstNumber ? `GST: ${settings.gstNumber}` : '', 40, 145);

    doc.fontSize(24).text(title, 350, 40, { align: 'right', width: 205 });
    doc.fontSize(10)
       .text(`Ref No: ${refNo}`, 350, 75, { align: 'right', width: 205 })
       .text(`Date: ${new Date(date).toLocaleDateString()}`, 350, 90, { align: 'right', width: 205 });
       
    doc.moveDown();
  }

  static generateHr(doc, y) {
    doc.strokeColor('#ccc').lineWidth(1).moveTo(40, y).lineTo(555, y).stroke();
  }

  static generatePosHr(doc, y) {
    doc.strokeColor('#333').lineWidth(0.5).moveTo(10, y).lineTo(216.77, y).stroke();
  }
}

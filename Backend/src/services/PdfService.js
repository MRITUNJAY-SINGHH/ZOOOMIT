import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import os from 'os';

export default class PdfService {
  /**
   * Generates a PDF invoice and returns the path to the temporary file
   */
  static async generateInvoice(invoice, settings) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Generate a unique temp file path
        const fileName = `${invoice.invoiceNumber}.pdf`;
        const tempPath = path.join(os.tmpdir(), fileName);
        
        const stream = fs.createWriteStream(tempPath);
        doc.pipe(stream);
        
        // Header
        doc.fontSize(20).font('Helvetica-Bold').text(settings.storeName || 'Invoice', { align: 'center' });
        doc.moveDown(0.5);
        
        if (settings.storeAddress) {
          doc.fontSize(10).font('Helvetica').text(settings.storeAddress, { align: 'center' });
        }
        if (settings.storePhone) {
          doc.fontSize(10).font('Helvetica').text(`Tel: ${settings.storePhone}`, { align: 'center' });
        }
        
        doc.moveDown(2);
        
        // Invoice Details & Customer Info
        doc.fontSize(10).font('Helvetica-Bold').text('Invoice Details:', 50, doc.y);
        doc.font('Helvetica').text(`Invoice #: ${invoice.invoiceNumber}`, 50, doc.y + 15);
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 50, doc.y + 15);
        
        const customerSnapshot = invoice.customerSnapshot || { name: 'Walk-in Customer' };
        doc.font('Helvetica-Bold').text('Billed To:', 350, doc.y - 30);
        doc.font('Helvetica').text(customerSnapshot.name, 350, doc.y + 15);
        if (customerSnapshot.phone) doc.text(`Phone: ${customerSnapshot.phone}`, 350, doc.y + 15);
        
        doc.moveDown(4);
        
        // Table Header
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Item', 50, tableTop);
        doc.text('Qty', 350, tableTop, { width: 50, align: 'center' });
        doc.text('Price', 400, tableTop, { width: 70, align: 'right' });
        doc.text('Total', 470, tableTop, { width: 70, align: 'right' });
        
        doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();
        
        let y = tableTop + 25;
        doc.font('Helvetica');
        
        // Table Rows
        invoice.productSnapshot.forEach(item => {
          doc.text(item.productName, 50, y, { width: 290 });
          doc.text(item.qty.toString(), 350, y, { width: 50, align: 'center' });
          doc.text(item.price.toFixed(2), 400, y, { width: 70, align: 'right' });
          doc.text(item.total.toFixed(2), 470, y, { width: 70, align: 'right' });
          
          y += 20;
          if (y > 750) {
            doc.addPage();
            y = 50;
          }
        });
        
        doc.moveTo(50, y).lineTo(540, y).stroke();
        doc.moveDown(2);
        
        // Totals
        const { subTotal, tax, discount, amount } = invoice.totalsSnapshot;
        doc.font('Helvetica-Bold');
        doc.text('Subtotal:', 350, doc.y, { width: 100, align: 'right' });
        doc.text(subTotal.toFixed(2), 470, doc.y - 12, { width: 70, align: 'right' });
        doc.moveDown(0.5);
        
        doc.text('Tax:', 350, doc.y, { width: 100, align: 'right' });
        doc.text(tax.toFixed(2), 470, doc.y - 12, { width: 70, align: 'right' });
        doc.moveDown(0.5);
        
        doc.text('Discount:', 350, doc.y, { width: 100, align: 'right' });
        doc.text(`-${discount.toFixed(2)}`, 470, doc.y - 12, { width: 70, align: 'right' });
        doc.moveDown(1);
        
        doc.fontSize(12).text('Total Amount:', 350, doc.y, { width: 100, align: 'right' });
        doc.text(amount.toFixed(2), 470, doc.y - 14, { width: 70, align: 'right' });
        
        doc.moveDown(4);
        
        // Bank Details
        if (settings.bankDetails && settings.bankDetails.accountNumber) {
          doc.fontSize(10).font('Helvetica-Bold').text('Bank Details:', 50, doc.y);
          doc.font('Helvetica').text(`Bank: ${settings.bankDetails.bankName}`, 50, doc.y + 15);
          doc.text(`Acc Name: ${settings.bankDetails.accountName}`, 50, doc.y + 15);
          doc.text(`Acc No: ${settings.bankDetails.accountNumber}`, 50, doc.y + 15);
          doc.text(`IFSC: ${settings.bankDetails.ifscCode}`, 50, doc.y + 15);
        }
        
        doc.end();
        
        stream.on('finish', () => {
          resolve(tempPath);
        });
        
        stream.on('error', (err) => {
          reject(err);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
}

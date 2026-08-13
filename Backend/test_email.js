import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './src/models/Invoice.js';
import Settings from './src/models/Settings.js';
import PdfService from './src/services/PdfService.js';
import NotificationService from './src/services/NotificationService.js';

dotenv.config();

const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

async function sendTestEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find any invoice
    const invoice = await Invoice.findOne().sort({ createdAt: -1 });
    if (!invoice) {
      console.log('No invoice found to send.');
      process.exit(1);
    }

    const settings = await Settings.findOne() || {};
    
    const docStream = await PdfService.generateInvoicePdf(invoice, settings, { format: 'a4' });
    const pdfBuffer = await streamToBuffer(docStream);

    const email = 'fegep39341@neplis.com';
    
    console.log('Sending email...');
    await NotificationService.sendEmailWithAttachment({
      to: email,
      subject: `Invoice ${invoice.invoiceNumber} from ${settings.storeName || 'Store'}`,
      text: `Please find attached your invoice ${invoice.invoiceNumber}.`,
      html: `<h3>Thank you for your business!</h3><p>Your invoice <strong>${invoice.invoiceNumber}</strong> is attached to this email.</p>`,
      attachmentBuffer: pdfBuffer,
      attachmentName: `${invoice.invoiceNumber}.pdf`
    });

    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

sendTestEmail();

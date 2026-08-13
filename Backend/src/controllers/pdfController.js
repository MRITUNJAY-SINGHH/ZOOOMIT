import Invoice from '../models/Invoice.js';
import CancelledDocument from '../models/CancelledDocument.js';
import ReturnDocument from '../models/ReturnDocument.js';
import Settings from '../models/Settings.js';
import PdfService from '../services/PdfService.js';
import NotificationService from '../services/NotificationService.js';

// Helper to convert PDF stream to Buffer
const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

export const downloadInvoicePdf = async (req, res) => {
  try {
    const format = req.query.format === 'pos' ? 'pos' : 'a4';

    const invoice = await Invoice.findOne({ 
      $or: [ { _id: req.params.id }, { invoiceNumber: req.params.id } ]
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    const settings = await Settings.findOne() || {};

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);

    const docStream = await PdfService.generateInvoicePdf(invoice, settings, { format });
    docStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadCancelledPdf = async (req, res) => {
  try {
    const cancelledDoc = await CancelledDocument.findOne({ 
      $or: [ { _id: req.params.id }, { documentNumber: req.params.id } ]
    });
    if (!cancelledDoc) return res.status(404).json({ message: 'Cancelled Document not found' });
    
    const settings = await Settings.findOne() || {};

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${cancelledDoc.documentNumber}.pdf`);

    const docStream = await PdfService.generateCancelledPdf(cancelledDoc, settings);
    docStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadReturnPdf = async (req, res) => {
  try {
    const returnDoc = await ReturnDocument.findOne({ 
      $or: [ { _id: req.params.id }, { documentNumber: req.params.id } ]
    });
    if (!returnDoc) return res.status(404).json({ message: 'Return Document not found' });
    
    const settings = await Settings.findOne() || {};

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${returnDoc.documentNumber}.pdf`);

    const docStream = await PdfService.generateReturnPdf(returnDoc, settings);
    docStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const emailInvoicePdf = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const format = req.query.format === 'pos' ? 'pos' : 'a4';

    const invoice = await Invoice.findOne({ 
      $or: [ { _id: req.params.id }, { invoiceNumber: req.params.id } ]
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    const settings = await Settings.findOne() || {};
    const docStream = await PdfService.generateInvoicePdf(invoice, settings, { format });
    const pdfBuffer = await streamToBuffer(docStream);

    await NotificationService.sendEmailWithAttachment({
      to: email,
      subject: `Invoice ${invoice.invoiceNumber} from ${settings.storeName || 'Store'}`,
      text: `Please find attached your invoice ${invoice.invoiceNumber}.`,
      html: `<h3>Thank you for your business!</h3><p>Your invoice <strong>${invoice.invoiceNumber}</strong> is attached to this email.</p>`,
      attachmentBuffer: pdfBuffer,
      attachmentName: `${invoice.invoiceNumber}.pdf`
    });

    res.json({ message: 'Invoice emailed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const emailCancelledPdf = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const cancelledDoc = await CancelledDocument.findOne({ 
      $or: [ { _id: req.params.id }, { documentNumber: req.params.id } ]
    });
    if (!cancelledDoc) return res.status(404).json({ message: 'Cancelled Document not found' });
    
    const settings = await Settings.findOne() || {};
    const docStream = await PdfService.generateCancelledPdf(cancelledDoc, settings);
    const pdfBuffer = await streamToBuffer(docStream);

    await NotificationService.sendEmailWithAttachment({
      to: email,
      subject: `Cancellation ${cancelledDoc.documentNumber} from ${settings.storeName || 'Store'}`,
      text: `Please find attached your cancellation document ${cancelledDoc.documentNumber}.`,
      html: `<h3>Cancellation Confirmation</h3><p>Your document <strong>${cancelledDoc.documentNumber}</strong> is attached to this email.</p>`,
      attachmentBuffer: pdfBuffer,
      attachmentName: `${cancelledDoc.documentNumber}.pdf`
    });

    res.json({ message: 'Cancellation document emailed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const emailReturnPdf = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const returnDoc = await ReturnDocument.findOne({ 
      $or: [ { _id: req.params.id }, { documentNumber: req.params.id } ]
    });
    if (!returnDoc) return res.status(404).json({ message: 'Return Document not found' });
    
    const settings = await Settings.findOne() || {};
    const docStream = await PdfService.generateReturnPdf(returnDoc, settings);
    const pdfBuffer = await streamToBuffer(docStream);

    await NotificationService.sendEmailWithAttachment({
      to: email,
      subject: `Return Receipt ${returnDoc.documentNumber} from ${settings.storeName || 'Store'}`,
      text: `Please find attached your return receipt ${returnDoc.documentNumber}.`,
      html: `<h3>Return Processed</h3><p>Your return receipt <strong>${returnDoc.documentNumber}</strong> is attached to this email.</p>`,
      attachmentBuffer: pdfBuffer,
      attachmentName: `${returnDoc.documentNumber}.pdf`
    });

    res.json({ message: 'Return receipt emailed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

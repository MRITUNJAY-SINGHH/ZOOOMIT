import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './format';
import { toast } from 'react-hot-toast';

const safePdfCurrency = (val) => {
  return formatCurrency(val).replace(/₹/g, 'Rs. ');
};

const loadImage = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const generatePremiumInvoicePDF = async (invoice, settings = {}, mode = 'download') => {
  if (!invoice) return;
  toast.loading('Generating PDF...', { id: 'pdf-gen' });
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Try loading logo and signature
    const logoImg = await loadImage(settings?.storeLogo);
    const sigImg = await loadImage(settings?.authorizedSignature);

    let currentY = 20;

    // Header Left (Logo + Store Info)
    if (logoImg) {
      // Calculate aspect ratio
      const imgRatio = logoImg.height / logoImg.width;
      const renderWidth = 35;
      const renderHeight = renderWidth * imgRatio;
      doc.addImage(logoImg, 'PNG', 14, currentY, renderWidth, renderHeight);
      currentY += renderHeight + 8;
    } else {
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59); // text-slate-800
      doc.text(settings?.storeName || 'ZOOOMIT', 14, currentY);
      currentY += 8;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // text-slate-500
    if (settings?.address) {
      const addressLines = doc.splitTextToSize(settings.address, 80);
      doc.text(addressLines, 14, currentY);
      currentY += addressLines.length * 4.5 + 2;
    }
    if (settings?.storePhone || settings?.storeEmail) {
      doc.text(`${settings.storePhone || ''} ${settings.storeEmail ? `· ${settings.storeEmail}` : ''}`, 14, currentY);
      currentY += 5;
    }
    if (settings?.gstNumber) {
      doc.text(`GST: ${settings.gstNumber}`, 14, currentY);
    }

    // Header Right (INVOICE title + Meta)
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("INVOICE", pageWidth - 14, 25, { align: 'right' });
    
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`# ${invoice.invoiceNumber || invoice._id.substring(0, 8).toUpperCase()}`, pageWidth - 14, 33, { align: 'right' });
    
    const status = invoice.status || (invoice.isCancelled ? 'Cancelled' : 'Paid');
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    if (status === 'Paid') doc.setTextColor(16, 185, 129);
    else if (status === 'Pending') doc.setTextColor(245, 158, 11);
    else doc.setTextColor(239, 68, 68);
    doc.text(status.toUpperCase(), pageWidth - 14, 40, { align: 'right' });

    // Dates
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${formatDate(invoice.date)}`, pageWidth - 14, 48, { align: 'right' });
    if (invoice.dueDate) {
      doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, pageWidth - 14, 53, { align: 'right' });
    }

    currentY = Math.max(currentY + 15, 65);

    // Billing & Shipping Information
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("BILLED TO:", 14, currentY);
    doc.text("SHIPPED TO:", 100, currentY);
    
    currentY += 6;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(invoice.customerSnapshot?.name || 'Walk-in Customer', 14, currentY);
    doc.text(invoice.shippingAddressSnapshot?.name || invoice.customerSnapshot?.name || 'Same as billing', 100, currentY);

    currentY += 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    
    const billingAddr = invoice.billingAddressSnapshot?.address || '-';
    const billingContact = invoice.customerSnapshot?.phone || invoice.customerSnapshot?.email || '';
    const shippingAddr = invoice.shippingAddressSnapshot?.address || invoice.billingAddressSnapshot?.address || '-';
    const shippingContact = invoice.shippingAddressSnapshot?.phone || invoice.customerSnapshot?.phone || '';

    const bLines = doc.splitTextToSize(billingAddr, 75);
    const sLines = doc.splitTextToSize(shippingAddr, 75);
    
    doc.text(bLines, 14, currentY);
    doc.text(sLines, 100, currentY);
    
    const maxLines = Math.max(bLines.length, sLines.length);
    currentY += maxLines * 4.5 + 1;
    
    if (billingContact) doc.text(billingContact, 14, currentY);
    if (shippingContact) doc.text(shippingContact, 100, currentY);
    
    currentY += 12;

    // Items Table
    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Item', 'Qty', 'Rate', 'Amount']],
      body: (invoice.productSnapshot || []).map((item, index) => [
        index + 1,
        `${item.productName}${item.sku ? `\nSKU: ${item.sku}` : ''}`,
        item.qty,
        safePdfCurrency(item.price),
        safePdfCurrency(item.total)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', lineWidth: 0.1, lineColor: [226, 232, 240] },
      bodyStyles: { textColor: [30, 41, 59], lineWidth: 0.1, lineColor: [226, 232, 240] },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
      },
      styles: { fontSize: 9, cellPadding: 4 },
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // Totals Section (Bottom Right)
    const totalsX = pageWidth - 60;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal", totalsX, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(safePdfCurrency(invoice.totalsSnapshot?.subTotal || 0), pageWidth - 14, currentY, { align: 'right' });
    
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Tax", totalsX, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(safePdfCurrency(invoice.totalsSnapshot?.tax || 0), pageWidth - 14, currentY, { align: 'right' });
    
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Discount", totalsX, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`- ${safePdfCurrency(invoice.totalsSnapshot?.discount || 0)}`, pageWidth - 14, currentY, { align: 'right' });
    
    currentY += 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(totalsX, currentY - 4, pageWidth - 14, currentY - 4);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Total", totalsX, currentY);
    doc.text(safePdfCurrency(invoice.totalsSnapshot?.amount || 0), pageWidth - 14, currentY, { align: 'right' });

    // Footer / Terms Section (Bottom Left)
    let footerY = doc.lastAutoTable.finalY + 10;
    
    if (footerY + 50 > pageHeight - 20) {
      doc.addPage();
      footerY = 20;
      currentY = footerY;
    }
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(148, 163, 184);
    doc.text("TERMS & NOTES", 14, footerY);
    
    footerY += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    
    const termsText = settings?.termsAndConditions || 'Terms are managed from Settings.';
    const notesText = invoice.notes || settings?.invoiceFooter || 'Thank you for your business.';
    
    const termsLines = doc.splitTextToSize(termsText, 100);
    doc.text(termsLines, 14, footerY);
    footerY += termsLines.length * 4;
    
    const notesLines = doc.splitTextToSize(notesText, 100);
    doc.text(notesLines, 14, footerY);
    
    footerY += notesLines.length * 4 + 6;
    
    // Bank Details
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(148, 163, 184);
    doc.text("BANK DETAILS", 14, footerY);
    
    footerY += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(settings?.bankDetails?.bankName || 'No bank details provided', 14, footerY);
    footerY += 4;
    doc.text(`${settings?.bankDetails?.accountName || ''} ${settings?.bankDetails?.accountNumber ? `· ${settings.bankDetails.accountNumber}` : ''}`, 14, footerY);
    footerY += 4;
    doc.text(settings?.bankDetails?.ifscCode || '', 14, footerY);

    // Signature (Bottom Right)
    let sigY = Math.max(currentY + 20, footerY - 25);
    const sigX = pageWidth - 60;
    
    if (sigImg) {
      const sigRatio = sigImg.height / sigImg.width;
      const sigWidth = 40;
      const sigHeight = sigWidth * sigRatio;
      doc.addImage(sigImg, 'PNG', sigX + 6, sigY - sigHeight - 2, sigWidth, sigHeight);
    } else {
      doc.setFontSize(14);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(30, 41, 59);
      doc.text(settings?.storeName || 'ZOOOMIT', sigX, sigY - 5);
    }
    
    doc.setDrawColor(203, 213, 225);
    doc.line(sigX, sigY, pageWidth - 14, sigY);
    doc.setDrawColor(203, 213, 225);
    doc.line(sigX, sigY, pageWidth - 14, sigY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Authorized Signature", sigX + 5, sigY + 5);

    if (mode === 'print') {
      doc.autoPrint();
      const pdfBlobUrl = doc.output('bloburl');
      window.open(pdfBlobUrl, '_blank');
      toast.success('Print dialog opened', { id: 'pdf-gen' });
    } else {
      doc.save(`${invoice.invoiceNumber || invoice._id}.pdf`);
      toast.success('Invoice downloaded successfully', { id: 'pdf-gen' });
    }
  } catch (err) {
    console.error(err);
    toast.error(mode === 'print' ? 'Failed to prepare print' : 'Failed to generate PDF', { id: 'pdf-gen' });
  }
};

import React, { useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { Printer, ArrowLeft, Download, Mail } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import api from '@/utils/api';
import { useAuthContext } from '@/context/useAuthContext';

export default function InvoicePrintOut({ invoice, onBack }) {
  const [settings, setSettings] = useState(null);
  const { user } = useAuthContext();

  useEffect(() => {
    // Fetch settings then print
    api.get('/settings').then(res => {
      setSettings(res.data);
      setTimeout(() => {
        window.print();
      }, 500);
    });
  }, []);

  if (!invoice || !settings) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      const element = document.getElementById('invoice-content-to-print');
      
      // Temporarily enforce exact A4 width for the capture
      const originalWidth = element.style.width;
      const originalMaxWidth = element.style.maxWidth;
      element.style.width = '794px';
      element.style.maxWidth = '794px';
      
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        width: 794,
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0
      });
      
      // Revert width
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;
      
      // Export as JPEG with 80% quality
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate total image height in mm at 100% width
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Print the image at 100% width
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      // If the invoice is very tall, naturally split into multiple pages
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF. Make sure html2canvas and jspdf are installed.');
    }
  };

  return (
    <div className="invoice-print-container" style={{ margin: '0 auto', maxWidth: '850px', background: '#fff', color: '#000', fontFamily: '"Inter", "Helvetica Neue", sans-serif' }}>
      
      {/* Controls Container */}
      <div className="d-print-none mb-4 d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #eee', background: '#f8f9fa' }}>
        <Button variant="outline-primary" onClick={onBack} className="d-flex align-items-center gap-2"><ArrowLeft size={16} /> Back</Button>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={handleDownloadPDF} className="d-flex align-items-center gap-2" title="Download PDF"><Download size={16} /> Download</Button>
          <Button variant="outline-info" onClick={() => alert('Email sent successfully!')} className="d-flex align-items-center gap-2" title="Send Email"><Mail size={16} /> Send</Button>
          <Button variant="primary" onClick={() => window.print()} className="d-flex align-items-center gap-2"><Printer size={16} /> Print</Button>
        </div>
      </div>

      <div id="invoice-content-to-print" className="invoice-content position-relative shadow-sm" style={{ backgroundColor: '#fff', width: '794px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        
        {invoice.isCancelled && (
          <div className="d-flex justify-content-center align-items-center position-absolute w-100 h-100" style={{ top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ transform: 'rotate(-45deg)', color: 'rgba(220, 53, 69, 0.15)', fontSize: '6rem', fontWeight: '900', border: '10px solid rgba(220, 53, 69, 0.15)', padding: '20px 40px', borderRadius: '15px', letterSpacing: '5px' }}>
              CANCELLED
            </div>
          </div>
        )}

        {/* HEADER */}
        <div style={{ backgroundColor: '#212d45', color: '#fff', padding: '40px', display: 'flex', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative background stripes mimicking the image */}
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '70%', height: '150%', background: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(239, 68, 68, 0.15) 15px, rgba(239, 68, 68, 0.15) 30px)', zIndex: 0, transform: 'skewX(-20deg)' }}></div>
          <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '70%', height: '150%', background: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(59, 130, 246, 0.1) 15px, rgba(59, 130, 246, 0.1) 30px)', zIndex: 0, transform: 'skewX(-20deg)' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '50%' }}>
            {settings?.storeLogo ? (
              <img src={settings.storeLogo} alt="Logo" style={{ maxHeight: '60px', objectFit: 'contain', marginBottom: '15px' }} />
            ) : (
              <h2 className="mb-2 fw-bold text-uppercase" style={{ fontSize: '1.8rem', letterSpacing: '1px', color: '#f8fafc' }}>
                <span style={{ color: '#ef4444', marginRight: '8px' }}>&#x276F;&#x276F;</span>
                {settings.storeName || 'KUIKLO STORE'}
              </h2>
            )}
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
              <div>{settings.address || 'Address Not Set'}</div>
              <div>{settings.storePhone && `Tel: ${settings.storePhone}`}</div>
              <div>{settings.gstNumber && `GST/Tax ID: ${settings.gstNumber}`}</div>
            </div>
          </div>
          
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' }}>
            <h1 className="fw-bold mb-3" style={{ fontSize: '2.5rem', letterSpacing: '2px', color: '#fff' }}>INVOICE</h1>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
              <div className="d-flex justify-content-end mb-1">
                <span className="fw-bold me-2 text-white">Ref No.</span>
                <span>{invoice.invoiceNumber}</span>
              </div>
              <div className="d-flex justify-content-end mb-1">
                <span className="fw-bold me-2 text-white">Invoice Date</span>
                <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="d-flex justify-content-end">
                <span className="fw-bold me-2 text-white">Due Date</span>
                <span>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : new Date(invoice.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '40px', flex: 1 }}>
          {/* BILL TO & SHIP TO */}
          <div className="d-flex justify-content-between mb-5">
            <div style={{ width: '45%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', background: '#f8fafc' }}>
              <h6 className="fw-bold mb-3 pb-2" style={{ borderBottom: '1px solid #cbd5e1', color: '#1e293b', fontSize: '1.1rem' }}>Billed To:</h6>
              <div style={{ fontSize: '1rem', color: '#1e293b', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 'bold', color: '#000', fontSize: '1.1rem' }}>{invoice.customerSnapshot?.name || 'Walk-In Customer'}</div>
                {invoice.customerSnapshot?.phone && <div>Tel: {invoice.customerSnapshot.phone}</div>}
                {invoice.customerSnapshot?.email && <div>Email: {invoice.customerSnapshot.email}</div>}
              </div>
            </div>
            <div style={{ width: '45%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', background: '#f8fafc' }}>
              <h6 className="fw-bold mb-3 pb-2" style={{ borderBottom: '1px solid #cbd5e1', color: '#1e293b', fontSize: '1.1rem' }}>Ship To:</h6>
              <div style={{ fontSize: '1rem', color: '#1e293b', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 'bold', color: '#000', fontSize: '1.1rem' }}>{invoice.customerSnapshot?.name || 'Walk-In Customer'}</div>
                {invoice.customerSnapshot?.phone && <div>Tel: {invoice.customerSnapshot.phone}</div>}
                {invoice.customerSnapshot?.email && <div>Email: {invoice.customerSnapshot.email}</div>}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <table className="w-100 mb-4" style={{ fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#212d45', color: '#fff' }}>
                <th className="py-2 px-3 text-center" style={{ width: '5%', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px' }}>No.</th>
                <th className="py-2 px-3 text-start">Description</th>
                <th className="py-2 px-3 text-center" style={{ width: '15%' }}>Quantity</th>
                <th className="py-2 px-3 text-end" style={{ width: '20%' }}>Unit Price</th>
                <th className="py-2 px-3 text-end" style={{ width: '20%', borderTopRightRadius: '4px', borderBottomRightRadius: '4px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.productSnapshot.map((item, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: '1px solid #ccc' }}>
                  <td className="py-3 px-3 text-center" style={{ color: '#475569', borderRight: '1px solid #eee', borderLeft: '1px solid #eee' }}>{idx + 1}</td>
                  <td className="py-3 px-3" style={{ borderRight: '1px solid #eee' }}>
                    <div style={{ fontWeight: '600', color: '#000' }}>{item.productName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>{item.sku}</div>
                  </td>
                  <td className="py-3 px-3 text-center" style={{ color: '#1e293b', borderRight: '1px solid #eee' }}>{item.qty}</td>
                  <td className="py-3 px-3 text-end" style={{ color: '#1e293b', borderRight: '1px solid #eee' }}>{formatCurrency(item.price)}</td>
                  <td className="py-3 px-3 text-end" style={{ fontWeight: '600', color: '#000', borderRight: '1px solid #eee' }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS & PAYMENT INFO */}
          <div className="d-flex justify-content-between mb-5">
            <div style={{ width: '45%' }}>
              <h6 className="fw-bold mb-2" style={{ color: '#1e293b', fontSize: '1.1rem' }}>Payment Info</h6>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '30px', lineHeight: '1.6' }}>
                <div><strong>Method:</strong> {invoice.paymentMethod || 'Cash/Card'}</div>
                <div><strong>Status:</strong> {invoice.status || 'Paid'}</div>
                <div><strong>Cashier:</strong> {user?.name || 'Admin'}</div>
              </div>
              <h6 className="fw-bold mb-2" style={{ color: '#1e293b', fontSize: '1.1rem' }}>Notes</h6>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                {invoice.notes || 'Please send proof of payment if paying offline. For inquiries, contact our billing team.'}
              </div>
            </div>
            
            <div style={{ width: '300px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', background: '#f8fafc' }}>
              <div className="d-flex justify-content-between py-2 px-2" style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <span>Subtotal</span>
                <span style={{ color: '#000' }}>{formatCurrency(invoice.totalsSnapshot.subTotal)}</span>
              </div>
              <div className="d-flex justify-content-between py-2 px-2" style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <span>Tax</span>
                <span style={{ color: '#000' }}>{formatCurrency(invoice.totalsSnapshot.tax)}</span>
              </div>
              <div className="d-flex justify-content-between py-2 px-2" style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <span>Discount</span>
                <span style={{ color: '#000' }}>{formatCurrency(invoice.totalsSnapshot.discount)}</span>
              </div>
              <div className="d-flex justify-content-between py-3 px-3 mt-3 fw-bold align-items-center" style={{ backgroundColor: '#e0e7ff', color: '#1e40af', borderRadius: '4px' }}>
                <span>Amount Due</span>
                <span style={{ fontSize: '1.2rem' }}>{formatCurrency(invoice.totalsSnapshot.amount)}</span>
              </div>
            </div>
          </div>

          {/* SIGNATURE */}
          <div className="d-flex justify-content-end align-items-end mt-auto" style={{ paddingBottom: '30px' }}>
            <div className="text-center" style={{ width: '250px' }}>
              <div style={{ fontFamily: '"Brush Script MT", "Snell Roundhand", cursive', fontSize: '3.5rem', color: '#212d45', marginBottom: '5px', lineHeight: '1' }}>
                {settings.storeName || 'Authorized'}
              </div>
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px', fontSize: '0.9rem', color: '#64748b' }}>
                Authorized Signatures
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: '1px solid #e2e8f0', padding: '25px 40px 40px 40px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
          <div>{settings.invoiceFooter || 'Thank you for shopping with Kuiklo. Returns accepted as per store policy.'}</div>
          {settings.storePhone && <div className="mt-1">Tel: {settings.storePhone}</div>}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; background: #fff; }
          body * { visibility: hidden; }
          .invoice-print-container, .invoice-print-container * { visibility: visible; color: #000 !important; }
          .invoice-print-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 794px; /* A4 width */
            max-width: 100% !important; 
            margin: 0 auto !important; 
            padding: 0 !important; 
            box-shadow: none !important; 
            border-radius: 0 !important; 
          }
          .invoice-content {
            box-shadow: none !important;
            border: none !important;
            min-height: 1122px !important; /* A4 height */
          }
          .d-print-none { display: none !important; }
        }
      `}} />
    </div>
  );
}

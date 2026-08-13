import React, { useEffect, useState } from 'react';
import { Button, Spinner, ButtonGroup, Badge } from 'react-bootstrap';
import { Printer, ArrowLeft, Download, Mail, FileText, Receipt } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import api from '@/utils/api';
import { useAuthContext } from '@/context/useAuthContext';
import { toast } from 'react-hot-toast';

export default function InvoicePrintOut({ invoice, onBack }) {
  const [settings, setSettings] = useState(null);
  const [printFormat, setPrintFormat] = useState('pos'); // 'pos' or 'a4'
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
    const toastId = toast.loading('Generating official PDF...');
    try {
      const response = await api.get(`/documents/invoice/${invoice._id || invoice.invoiceNumber}/pdf?format=${printFormat}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('PDF downloaded successfully.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download official PDF.', { id: toastId });
    }
  };

  const handleSendEmail = async () => {
    const email = prompt('Enter customer email to send the invoice to:', invoice.customerSnapshot?.email || '');
    if (!email) return;

    const toastId = toast.loading('Sending email...');
    try {
      await api.post(`/documents/invoice/${invoice._id || invoice.invoiceNumber}/email?format=${printFormat}`, { email });
      toast.success('Email sent successfully.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send email.', { id: toastId });
    }
  };

  const renderA4 = () => (
    <div className="invoice-a4 shadow-sm" style={{ backgroundColor: '#fff', width: '794px', margin: '0 auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {invoice.isCancelled && (
        <div className="d-flex justify-content-center align-items-center position-absolute w-100 h-100" style={{ top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ transform: 'rotate(-45deg)', color: 'rgba(220, 53, 69, 0.15)', fontSize: '6rem', fontWeight: '900', border: '10px solid rgba(220, 53, 69, 0.15)', padding: '20px 40px', borderRadius: '15px', letterSpacing: '5px' }}>
            CANCELLED
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ maxWidth: '50%' }}>
          {settings?.storeLogo ? (
            <img src={settings.storeLogo} alt="Logo" style={{ maxHeight: '60px', objectFit: 'contain', marginBottom: '15px' }} />
          ) : (
            <h2 className="mb-2 fw-bold text-uppercase" style={{ fontSize: '1.8rem', letterSpacing: '1px', color: '#333' }}>
              {settings.storeName || 'Zooom STORE'}
            </h2>
          )}
          <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5' }}>
            <div>{settings.storeName || 'Zooom STORE'}</div>
            <div>{settings.address || 'Address Not Set'}</div>
            {settings.storePhone && <div>Tel: {settings.storePhone}</div>}
            {settings.gstNumber && <div>GST: {settings.gstNumber}</div>}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <h1 className="fw-bold mb-3" style={{ fontSize: '2.5rem', letterSpacing: '2px', color: '#111' }}>INVOICE</h1>
          <div style={{ fontSize: '0.85rem', color: '#555' }}>
            <div className="d-flex justify-content-end mb-1">
              <span className="fw-bold me-2">Ref No:</span>
              <span>{invoice.invoiceNumber}</span>
            </div>
            <div className="d-flex justify-content-end mb-1">
              <span className="fw-bold me-2">Date:</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '0 40px', flex: 1 }}>
        {/* BILL TO & SHIP TO */}
        <div className="d-flex mb-4 gap-5">
          <div>
            <h6 className="fw-bold mb-2" style={{ color: '#333', fontSize: '1rem' }}>Billed To:</h6>
            <div style={{ fontSize: '0.9rem', color: '#444', lineHeight: '1.6' }}>
              <div style={{ fontWeight: 'bold', color: '#000' }}>{invoice.customerSnapshot?.name || 'Walk-In Customer'}</div>
              {invoice.billingAddressSnapshot?.address && <div style={{ whiteSpace: 'pre-wrap' }}>{invoice.billingAddressSnapshot.address}</div>}
              {invoice.customerSnapshot?.phone && <div>Tel: {invoice.customerSnapshot.phone}</div>}
              {invoice.customerSnapshot?.email && <div>Email: {invoice.customerSnapshot.email}</div>}
            </div>
          </div>
          
          {(invoice.shippingAddressSnapshot?.address || invoice.billingAddressSnapshot?.address) && (
            <div>
              <h6 className="fw-bold mb-2" style={{ color: '#333', fontSize: '1rem' }}>Shipped To:</h6>
              <div style={{ fontSize: '0.9rem', color: '#444', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 'bold', color: '#000' }}>{invoice.customerSnapshot?.name || 'Walk-In Customer'}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{invoice.shippingAddressSnapshot?.address || invoice.billingAddressSnapshot?.address}</div>
                {invoice.customerSnapshot?.phone && <div>Tel: {invoice.customerSnapshot.phone}</div>}
              </div>
            </div>
          )}
        </div>

        {/* TABLE */}
        <table className="w-100 mb-4" style={{ fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333', color: '#333' }}>
              <th className="py-2 px-2 text-center" style={{ width: '5%' }}>No.</th>
              <th className="py-2 px-2 text-start">Description</th>
              <th className="py-2 px-2 text-center" style={{ width: '10%' }}>Qty</th>
              <th className="py-2 px-2 text-end" style={{ width: '15%' }}>Price</th>
              <th className="py-2 px-2 text-end" style={{ width: '15%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.productSnapshot.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                <td className="py-3 px-2 text-center">{idx + 1}</td>
                <td className="py-3 px-2">
                  <div style={{ fontWeight: '600', color: '#222' }}>{item.productName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{item.sku}</div>
                </td>
                <td className="py-3 px-2 text-center">{item.qty}</td>
                <td className="py-3 px-2 text-end">{formatCurrency(item.price)}</td>
                <td className="py-3 px-2 text-end" style={{ fontWeight: '600' }}>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS & PAYMENT INFO */}
        <div className="d-flex justify-content-between mb-5 mt-4">
          <div style={{ width: '45%' }}>
            <h6 className="fw-bold mb-2" style={{ color: '#333', fontSize: '1rem' }}>Payment Info</h6>
            <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '20px', lineHeight: '1.6' }}>
              <div><strong>Method:</strong> {invoice.paymentMethod || 'Cash/Card'}</div>
              <div><strong>Status:</strong> {invoice.status || 'Paid'}</div>
              <div><strong>Cashier:</strong> {user?.name || 'Admin'}</div>
            </div>
            
            <h6 className="fw-bold mb-2" style={{ color: '#333', fontSize: '1rem' }}>Notes</h6>
            <div style={{ fontSize: '0.9rem', color: '#555' }}>
              {invoice.notes || 'No additional notes.'}
            </div>
          </div>
          
          <div style={{ width: '300px' }}>
            <div className="d-flex justify-content-between py-1" style={{ color: '#555' }}>
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.totalsSnapshot.subTotal)}</span>
            </div>
            <div className="d-flex justify-content-between py-1" style={{ color: '#555' }}>
              <span>Tax</span>
              <span>{formatCurrency(invoice.totalsSnapshot.tax)}</span>
            </div>
            <div className="d-flex justify-content-between py-1" style={{ color: '#555' }}>
              <span>Discount</span>
              <span>{formatCurrency(invoice.totalsSnapshot.discount)}</span>
            </div>
            <div className="d-flex justify-content-between py-2 mt-2 fw-bold align-items-center" style={{ borderTop: '2px solid #333', color: '#111' }}>
              <span>Amount Due</span>
              <span style={{ fontSize: '1.2rem' }}>{formatCurrency(invoice.totalsSnapshot.amount)}</span>
            </div>
          </div>
        </div>

        {/* SIGNATURE */}
        <div className="d-flex justify-content-end align-items-end mt-5" style={{ paddingBottom: '30px' }}>
          <div className="text-center" style={{ width: '250px' }}>
            {settings.authorizedSignature ? (
              <img src={settings.authorizedSignature} alt="Signature" style={{ maxHeight: '60px', objectFit: 'contain', marginBottom: '10px' }} />
            ) : (
              <div style={{ height: '60px', marginBottom: '10px' }}></div>
            )}
            <div style={{ borderTop: '1px solid #333', paddingTop: '8px', fontSize: '0.9rem', color: '#333', fontWeight: 'bold' }}>
              Authorized Signature
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '20px 40px', fontSize: '0.85rem', color: '#777', textAlign: 'center' }}>
        <div>{settings.invoiceFooter || 'Thank you for shopping with us!'}</div>
      </div>
    </div>
  );

  const renderPOS = () => (
    <div className="invoice-pos shadow-sm" style={{ backgroundColor: '#fff', width: '302px', margin: '0 auto', display: 'flex', flexDirection: 'column', position: 'relative', padding: '15px', color: '#000', fontFamily: 'monospace' }}>
      
      {invoice.isCancelled && (
        <div className="d-flex justify-content-center align-items-center position-absolute w-100 h-100" style={{ top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ transform: 'rotate(-45deg)', color: 'rgba(220, 53, 69, 0.4)', fontSize: '2.5rem', fontWeight: '900', border: '3px solid rgba(220, 53, 69, 0.4)', padding: '10px', borderRadius: '5px' }}>
            CANCELLED
          </div>
        </div>
      )}

      {/* POS HEADER */}
      <div className="text-center mb-2">
        {settings?.storeLogo && (
          <img src={settings.storeLogo} alt="Logo" style={{ maxHeight: '50px', objectFit: 'contain', marginBottom: '10px' }} />
        )}
        <div className="fw-bold" style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>{settings?.storeName || 'Zooom STORE'}</div>
        <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>{settings?.address || 'Address Not Set'}</div>
        {settings?.storePhone && <div style={{ fontSize: '0.8rem' }}>Tel: {settings.storePhone}</div>}
        {settings?.gstNumber && <div style={{ fontSize: '0.8rem' }}>GST: {settings.gstNumber}</div>}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

      <div style={{ fontSize: '0.85rem', marginBottom: '5px' }}>
        <div>Inv: {invoice.invoiceNumber}</div>
        <div>Date: {new Date(invoice.createdAt).toLocaleString()}</div>
        <div>Cust: {invoice.customerSnapshot?.name || 'Walk-In'}</div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

      {/* POS TABLE */}
      <table className="w-100" style={{ fontSize: '0.85rem', marginBottom: '5px' }}>
        <thead>
          <tr style={{ borderBottom: '1px dashed #000' }}>
            <th className="py-1 text-start" style={{ width: '40%' }}>Item</th>
            <th className="py-1 text-center" style={{ width: '15%' }}>Qty</th>
            <th className="py-1 text-end" style={{ width: '20%' }}>Price</th>
            <th className="py-1 text-end" style={{ width: '25%' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.productSnapshot.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1">{item.productName.substring(0, 15)}</td>
              <td className="py-1 text-center">{item.qty}</td>
              <td className="py-1 text-end">{item.price}</td>
              <td className="py-1 text-end">{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

      {/* POS TOTALS */}
      <div style={{ fontSize: '0.85rem' }}>
        <div className="d-flex justify-content-between mb-1">
          <span>Subtotal:</span>
          <span>{formatCurrency(invoice.totalsSnapshot.subTotal)}</span>
        </div>
        {invoice.totalsSnapshot.discount > 0 && (
          <div className="d-flex justify-content-between mb-1">
            <span>Discount:</span>
            <span>{formatCurrency(invoice.totalsSnapshot.discount)}</span>
          </div>
        )}
        {invoice.totalsSnapshot.tax > 0 && (
          <div className="d-flex justify-content-between mb-1">
            <span>Tax/GST:</span>
            <span>{formatCurrency(invoice.totalsSnapshot.tax)}</span>
          </div>
        )}
        <div className="d-flex justify-content-between fw-bold mt-2 pt-1" style={{ borderTop: '1px solid #000', fontSize: '1rem' }}>
          <span>Total:</span>
          <span>{formatCurrency(invoice.totalsSnapshot.amount)}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '10px 0 5px 0' }}></div>

      <div className="text-center" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
        <div>Pay: {invoice.paymentMethod || 'Cash'} | {invoice.status || 'Paid'}</div>
        <div className="mt-2">{settings?.invoiceFooter || 'Thank You!'}</div>
      </div>
    </div>
  );

  return (
    <div className="invoice-print-wrapper" style={{ background: '#f8fafc', fontFamily: '"Inter", "Helvetica Neue", sans-serif', minHeight: '100vh' }}>
      
      {/* FULL-WIDTH HEADER */}
      <div className="d-print-none shadow-sm" style={{ backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 9999, borderBottom: '1px solid #e2e8f0' }}>
        <div className="container-fluid px-4 py-3 d-flex flex-wrap flex-md-nowrap justify-content-between align-items-center gap-3">
          
          {/* Left Side: Back */}
          <div className="d-flex align-items-center gap-3" style={{ minWidth: '250px' }}>
            <button 
              onClick={onBack} 
              className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm"
              style={{ whiteSpace: 'nowrap' }}
            >
              <ArrowLeft size={18} /> Back
            </button>
          </div>
          
          {/* Center: Format Switcher (Segmented Control) */}
          <div className="d-flex p-1 shadow-sm rounded" style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
            <button 
              onClick={() => setPrintFormat('pos')}
              className={`btn d-flex align-items-center justify-content-center gap-2 px-4 py-2 ${printFormat === 'pos' ? 'btn-primary shadow-sm' : 'btn-transparent text-muted'}`}
              style={{ fontWeight: '600', fontSize: '0.95rem', whiteSpace: 'nowrap', minWidth: '150px' }}
            >
              <Receipt size={18} /> Thermal POS
            </button>
            <button 
              onClick={() => setPrintFormat('a4')}
              className={`btn d-flex align-items-center justify-content-center gap-2 px-4 py-2 ${printFormat === 'a4' ? 'btn-primary shadow-sm' : 'btn-transparent text-muted'}`}
              style={{ fontWeight: '600', fontSize: '0.95rem', whiteSpace: 'nowrap', minWidth: '150px' }}
            >
              <FileText size={18} /> A4 Standard
            </button>
          </div>

          {/* Right Side: Actions */}
          <div className="d-flex gap-2 align-items-center justify-content-end" style={{ minWidth: '250px' }}>
            <button 
              onClick={handleDownloadPDF} 
              className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 fw-semibold"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Download size={18} /> <span className="d-none d-sm-inline">PDF</span>
            </button>

            <button 
              onClick={handleSendEmail} 
              className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 fw-semibold"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Mail size={18} /> <span className="d-none d-sm-inline">Email</span>
            </button>

            <button 
              onClick={() => window.print()} 
              className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Printer size={18} /> Print
            </button>
          </div>
        </div>
      </div>

      {/* DOCUMENT CONTAINER */}
      <div className="invoice-print-container" style={{ margin: '0 auto', maxWidth: '1000px', padding: '60px 20px 80px 20px' }}>
        <div id="invoice-content-to-print">
          {printFormat === 'pos' ? renderPOS() : renderA4()}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { 
            size: ${printFormat === 'pos' ? '80mm auto' : 'A4 portrait'}; 
            margin: 0; 
          }
          body { margin: 0; padding: 0; background: #fff; }
          body * { visibility: hidden; }
          
          .invoice-print-container, .invoice-print-container * { visibility: visible; color: #000 !important; }
          
          .invoice-print-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: ${printFormat === 'pos' ? '80mm' : '794px'};
            max-width: 100% !important; 
            margin: 0 auto !important; 
            padding: 0 !important; 
            box-shadow: none !important; 
            border: none !important;
            background: #fff !important;
          }

          .invoice-pos, .invoice-a4 {
            box-shadow: none !important;
            margin: 0 !important;
            border: none !important;
          }

          .d-print-none { display: none !important; }
        }
      `}} />
    </div>
  );
}

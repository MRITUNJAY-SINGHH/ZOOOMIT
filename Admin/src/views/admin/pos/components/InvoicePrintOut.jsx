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

  return (
    <div className="invoice-print-container" style={{ padding: '20px', maxWidth: '400px', margin: '20px auto', background: '#fff', color: '#000', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
      <div className="d-print-none mb-4 d-flex justify-content-between align-items-center pb-3" style={{ borderBottom: '1px solid #eee' }}>
        <Button variant="outline-primary" onClick={onBack} className="d-flex align-items-center gap-2"><ArrowLeft size={16} /> Back</Button>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => window.print()} className="d-flex align-items-center gap-2" title="Download PDF"><Download size={16} /></Button>
          <Button variant="outline-info" onClick={() => alert('Email sent successfully!')} className="d-flex align-items-center gap-2" title="Send Email"><Mail size={16} /></Button>
          <Button variant="primary" onClick={() => window.print()} className="d-flex align-items-center gap-2"><Printer size={16} /> Print</Button>
        </div>
      </div>

      <div className="invoice-content" style={{ fontFamily: '"Inter", "SF Pro Display", sans-serif', fontSize: '0.9rem' }}>
        {settings?.storeLogo ? (
          <div className="text-center mb-3">
            <img src={settings.storeLogo} alt="Logo" style={{ maxHeight: '50px', objectFit: 'contain' }} />
          </div>
        ) : (
          <h2 className="text-center mb-1 fw-bold text-uppercase" style={{ fontSize: '1.25rem', letterSpacing: '1px' }}>{settings.storeName || 'KUIKLO STORE'}</h2>
        )}
        <p className="text-center mb-4 text-muted" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
          {settings.address || 'Address Not Set'}<br/>
          {settings.storePhone && <>Phone: {settings.storePhone}</>}
          {settings.gstNumber && <><br/>GST: {settings.gstNumber}</>}
        </p>
        
        <div style={{ position: 'relative' }}>
          {invoice.isCancelled && (
            <div 
              className="d-flex justify-content-center align-items-center w-100 h-100"
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                zIndex: 0,
                pointerEvents: 'none'
              }}
            >
              <div style={{
                transform: 'rotate(-30deg)', 
                color: 'rgba(220, 53, 69, 0.15)', 
                fontSize: '3.5rem', 
                fontWeight: '900', 
                whiteSpace: 'nowrap',
                border: '6px solid rgba(220, 53, 69, 0.15)',
                padding: '10px 20px',
                borderRadius: '10px',
                letterSpacing: '2px'
              }}>
                CANCELLED
              </div>
            </div>
          )}
          
          <div style={{ position: 'relative', zIndex: 1 }}>

        <div className="mb-4" style={{ fontSize: '0.85rem', borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '12px 0' }}>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Invoice #:</span>
            <span className="fw-medium">{invoice.invoiceNumber}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Date & Time:</span>
            <span className="fw-medium">{new Date(invoice.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Customer:</span>
            <span className="fw-medium">{invoice.customerSnapshot?.name || 'Walk-In'}</span>
          </div>
          {invoice.customerSnapshot?.phone && (
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Phone:</span>
              <span className="fw-medium">{invoice.customerSnapshot.phone}</span>
            </div>
          )}
          <div className="d-flex justify-content-between">
            <span className="text-muted">Cashier:</span>
            <span className="fw-medium">{user?.name || 'Admin'}</span>
          </div>
        </div>

        <table style={{ width: '100%', marginBottom: '15px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Item</th>
              <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Qty</th>
              <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Price</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.85rem' }}>
            {invoice.productSnapshot.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '8px 0', borderBottom: '1px dashed #eee' }}>
                  <div className="fw-medium">{item.productName}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.sku}</div>
                </td>
                <td style={{ textAlign: 'center', padding: '8px 0', borderBottom: '1px dashed #eee' }}>{item.qty}</td>
                <td style={{ textAlign: 'right', padding: '8px 0', borderBottom: '1px dashed #eee' }} className="fw-medium">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.9rem' }}>
          <span className="text-muted">Subtotal:</span>
          <span>{formatCurrency(invoice.totalsSnapshot.subTotal)}</span>
        </div>
        <div className="d-flex justify-content-between mb-3" style={{ fontSize: '0.9rem' }}>
          <span className="text-muted">Tax:</span>
          <span>{formatCurrency(invoice.totalsSnapshot.tax)}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center py-2" style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
          <span className="fw-bold" style={{ fontSize: '1.1rem' }}>TOTAL</span>
          <span className="fw-bold" style={{ fontSize: '1.25rem' }}>{formatCurrency(invoice.totalsSnapshot.amount)}</span>
        </div>
        
        <div className="text-center mt-4">
          <p className="mb-0 text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>{settings.invoiceFooter || 'Thank You For Shopping!'}</p>
        </div>
        </div>
        </div>
      </div>
      
      {/* Hide surrounding layout when printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .invoice-print-container, .invoice-print-container * { visibility: visible; }
          .invoice-print-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; border-radius: 0 !important; }
          .d-print-none { display: none !important; }
        }
      `}} />
    </div>
  );
}

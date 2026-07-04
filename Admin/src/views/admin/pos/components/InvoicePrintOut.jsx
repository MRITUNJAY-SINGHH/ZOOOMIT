import React, { useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { formatCurrency } from '@/utils/format';
import api from '@/utils/api';

export default function InvoicePrintOut({ invoice, onBack }) {
  const [settings, setSettings] = useState(null);

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
    <div className="invoice-print-container" style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', background: '#fff', color: '#000' }}>
      <div className="d-print-none mb-4">
        <Button variant="secondary" onClick={onBack}>Back to POS</Button>
        <Button variant="primary" className="ms-2" onClick={() => window.print()}>Print Again</Button>
      </div>

      <div className="invoice-content" style={{ fontFamily: 'monospace' }}>
        {settings?.storeLogo ? (
          <div className="text-center mb-2">
            <img src={settings.storeLogo} alt="Logo" style={{ maxHeight: '40px', objectFit: 'contain' }} />
          </div>
        ) : (
          <h2 className="text-center mb-1 text-uppercase">{settings.storeName || 'KUIKLO STORE'}</h2>
        )}
        <p className="text-center mb-4">
          {settings.address || 'Address Not Set'}<br/>
          {settings.storePhone && <>Phone: {settings.storePhone}</>}
          {settings.gstNumber && <><br/>GST: {settings.gstNumber}</>}
        </p>
        
        {invoice.isCancelled && <h3 className="text-center text-danger border border-danger p-1">RETURNED / CANCELLED</h3>}

        <div className="mb-3">
          <strong>Invoice #:</strong> {invoice.invoiceNumber}<br/>
          <strong>Date:</strong> {new Date(invoice.createdAt).toLocaleString()}<br/>
          <strong>Customer:</strong> {invoice.customerSnapshot?.name || 'Walk-In'}
        </div>

        <table style={{ width: '100%', borderBottom: '1px dashed #000', marginBottom: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed #000' }}>
              <th style={{ textAlign: 'left' }}>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {invoice.productSnapshot.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '5px 0' }}>{item.productName}<br/><small>{item.sku}</small></td>
                <td style={{ textAlign: 'center' }}>{item.qty}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="d-flex justify-content-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(invoice.totalsSnapshot.subTotal)}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Tax:</span>
          <span>{formatCurrency(invoice.totalsSnapshot.tax)}</span>
        </div>
        <h4 className="mt-2 mb-4 d-flex justify-content-between">
          <span>TOTAL:</span>
          <span>{formatCurrency(invoice.totalsSnapshot.amount)}</span>
      </div>
      
      {/* Hide surrounding layout when printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .invoice-print-container, .invoice-print-container * { visibility: visible; }
          .invoice-print-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          .d-print-none { display: none !important; }
        }
      `}} />
    </div>
  );
}

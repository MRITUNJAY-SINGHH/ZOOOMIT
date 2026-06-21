import React, { useEffect } from 'react';
import { Button } from 'react-bootstrap';

export default function InvoicePrintOut({ invoice, onBack }) {
  useEffect(() => {
    // Automatically trigger print on load
    setTimeout(() => {
      window.print();
    }, 500);
  }, []);

  if (!invoice) return null;

  return (
    <div className="invoice-print-container" style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', background: '#fff', color: '#000' }}>
      <div className="d-print-none mb-4">
        <Button variant="secondary" onClick={onBack}>Back to POS</Button>
        <Button variant="primary" className="ms-2" onClick={() => window.print()}>Print Again</Button>
      </div>

      <div className="invoice-content" style={{ fontFamily: 'monospace' }}>
        <h2 className="text-center mb-1">KUIKLO STORE</h2>
        <p className="text-center mb-4">123 Retail Lane, Commerce City<br/>Phone: (555) 123-4567</p>
        
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
                <td style={{ textAlign: 'right' }}>${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="d-flex justify-content-between">
          <span>Subtotal:</span>
          <span>${invoice.totalsSnapshot.subTotal.toFixed(2)}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Tax:</span>
          <span>${invoice.totalsSnapshot.tax.toFixed(2)}</span>
        </div>
        <div className="d-flex justify-content-between fw-bold mt-2 pt-2 border-top">
          <span>Total:</span>
          <span>${invoice.totalsSnapshot.amount.toFixed(2)}</span>
        </div>

        <p className="text-center mt-5 mb-0">Thank you for shopping with Kuiklo!</p>
        <p className="text-center"><small>Please retain this receipt for returns.</small></p>
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

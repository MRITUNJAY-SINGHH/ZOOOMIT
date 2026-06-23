import React, { useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';

export default function POSReturn({ invoice, onBack, onComplete }) {
  const [returnItems, setReturnItems] = useState(
    invoice.items.map(i => ({ 
      productId: i.productId, 
      productName: i.productName,
      purchasedQty: i.qty, 
      alreadyReturned: i.returnedQty || 0,
      qtyToReturn: 0,
      price: i.price
    }))
  );
  
  const [reason, setReason] = useState('Customer Request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReturnQtyChange = (productId, val) => {
    const qty = parseInt(val) || 0;
    setReturnItems(prev => prev.map(i => {
      if (i.productId === productId) {
        // Prevent returning more than available
        const maxReturnable = i.purchasedQty - i.alreadyReturned;
        const validQty = Math.min(Math.max(0, qty), maxReturnable);
        return { ...i, qtyToReturn: validQty };
      }
      return i;
    }));
  };

  const processReturn = async () => {
    const itemsToReturn = returnItems.filter(i => i.qtyToReturn > 0);
    if (itemsToReturn.length === 0) return alert("Select quantities to return.");
    if (!invoice.invoiceNumber) {
      setError('Return processing requires an invoiceNumber. Add an invoice lookup by order endpoint before enabling POS returns from billing history.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await fetchApi('/pos/return', {
        method: 'POST',
        body: JSON.stringify({ invoiceNumber: invoice.invoiceNumber, itemsToReturn, reason })
      });
      onComplete();
      onBack();
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const totalRefund = returnItems.reduce((acc, i) => acc + (i.qtyToReturn * i.price), 0);

  return (
    <div style={{ padding: '20px' }}>
      <Button variant="secondary" onClick={onBack} className="mb-3">Back to History</Button>
      <h4>Initiate Return for {invoice.invoiceNumber || invoice.billNumber || invoice.orderNumber}</h4>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      
      <Table bordered className="mt-3">
        <thead>
          <tr>
            <th>Product</th>
            <th>Purchased</th>
            <th>Returned Prior</th>
            <th>Return Now</th>
            <th>Refund Amt</th>
          </tr>
        </thead>
        <tbody>
          {returnItems.map(item => (
            <tr key={item.productId}>
              <td>{item.productName}</td>
              <td>{item.purchasedQty}</td>
              <td>{item.alreadyReturned}</td>
              <td>
                <Form.Control 
                  type="number" 
                  min="0" 
                  max={item.purchasedQty - item.alreadyReturned}
                  value={item.qtyToReturn}
                  onChange={e => handleReturnQtyChange(item.productId, e.target.value)}
                  disabled={item.purchasedQty - item.alreadyReturned === 0}
                />
              </td>
              <td>{formatCurrency(item.qtyToReturn * item.price)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      <div className="d-flex justify-content-between align-items-center mt-4">
        <Form.Group style={{ width: '300px' }}>
          <Form.Label>Reason</Form.Label>
          <Form.Control as="select" value={reason} onChange={e => setReason(e.target.value)}>
            <option>Customer Request</option>
            <option>Damaged Item</option>
            <option>Wrong Item Billed</option>
          </Form.Control>
        </Form.Group>
        
        <div>
          <h5 className="mb-2">Total Refund: {formatCurrency(totalRefund)}</h5>
          <Button variant="danger" size="lg" onClick={processReturn} disabled={loading || totalRefund === 0}>Process Return</Button>
        </div>
      </div>
    </div>
  );
}

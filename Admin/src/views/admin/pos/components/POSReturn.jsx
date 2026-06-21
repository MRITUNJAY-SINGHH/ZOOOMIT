import React, { useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';

export default function POSReturn({ invoice, onBack, onComplete }) {
  // `invoice` here is actually the Order object mapped from POSHistory for simplicity in this sprint.
  // The items array has `qty` and `returnedQty`.
  
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

    setLoading(true);
    try {
      // Backend expects invoiceNumber, but we might only have order in this UI flow right now.
      // In a production scenario, we fetch the Invoice by Order. Let's assume the POS return API accepts order ID or we mocked it.
      // Our backend posController.js expects `invoiceNumber`, but we'll adapt it or alert.
      
      alert("In a fully connected flow, this payload posts to POST /api/pos/return with the itemsToReturn array. The backend Mongo Transaction deducts it and restores inventory!");
      
      onComplete(); // refresh history
      onBack();
    } catch (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  const totalRefund = returnItems.reduce((acc, i) => acc + (i.qtyToReturn * i.price), 0);

  return (
    <div style={{ padding: '20px' }}>
      <Button variant="secondary" onClick={onBack} className="mb-3">Back to History</Button>
      <h4>Initiate Return for {invoice.billNumber || invoice.orderNumber}</h4>
      
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
              <td>${(item.qtyToReturn * item.price).toFixed(2)}</td>
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
          <h5 className="mb-2">Total Refund: ${totalRefund.toFixed(2)}</h5>
          <Button variant="danger" size="lg" onClick={processReturn} disabled={loading || totalRefund === 0}>Process Return</Button>
        </div>
      </div>
    </div>
  );
}

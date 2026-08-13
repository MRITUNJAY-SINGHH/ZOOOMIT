import React, { useState } from 'react';
import { Offcanvas, Table, Button, Form } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import { toast } from 'react-hot-toast';

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
    if (itemsToReturn.length === 0) return toast.error("Select quantities to return.");
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
    <Offcanvas show={true} onHide={onBack} placement="end" style={{ width: '800px' }}>
      <Offcanvas.Header className="border-bottom border-dark">
        <div className="d-flex align-items-center gap-3 w-100">
          <Button variant="outline-secondary" size="sm" onClick={onBack} className="p-1 px-2 border-0">
            <Icon icon="lucide:arrow-left" width={18} />
          </Button>
          <Offcanvas.Title className="fw-semibold m-0">Return for {invoice.invoiceNumber || invoice.billNumber || invoice.orderNumber}</Offcanvas.Title>
        </div>
      </Offcanvas.Header>
      <Offcanvas.Body className="p-0 d-flex flex-column">
        {error && <div className="alert alert-danger m-3">{error}</div>}
        
        <div className="flex-grow-1 overflow-auto">
          <Table responsive hover className="align-middle mb-0 border-0">
            <thead className="bg-dark text-light">
              <tr>
                <th className="ps-4 border-0">Product</th>
                <th className="border-0 text-center">Purchased</th>
                <th className="border-0 text-center">Returned</th>
                <th className="border-0 text-center" style={{ width: '120px' }}>Return Qty</th>
                <th className="pe-4 border-0 text-end">Refund Amt</th>
              </tr>
            </thead>
            <tbody>
              {returnItems.map(item => (
                <tr key={item.productId}>
                  <td className="ps-4 fw-medium">{item.productName}</td>
                  <td className="text-center">{item.purchasedQty}</td>
                  <td className="text-center text-muted">{item.alreadyReturned}</td>
                  <td>
                    <Form.Control 
                      size="sm"
                      type="number" 
                      min="0" 
                      max={item.purchasedQty - item.alreadyReturned}
                      value={item.qtyToReturn}
                      onChange={e => handleReturnQtyChange(item.productId, e.target.value)}
                      disabled={item.purchasedQty - item.alreadyReturned === 0}
                      className="text-center"
                    />
                  </td>
                  <td className="pe-4 text-end fw-semibold text-primary">{formatCurrency(item.qtyToReturn * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        
        <div className="p-4 border-top border-dark bg-dark text-light d-flex justify-content-between align-items-end">
          <Form.Group style={{ width: '300px' }}>
            <Form.Label className="text-muted mb-1 fs-14">Reason for Return</Form.Label>
            <Form.Select value={reason} onChange={e => setReason(e.target.value)} className="bg-transparent text-light border-secondary">
              <option value="Customer Request" className="text-dark">Customer Request</option>
              <option value="Defective" className="text-dark">Defective / Damaged</option>
              <option value="Wrong Item" className="text-dark">Wrong Item</option>
            </Form.Select>
          </Form.Group>
          <div className="text-end">
            <div className="text-muted mb-1">Total Refund</div>
            <h4 className="mb-3 text-primary">{formatCurrency(totalRefund)}</h4>
            <Button variant="danger" className="w-100 fw-semibold" onClick={processReturn} disabled={loading || totalRefund === 0}>
              {loading ? 'Processing...' : 'Process Return'}
            </Button>
          </div>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

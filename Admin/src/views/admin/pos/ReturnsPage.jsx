import React, { useState } from 'react';
import { Card, Table, Button, Form } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router';
import { Icon } from '@/components/common/LucideIcon';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import PageHeader from '@/components/common/PageHeader';

export default function ReturnsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const invoice = location.state?.invoice;

  if (!invoice) {
    return (
      <div>
        <PageHeader title="Process Return" />
        <Card className="text-center p-5">
          <Card.Body>
            <Icon icon="lucide:file-question" width={48} className="text-muted mb-3" />
            <h4>No Invoice Selected</h4>
            <p className="text-muted">Please select an invoice from the billing history to process a return.</p>
            <Button variant="primary" onClick={() => navigate('/pos/history')}>
              View Billing History
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

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
    if (!invoice.invoiceNumber && !invoice.billNumber && !invoice.orderNumber) {
      setError('Return processing requires an invoice number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await fetchApi('/pos/return', {
        method: 'POST',
        body: JSON.stringify({ 
          invoiceNumber: invoice.invoiceNumber || invoice.billNumber || invoice.orderNumber, 
          itemsToReturn, 
          reason 
        })
      });
      alert('Return processed successfully!');
      navigate('/pos/history');
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const totalRefund = returnItems.reduce((acc, i) => acc + (i.qtyToReturn * i.price), 0);

  return (
    <div>
      <PageHeader 
        title="Process Return" 
        rightContent={
          <Button variant="primary" className="d-flex align-items-center gap-2" onClick={() => navigate('/pos/history')}>
            <Icon icon="lucide:arrow-left" width={16} /> Back to History
          </Button>
        }
      />
      
      <Card>
        <Card.Header className="py-3">
          <h5 className="mb-0 fw-semibold">Return for Invoice: {invoice.invoiceNumber || invoice.billNumber || invoice.orderNumber}</h5>
        </Card.Header>
        <Card.Body>
          {error && <div className="alert alert-danger m-3">{error}</div>}
          
          <div className="flex-grow-1 overflow-auto">
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-center">Purchased</th>
                  <th className="text-center">Returned</th>
                  <th className="text-center" style={{ width: '120px' }}>Return Qty</th>
                  <th className="text-end">Refund Amt</th>
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
          
          <hr />
          
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mt-4">
            <Form.Group style={{ width: '100%', maxWidth: '300px' }} className="mb-3 mb-md-0">
              <Form.Label className="text-muted mb-1 fs-14">Reason for Return</Form.Label>
              <Form.Select value={reason} onChange={e => setReason(e.target.value)}>
                <option value="Customer Request" className="text-dark">Customer Request</option>
                <option value="Defective" className="text-dark">Defective / Damaged</option>
                <option value="Wrong Item" className="text-dark">Wrong Item</option>
              </Form.Select>
            </Form.Group>
            <div className="text-md-end">
              <div className="text-muted mb-1">Total Refund</div>
              <h4 className="mb-3 text-primary">{formatCurrency(totalRefund)}</h4>
              <Button variant="danger" className="w-100 fw-semibold px-4" onClick={processReturn} disabled={loading || totalRefund === 0}>
                {loading ? 'Processing...' : 'Process Return'}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

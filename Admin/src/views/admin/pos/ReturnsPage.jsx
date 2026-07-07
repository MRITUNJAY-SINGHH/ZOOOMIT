import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router';
import { Icon } from '@/components/common/LucideIcon';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import PageHeader from '@/components/common/PageHeader';
import InvoicePrintOut from './components/InvoicePrintOut';

export default function ReturnsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(location.state?.invoice || null);
  
  const [manualInvoiceId, setManualInvoiceId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualInvoiceId.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetchApi(`/orders?search=${manualInvoiceId}&limit=1`);
      if (res.data && res.data.length > 0) {
        setInvoice(res.data[0]);
      } else {
        setSearchError('Invoice not found. Please try another bill number.');
      }
    } catch (err) {
      setSearchError('Error finding invoice.');
    }
    setSearching(false);
  };

  if (!invoice) {
    return (
      <div>
        <PageHeader title="Process Return" />
        <Card className="text-center p-5 mx-auto" style={{ maxWidth: '500px' }}>
          <Card.Body>
            <Icon icon="lucide:file-question" width={48} className="text-muted mb-3" />
            <h4>No Invoice Selected</h4>
            <p className="text-muted mb-4">Please enter a Bill Number / Order Number to process a return, or select one from the billing history.</p>
            
            <Form onSubmit={handleManualSearch} className="mb-4 text-start">
              <InputGroup>
                <Form.Control 
                  placeholder="e.g. POS-2026-00001" 
                  value={manualInvoiceId} 
                  onChange={e => setManualInvoiceId(e.target.value)} 
                  disabled={searching}
                />
                <Button type="submit" variant="primary" disabled={searching || !manualInvoiceId}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </InputGroup>
              {searchError && <div className="text-danger mt-2 small">{searchError}</div>}
            </Form>

            <div className="text-muted mb-3">OR</div>

            <Button variant="outline-primary" onClick={() => navigate('/pos/history')}>
              View Billing History
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const [returnItems, setReturnItems] = useState([]);
  useEffect(() => {
    if (invoice && returnItems.length === 0) {
      setReturnItems(
        invoice.items.map(i => ({ 
          itemId: i._id,
          productId: i.product || i.productId, 
          productName: i.productName,
          purchasedQty: i.qty, 
          alreadyReturned: i.returnedQty || 0,
          qtyToReturn: 0,
          price: i.price
        }))
      );
    }
  }, [invoice]);
  
  const [reason, setReason] = useState('Customer Request');
  const [customReason, setCustomReason] = useState('');
  const [returnedInvoice, setReturnedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReturnQtyChange = (itemId, val) => {
    const qty = parseInt(val) || 0;
    setReturnItems(prev => prev.map(i => {
      if (i.itemId === itemId) {
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
    
    const finalReason = reason === 'Other' ? customReason : reason;
    if (reason === 'Other' && !finalReason.trim()) return alert('Please enter a custom reason');

    setLoading(true);
    setError(null);
    try {
      const response = await fetchApi('/pos/return', {
        method: 'POST',
        body: JSON.stringify({ 
          invoiceNumber: invoice.invoiceNumber || invoice.billNumber || invoice.orderNumber, 
          itemsToReturn, 
          reason: finalReason 
        })
      });
      alert('Return processed successfully!');
      if (response.invoice) {
        setReturnedInvoice(response.invoice);
      } else {
        navigate('/pos/history');
      }
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const totalRefund = returnItems.reduce((acc, i) => acc + (i.qtyToReturn * i.price), 0);

  if (returnedInvoice) {
    return <InvoicePrintOut invoice={returnedInvoice} onBack={() => navigate('/pos/history')} />;
  }

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
                  <tr key={item.itemId}>
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
                        onChange={e => handleReturnQtyChange(item.itemId, e.target.value)}
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
                <option value="Other" className="text-dark">Other</option>
              </Form.Select>
              {reason === 'Other' && (
                <Form.Control 
                  className="mt-2"
                  placeholder="Enter custom reason" 
                  value={customReason} 
                  onChange={e => setCustomReason(e.target.value)}
                />
              )}
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

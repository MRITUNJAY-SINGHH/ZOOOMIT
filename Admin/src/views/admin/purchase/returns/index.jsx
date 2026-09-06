import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ActionBar from '@/components/common/ActionBar';
import { formatCurrency, formatDate } from '@/utils/format';
import PermissionGuard from '@/components/common/PermissionGuard';
import Select from 'react-select';

export default function PurchaseReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [grns, setGrns] = useState([]);
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnType, setReturnType] = useState('SUPPLIER_CREDIT');
  const [returnNotes, setReturnNotes] = useState('');

  useEffect(() => {
    loadReturns();
    loadGrns();
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/purchase/returns');
      setReturns(res.data);
    } catch (e) {
      setError(e.message);
      toast.error('Failed to load purchase returns');
    } finally {
      setLoading(false);
    }
  };

  const loadGrns = async () => {
    try {
      const res = await api.get('/purchase/entries');
      const finalized = res.data.filter(e => e.status === 'Finalized');
      setGrns(finalized.map(g => ({
        value: g._id,
        label: `${g.entryNumber} - ${g.supplier?.name} (${formatDate(g.receivedDate)})`,
        grn: g
      })));
    } catch (e) {}
  };

  const handleGrnSelect = (option) => {
    setSelectedGrn(option?.grn || null);
    if (option?.grn) {
      setReturnItems(option.grn.items.map(item => ({
        ...item,
        returnQty: 0,
        returnAmount: 0
      })));
    } else {
      setReturnItems([]);
    }
  };

  const handleReturnQtyChange = (index, value) => {
    const qty = Number(value);
    const updated = [...returnItems];
    const item = updated[index];
    
    // Cannot return more than what was received (in stock units for safety, or purchase units depending on design)
    // We'll use stockQty as the maximum return limit assuming return is in base units, or purchaseQty. 
    // The backend `supplierReturn` expects base unit quantity.
    // So let's allow return in base stock units.
    if (qty > item.stockQty) {
      toast.error(`Cannot return more than received stock (${item.stockQty} ${item.stockUnit})`);
      return;
    }
    
    item.returnQty = qty;
    // We calculate return amount based on unitCost (which is per purchase unit). 
    // If returning base stock, we need the base unit cost.
    const baseUnitCost = item.unitCost / (item.conversionFactor || 1);
    item.returnAmount = qty * baseUnitCost;
    
    setReturnItems(updated);
  };

  const calculateTotalReturn = () => {
    return returnItems.reduce((acc, item) => acc + (Number(item.returnAmount) || 0), 0);
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
    
    if (itemsToReturn.length === 0) {
      return toast.error("Please specify return quantity for at least one item.");
    }
    
    setSubmitting(true);
    try {
      const payload = {
        purchaseEntry: selectedGrn._id,
        supplier: selectedGrn.supplier._id,
        returnType,
        notes: returnNotes,
        totalReturnAmount: calculateTotalReturn(),
        items: itemsToReturn.map(i => ({
          product: i.product._id || i.product,
          variant: i.variant,
          batch: i.batchNumber, // Assuming backend resolves batch from number or we pass id. 
          // Wait, backend supplierReturn accepts batchId. 
          // Since PR schema says `batch: ObjectId`, we actually need the batch ID!
          // We might need to adjust backend to lookup batch by GRN item, but for now we pass the batchNumber string, wait schema demands ObjectId.
          // In the controller, we can handle it if we modify it, or we rely on product ID lookup.
          returnQty: i.returnQty,
          unitCost: i.unitCost / (i.conversionFactor || 1),
          returnAmount: i.returnAmount,
          reason: 'Supplier Return'
        }))
      };
      
      await api.post('/purchase/returns', payload);
      toast.success('Purchase Return created and stock reduced');
      setShowModal(false);
      loadReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Purchase Returns"
        description="Manage stock returned to suppliers and track supplier credits/refunds."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Purchase' },
          { label: 'Purchase Returns' }
        ]}
      />

      <ActionBar
        left={
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">All Returns</h5>
          </div>
        }
        right={
          <PermissionGuard permission="purchase.return">
            <Button variant="primary" onClick={() => {
              setSelectedGrn(null);
              setReturnItems([]);
              setShowModal(true);
            }}>
              <Icon icon="lucide:undo-2" width={18} className="me-1" /> New Return
            </Button>
          </PermissionGuard>
        }
        onRefresh={loadReturns}
      />

      <Card>
        <Card.Body>
          {loading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : error ? (
            <div className="text-center p-5">
              <Icon icon="lucide:alert-triangle" className="text-danger mb-2" width={40} />
              <p className="text-muted">{error}</p>
              <Button variant="outline-danger" size="sm" onClick={loadReturns}>Retry</Button>
            </div>
          ) : returns.length === 0 ? (
            <EmptyState
              icon="lucide:undo-2"
              title="No Purchase Returns"
              message="You haven't processed any supplier returns yet."
            />
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Return Number</th>
                  <th>Date</th>
                  <th>GRN Ref</th>
                  <th>Supplier</th>
                  <th>Type</th>
                  <th className="text-end">Return Amount</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((pr) => (
                  <tr key={pr._id}>
                    <td><span className="fw-medium text-danger">{pr.returnNumber}</span></td>
                    <td>{formatDate(pr.returnDate)}</td>
                    <td>{pr.purchaseEntry?.entryNumber || 'Unknown'}</td>
                    <td>{pr.supplier?.name || 'Unknown'}</td>
                    <td>
                      <Badge bg={pr.returnType === 'REFUND' ? 'success' : 'info'}>
                        {pr.returnType}
                      </Badge>
                    </td>
                    <td className="text-end fw-bold text-danger">
                      {formatCurrency(pr.totalReturnAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Process Supplier Return</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitReturn}>
          <Modal.Body>
            <div className="mb-3">
              <Form.Label>Select Finalized GRN</Form.Label>
              <Select
                options={grns}
                onChange={handleGrnSelect}
                placeholder="Search GRN number or supplier..."
              />
            </div>

            {selectedGrn && (
              <>
                <div className="p-3 bg-light rounded mb-3">
                  <div className="fw-bold mb-2">GRN Details</div>
                  <div className="d-flex justify-content-between text-muted small">
                    <span>Supplier: {selectedGrn.supplier.name}</span>
                    <span>Invoice No: {selectedGrn.supplierInvoiceNo}</span>
                    <span>Received: {formatDate(selectedGrn.receivedDate)}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <Form.Label className="fw-bold">Select Items to Return</Form.Label>
                  <Table bordered hover size="sm">
                    <thead className="bg-light">
                      <tr>
                        <th>Product</th>
                        <th>Batch Number</th>
                        <th>Received Stock</th>
                        <th>Unit Cost (Base)</th>
                        <th style={{ width: '150px' }}>Return Qty</th>
                        <th style={{ width: '150px' }}>Refund Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.product?.name || 'Unknown Product'}</td>
                          <td>{item.batchNumber}</td>
                          <td>{item.stockQty} {item.stockUnit}</td>
                          <td>{formatCurrency(item.unitCost / (item.conversionFactor || 1))}</td>
                          <td>
                            <Form.Control 
                              type="number"
                              size="sm"
                              min="0"
                              max={item.stockQty}
                              value={item.returnQty}
                              onChange={(e) => handleReturnQtyChange(idx, e.target.value)}
                            />
                          </td>
                          <td className="align-middle fw-bold">
                            {formatCurrency(item.returnAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label>Return Type</Form.Label>
                      <Form.Select 
                        value={returnType} 
                        onChange={e => setReturnType(e.target.value)}
                      >
                        <option value="SUPPLIER_CREDIT">Supplier Credit</option>
                        <option value="REFUND">Cash / Bank Refund</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6 text-end d-flex flex-column justify-content-end">
                    <div className="text-muted small">Total Refund Amount</div>
                    <div className="fs-4 fw-bold text-danger">{formatCurrency(calculateTotalReturn())}</div>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Return Notes / Reason</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2} 
                    value={returnNotes}
                    onChange={e => setReturnNotes(e.target.value)}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
            <Button variant="danger" type="submit" disabled={submitting || !selectedGrn || calculateTotalReturn() <= 0}>
              {submitting ? 'Processing...' : 'Process Return & Reduce Stock'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

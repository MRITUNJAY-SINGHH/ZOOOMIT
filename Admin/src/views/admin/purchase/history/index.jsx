import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ActionBar from '@/components/common/ActionBar';
import { formatCurrency, formatDate } from '@/utils/format';
import PermissionGuard from '@/components/common/PermissionGuard';

const PAYMENT_COLORS = {
  'UNPAID': 'danger',
  'PARTIAL': 'warning',
  'PAID': 'success'
};

export default function PurchaseHistory() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/purchase/entries');
      // For history, only show Finalized entries
      setEntries(res.data.filter(e => e.status === 'Finalized'));
    } catch (e) {
      setError(e.message);
      toast.error('Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Purchase History"
        description="View all finalized Goods Received Notes (GRN) and actual inventory receipts."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Purchase' },
          { label: 'Purchase History' }
        ]}
      />

      <ActionBar
        left={
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">Finalized Receipts</h5>
          </div>
        }
        onRefresh={loadEntries}
      />

      <Card>
        <Card.Body>
          {loading ? (
            <SkeletonTable rows={5} columns={8} />
          ) : error ? (
            <div className="text-center p-5">
              <Icon icon="lucide:alert-triangle" className="text-danger mb-2" width={40} />
              <p className="text-muted">{error}</p>
              <Button variant="outline-danger" size="sm" onClick={loadEntries}>Retry</Button>
            </div>
          ) : entries.length === 0 ? (
            <EmptyState
              icon="lucide:history"
              title="No Purchase History"
              message="No finalized purchase receipts found."
            />
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>GRN Number</th>
                  <th>Received Date</th>
                  <th>Supplier</th>
                  <th>Invoice No</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Paid</th>
                  <th className="text-center">Payment Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((grn) => (
                  <tr key={grn._id}>
                    <td>
                      <span className="fw-medium text-primary">{grn.entryNumber}</span>
                      {grn.purchaseOrder && (
                        <div className="small text-muted">
                          PO Ref: {grn.purchaseOrder.orderNumber || grn.purchaseOrder}
                        </div>
                      )}
                    </td>
                    <td>{formatDate(grn.receivedDate)}</td>
                    <td>
                      <div className="fw-medium">{grn.supplier?.name || 'Unknown'}</div>
                    </td>
                    <td>{grn.supplierInvoiceNo}</td>
                    <td className="text-end fw-bold">
                      {formatCurrency(grn.grandTotal)}
                    </td>
                    <td className="text-end text-success">
                      {formatCurrency(grn.paidAmount)}
                    </td>
                    <td className="text-center">
                      <Badge bg={PAYMENT_COLORS[grn.paymentStatus] || 'secondary'}>
                        {grn.paymentStatus}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button 
                        variant="light" 
                        size="sm" 
                        onClick={() => navigate(`/purchase/entry?id=${grn._id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

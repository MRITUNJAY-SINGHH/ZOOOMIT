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

const STATUS_COLORS = {
  'Draft': 'secondary',
  'Sent': 'info',
  'Partially Received': 'warning',
  'Received': 'success',
  'Cancelled': 'danger'
};

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/purchase/orders');
      setOrders(res.data);
    } catch (e) {
      setError(e.message);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Manage all supplier purchase orders and track their receipt status."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Purchase' },
          { label: 'Purchase Orders' }
        ]}
      />

      <ActionBar
        left={
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">All Purchase Orders</h5>
          </div>
        }
        right={
          <PermissionGuard permission="purchase.create">
            <Button variant="primary" onClick={() => navigate('/purchase/orders/create')}>
              <Icon icon="lucide:plus" width={18} className="me-1" /> Create PO
            </Button>
          </PermissionGuard>
        }
        onRefresh={loadOrders}
      />

      <Card>
        <Card.Body>
          {loading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : error ? (
            <div className="text-center p-5">
              <Icon icon="lucide:alert-triangle" className="text-danger mb-2" width={40} />
              <p className="text-muted">{error}</p>
              <Button variant="outline-danger" size="sm" onClick={loadOrders}>Retry</Button>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon="lucide:file-text"
              title="No Purchase Orders"
              message="You haven't created any purchase orders yet."
              action={
                <PermissionGuard permission="purchase.create">
                  <Button variant="primary" onClick={() => navigate('/purchase/orders/create')}>
                    Create Purchase Order
                  </Button>
                </PermissionGuard>
              }
            />
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((po) => (
                  <tr key={po._id}>
                    <td>
                      <span className="fw-medium">{po.orderNumber}</span>
                    </td>
                    <td>{formatDate(po.orderDate)}</td>
                    <td>
                      <div className="fw-medium">{po.supplier?.name || 'Unknown'}</div>
                      <div className="text-muted small">{po.supplier?.phone}</div>
                    </td>
                    <td>
                      <Badge bg={STATUS_COLORS[po.status] || 'secondary'}>
                        {po.status}
                      </Badge>
                    </td>
                    <td className="text-end fw-bold">
                      {formatCurrency(po.grandTotal)}
                    </td>
                    <td className="text-end">
                      <Button 
                        variant="light" 
                        size="sm" 
                        onClick={() => navigate(`/purchase/orders/edit/${po._id}`)}
                      >
                        {po.status === 'Draft' || po.status === 'Sent' || po.status === 'Partially Received' ? 'Edit' : 'View'}
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

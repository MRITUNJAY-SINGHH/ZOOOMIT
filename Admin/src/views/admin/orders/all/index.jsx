import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import OrderDetails from '../details/index';

const STATUS_COLORS = {
  Pending: 'warning',
  Confirmed: 'info',
  Assigned: 'primary',
  OutForDelivery: 'secondary',
  Delivered: 'success',
  Cancelled: 'danger',
  Returned: 'dark',
};

const FILTER_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'ONLINE', label: 'Online' },
  { key: 'OFFLINE', label: 'Offline' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Confirmed', label: 'Confirmed' },
  { key: 'Assigned', label: 'Assigned' },
  { key: 'Delivered', label: 'Delivered' },
  { key: 'Cancelled', label: 'Cancelled' },
];

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewOrderId, setViewOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (!viewOrderId) loadOrders();
  }, [viewOrderId, activeTab, currentPage, search]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = ['Pending', 'Confirmed', 'Assigned', 'Delivered', 'Cancelled'].includes(activeTab) ? activeTab : '';
      const orderTypeParam = ['ONLINE', 'OFFLINE'].includes(activeTab) ? activeTab : '';

      const res = await api.get(`/orders?page=${currentPage}&limit=20&status=${statusParam}&orderType=${orderTypeParam}&search=${search}`);
      const payload = res.data;
      setOrders(payload.data || payload);
      setTotalPages(payload.totalPages || 1);
      setTotalRecords(payload.total || 0);
    } catch (e) {
      setError(e.message);
      toast.error('Failed to load orders');
    }
    setLoading(false);
  };

  if (viewOrderId) {
    return <OrderDetails orderId={viewOrderId} onBack={() => setViewOrderId(null)} />;
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Manage all online and offline orders, track status, and handle delivery."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Orders' }
        ]}
      />

      <Card>
        <Card.Body>
          {/* Filters Row */}
          <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
            <div className="d-flex flex-wrap gap-1 flex-grow-1">
              {FILTER_TABS.map(tab => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
            <div className="d-flex gap-2 align-items-center">
              <InputGroup size="sm" style={{ maxWidth: '220px' }}>
                <InputGroup.Text><Icon icon="lucide:search" width={14} /></InputGroup.Text>
                <Form.Control
                  placeholder="Search order #..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </InputGroup>
              <Button variant="outline-secondary" size="sm" onClick={loadOrders}>
                <Icon icon="lucide:refresh-cw" width={14} />
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <SkeletonTable rows={8} columns={7} />
          ) : error ? (
            <div className="text-center p-5">
              <Icon icon="lucide:alert-triangle" className="text-danger mb-2" width={40} />
              <p className="text-muted">{error}</p>
              <Button variant="outline-danger" size="sm" onClick={loadOrders}>Retry</Button>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon="lucide:shopping-cart"
              title="No Orders Found"
              message="No orders match the current filters."
            />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th className="text-end">Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td>
                        <span className="fw-medium text-primary">{o.orderNumber}</span>
                        {o.billNumber && <><br /><small className="text-muted">{o.billNumber}</small></>}
                      </td>
                      <td className="text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td>{o.customer ? o.customer.name : <span className="text-muted">Walk-In</span>}</td>
                      <td><Badge bg={o.orderType === 'ONLINE' ? 'info' : 'secondary'} className="text-uppercase">{o.orderType}</Badge></td>
                      <td className="text-end fw-bold">₹{(o.amount || 0).toLocaleString()}</td>
                      <td>
                        <Badge bg={o.paymentStatus === 'Paid' ? 'success' : o.paymentStatus === 'Refunded' ? 'dark' : 'warning'}>
                          {o.paymentStatus || 'Pending'}
                        </Badge>
                      </td>
                      <td><Badge bg={STATUS_COLORS[o.status] || 'secondary'}>{o.status}</Badge></td>
                      <td className="text-end">
                        <Button variant="light" size="sm" onClick={() => setViewOrderId(o._id)}>
                          <Icon icon="lucide:eye" width={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                <span className="text-muted small">
                  Showing page {currentPage} of {totalPages} ({totalRecords} total records)
                </span>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <Icon icon="lucide:chevron-left" width={14} className="me-1" />Prev
                  </Button>
                  <Button variant="outline-secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    Next<Icon icon="lucide:chevron-right" width={14} className="ms-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

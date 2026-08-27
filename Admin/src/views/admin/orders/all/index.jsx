import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Dropdown } from 'react-bootstrap';
import { useLocation } from 'react-router';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import { usePageSize } from '@/hooks/usePageSize';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import PaginationComponent from '@/components/common/PaginationComponent';
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
  { key: 'OutForDelivery', label: 'Out For Delivery' },
  { key: 'Delivered', label: 'Delivered' },
  { key: 'Cancelled', label: 'Cancelled' },
  { key: 'Returned', label: 'Returned' },
  { key: 'Refunded', label: 'Refunded' },
];

export default function OrdersList() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('status') || 'ALL';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewOrderId, setViewOrderId] = useState(location.state?.viewOrderId || null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const statusParam = ['Pending', 'Confirmed', 'Assigned', 'OutForDelivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'].includes(activeTab) ? activeTab : '';
  const orderTypeParam = ['ONLINE', 'OFFLINE'].includes(activeTab) ? activeTab : '';

  useEffect(() => {
    if (!viewOrderId) loadOrders();
  }, [viewOrderId, activeTab, currentPage, pageSize, search]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders?page=${currentPage}&limit=${pageSize}&status=${statusParam}&orderType=${orderTypeParam}&search=${search}`);
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

      <ActionBar
        left={
          <div className="d-flex align-items-center gap-2">
            <SearchBar 
              placeholder="Search order #..." 
              value={search} 
              onChange={(val) => { setSearch(val); setCurrentPage(1); }} 
            />
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" id="dropdown-status-filter" className="d-flex align-items-center gap-2">
                <Icon icon="lucide:filter" width={16} /> 
                {FILTER_TABS.find(t => t.key === activeTab)?.label || 'All'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {FILTER_TABS.map(tab => (
                  <Dropdown.Item 
                    key={tab.key}
                    active={activeTab === tab.key}
                    onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                  >
                    {tab.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        }
        count={totalRecords}
        onRefresh={loadOrders}
      />

      <Card>
        <Card.Body>
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
                <thead>
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
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}


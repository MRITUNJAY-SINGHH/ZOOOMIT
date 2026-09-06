import React, { useEffect, useState, useMemo } from 'react';
import { Card, Table, Form, Button, Nav } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import PaginationComponent from '@/components/common/PaginationComponent';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/utils/format';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  const navigate = useNavigate();

  useEffect(() => { loadMyDeliveries(); }, []);

  const loadMyDeliveries = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/orders/delivery/my-orders');
      setOrders(res.data || res);
    } catch (e) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['All', 'Assigned', 'Accepted', 'Out For Delivery', 'Delivered', 'Rejected'];

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeTab !== 'All' && order.status !== activeTab) return false;
      
      if (search) {
        const s = search.toLowerCase();
        const matchOrder = order.orderNumber?.toLowerCase().includes(s);
        const matchCustomer = order.customer?.name?.toLowerCase().includes(s);
        const matchPhone = order.customer?.phone?.includes(search);
        if (!matchOrder && !matchCustomer && !matchPhone) return false;
      }
      
      if (dateFilter) {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (orderDate !== dateFilter) return false;
      }
      
      return true;
    });
  }, [orders, activeTab, search, dateFilter]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getTabCount = (tab) => {
    if (tab === 'All') return orders.length;
    return orders.filter(o => o.status === tab).length;
  };

  return (
    <div className="report-page pt-1">
      <div className="report-header">
        <div className="report-header-left">
          <h3 className="report-title">My Orders</h3>
        </div>
      </div>

      <ActionBar
        left={
          <>
            <SearchBar placeholder="Search order, customer, phone..." value={search} onChange={(v) => { setSearch(v); setCurrentPage(1); }} />
            <Form.Control 
              type="date" 
              value={dateFilter} 
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} 
              size="sm" 
              style={{ minWidth: '150px', maxWidth: '180px' }} 
            />
            <Form.Select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              size="sm"
              style={{ width: 'auto', minWidth: '110px' }}
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </Form.Select>
          </>
        }
        count={filteredOrders.length}
        onRefresh={loadMyDeliveries}
      />

      <Card>
        <Card.Header className="bg-transparent pt-3 pb-0 border-0">
          <Nav variant="pills" className="gap-2 mb-3">
            {tabs.map(tab => (
              <Nav.Item key={tab}>
                <Nav.Link 
                  active={activeTab === tab} 
                  onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                  style={{ cursor: 'pointer' }}
                >
                  {tab} <span className="text-muted ms-1">({getTabCount(tab)})</span>
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Card.Header>
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={7} /> : paginatedOrders.length === 0 ? (
            <EmptyState 
              icon="lucide:package" 
              title="No orders found" 
              message={search || dateFilter ? "Try adjusting your filters." : "You have no orders in this category."}
            />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Delivery Address</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map(order => (
                    <tr key={order._id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                      </td>
                      <td>
                        <div>{order.customer?.name || 'Walk-in'}</div>
                        <small className="text-muted">{order.customer?.phone}</small>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '180px' }}>
                          {order.deliveryAddress ? `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}` : '—'}
                        </div>
                      </td>
                      <td>
                        <div>{formatDate ? formatDate(order.createdAt) : new Date(order.createdAt).toLocaleDateString()}</div>
                        <small className="text-muted">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </td>
                      <td><strong>{formatCurrency ? formatCurrency(order.amount) : `₹${order.amount?.toFixed(2)}`}</strong></td>
                      <td>
                        <StatusBadge status={order.paymentStatus} />
                        <div><small className="text-muted">{order.paymentMethod}</small></div>
                      </td>
                      <td><StatusBadge status={order.status} /></td>
                      <td className="text-end">
                        <Button variant="outline-primary" size="sm" onClick={() => navigate(`/delivery/orders/${order._id}`)}>
                          <Eye size={16} className="me-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="mt-3">
                  <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

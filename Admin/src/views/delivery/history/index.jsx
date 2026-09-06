import React, { useEffect, useState, useMemo } from 'react';
import { Card, Table, Form, Button } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import FilterBar from '@/components/common/FilterBar';
import StatusBadge from '@/components/common/StatusBadge';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import PaginationComponent from '@/components/common/PaginationComponent';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/utils/format';

export default function DeliveryHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const historyOrders = useMemo(() => {
    return orders.filter(order => {
      // History = completed/past orders
      if (!['Delivered', 'Cancelled', 'Returned', 'Refunded', 'Rejected'].includes(order.status)) return false;
      
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      
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
  }, [orders, statusFilter, search, dateFilter]);

  const totalPages = Math.ceil(historyOrders.length / pageSize);
  const paginatedOrders = historyOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="report-page pt-1">
      <div className="report-header">
        <div className="report-header-left">
          <h3 className="report-title">Delivery History</h3>
        </div>
      </div>

      <ActionBar
        left={
          <>
            <SearchBar placeholder="Search order, customer, phone..." value={search} onChange={(v) => { setSearch(v); setCurrentPage(1); }} />
            <FilterBar
              filters={[{
                name: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: (v) => { setStatusFilter(v); setCurrentPage(1); },
                options: [
                  { value: 'all', label: 'All Statuses' },
                  { value: 'Delivered', label: 'Delivered' },
                  { value: 'Cancelled', label: 'Cancelled' },
                  { value: 'Returned', label: 'Returned' },
                  { value: 'Rejected', label: 'Rejected' },
                ],
              }]}
              onClear={() => { setStatusFilter('all'); setSearch(''); setDateFilter(''); setCurrentPage(1); }}
            />
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
        count={historyOrders.length}
        onRefresh={loadMyDeliveries}
      />

      <Card>
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={6} /> : paginatedOrders.length === 0 ? (
            <EmptyState 
              icon="lucide:clock" 
              title="No history found" 
              message={search || dateFilter || statusFilter !== 'all' ? "Try adjusting your filters." : "No completed deliveries yet."}
            />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
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
                        <div><small className="text-muted">{order.orderType}</small></div>
                      </td>
                      <td>
                        <div>{order.customer?.name || 'Walk-in'}</div>
                        <small className="text-muted">{order.customer?.phone}</small>
                      </td>
                      <td>
                        <div>{formatDate ? formatDate(order.updatedAt) : new Date(order.updatedAt).toLocaleDateString()}</div>
                        <small className="text-muted">{new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </td>
                      <td><strong>{formatCurrency ? formatCurrency(order.amount) : `₹${order.amount?.toFixed(2)}`}</strong></td>
                      <td><StatusBadge status={order.paymentStatus} /></td>
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

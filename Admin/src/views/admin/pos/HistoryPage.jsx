import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import EmptyState from '@/components/common/EmptyState';
import SkeletonTable from '@/components/common/SkeletonTable';
import InvoicePrintOut from './components/InvoicePrintOut';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  Pending: 'warning', Confirmed: 'info', Assigned: 'primary',
  OutForDelivery: 'secondary', Delivered: 'success', Cancelled: 'danger', Returned: 'danger',
};

export default function HistoryPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reprintingId, setReprintingId] = useState(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadInvoices();
  }, [page, search, statusFilter, dateFilter]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      let query = `/orders?orderType=OFFLINE&page=${page}&limit=15`;

      if (search) query += `&search=${search}`;
      if (statusFilter) query += `&status=${statusFilter}`;

      if (dateFilter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateFilter === 'today') {
          query += `&startDate=${today.toISOString()}`;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          query += `&startDate=${weekAgo.toISOString()}`;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          query += `&startDate=${monthAgo.toISOString()}`;
        }
      }

      const data = await fetchApi(query);
      setInvoices(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleReprintClick = async (orderId) => {
    setReprintingId(orderId);
    try {
      // Fetch the actual invoice
      const res = await fetchApi(`/invoices?order=${orderId}&limit=1`);
      if (res.invoices && res.invoices.length > 0) {
        setInvoiceToPrint(res.invoices[0]);
      } else {
        // Fallback for old offline orders
        const orderData = await fetchApi(`/orders/${orderId}`);
        if (orderData) {
          const fallbackInvoice = {
            invoiceNumber: orderData.billNumber || orderData.orderNumber,
            createdAt: orderData.createdAt,
            customerSnapshot: {
              name: orderData.customer?.name || 'Walk-In',
              phone: orderData.customer?.phone || ''
            },
            productSnapshot: orderData.items.map(i => ({
              productName: i.productName,
              sku: i.sku || 'N/A',
              qty: i.qty,
              price: i.price,
              total: i.price * i.qty
            })),
            totalsSnapshot: {
              subTotal: orderData.amount,
              tax: 0,
              discount: 0,
              amount: orderData.amount
            },
            paymentMethod: orderData.paymentMethod || 'Cash/Card',
            status: orderData.status,
            isCancelled: orderData.status === 'Cancelled' || orderData.status === 'Returned'
          };
          setInvoiceToPrint(fallbackInvoice);
        } else {
          toast.error("Order details not found.");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Error fetching invoice or order details.");
    } finally {
      setReprintingId(null);
    }
  };

  if (invoiceToPrint) {
    return <InvoicePrintOut invoice={invoiceToPrint} onBack={() => setInvoiceToPrint(null)} />;
  }

  return (
    <div>
      <PageHeader
        title="POS Billing History"
        rightContent={
          <Button variant="primary" onClick={() => navigate('/pos')}>
            New POS Billing
          </Button>
        }
      />

      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="bg-light rounded">
          <Row className="g-3">
            <Col md={4}>
              <SearchBar
                placeholder="Search Bill #, Customer..."
                value={search}
                onChange={setSearch}
              />
            </Col>
            <Col md={3}>
              <Form.Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                <option value="Delivered">Delivered</option>
                <option value="Returned">Returned</option>
                <option value="Cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}>
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
              <Button variant="outline-secondary" className="w-100 d-flex align-items-center justify-content-center gap-2" onClick={loadInvoices}>
                <RefreshCw size={16} /> Refresh
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {loading ? <SkeletonTable rows={5} columns={5} /> : (
        <Table responsive hover className="align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="ps-4">Bill #</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <EmptyState icon={<FileText size={48} />} title="No Bills Found" message="Try adjusting your search filters." />
                </td>
              </tr>
            )}
            {invoices.map(order => (
              <tr key={order._id}>
                <td className="ps-4 fw-medium text-primary">{order.billNumber || order.orderNumber}</td>
                <td>
                  <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                  <div className="text-muted small">{new Date(order.createdAt).toLocaleTimeString()}</div>
                </td>
                <td>
                  <div>{order.customer?.name || 'Walk-In'}</div>
                  {order.customer?.phone && <div className="text-muted small">{order.customer.phone}</div>}
                </td>
                <td className="fw-bold">{formatCurrency(order.amount)}</td>
                <td><Badge bg={STATUS_COLORS[order.status] || 'secondary'}>{order.status}</Badge></td>
                    <td className="text-end">
          <div className="d-flex justify-content-end gap-2 flex-column flex-sm-row">
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleReprintClick(order._id)}
              disabled={reprintingId === order._id}
            >
              {reprintingId === order._id ? <Spinner size="sm" /> : 'Reprint'}
            </Button>
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => navigate(`/pos/returns`, { state: { invoice: order } })}
              disabled={order.status === 'Returned' || order.status === 'Cancelled'}
            >
              Return
            </Button>
          </div>
        </td>
      </tr>
                ))}
    </tbody>
  </Table>
          )
}
        </Card.Body >
  {!loading && totalPages > 1 && (
    <Card.Footer className="bg-white d-flex justify-content-between align-items-center p-3">
      <div className="text-muted small">
        Showing page {page} of {totalPages} ({totalRecords} records)
      </div>
      <div className="d-flex gap-2">
        <Button size="sm" variant="outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <Button size="sm" variant="outline-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </Card.Footer>
  )}
      </Card >
    </div >
  );
}

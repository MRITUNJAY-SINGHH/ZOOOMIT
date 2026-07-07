import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Modal, Row, Table } from 'react-bootstrap';
import { Eye, Mail, Phone } from 'lucide-react';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import PaginationComponent from '@/components/common/PaginationComponent';
import StatisticsCard from '@/components/common/StatisticsCard';
import { formatCurrency, formatDate } from '@/utils/format';
import { toast } from 'react-hot-toast';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/customers?page=${currentPage}&limit=20&search=${search}`);
      setCustomers(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [currentPage, search]);

  const viewCustomer = async (id) => {
    setDetailsLoading(true);
    setSelectedCustomer({});
    try {
      const res = await api.get(`/customers/${id}`);
      setSelectedCustomer(res.data);
    } catch (err) {
      toast.error('Failed to load customer');
      setSelectedCustomer(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Customers" description="View customer profiles, order history and lifetime value." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Customers' }]} />
      <ActionBar
        left={<SearchBar placeholder="Search name, phone or email..." value={search} onChange={(value) => { setSearch(value); setCurrentPage(1); }} />}
        count={totalRecords}
        onRefresh={fetchCustomers}
      />
      <Card>
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={7} /> : error ? <ErrorState message={error} onRetry={fetchCustomers} /> : customers.length === 0 ? (
            <EmptyState icon="lucide:users" title="No customers found" message="Customer records will appear after orders or customer creation." />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead><tr><th>Customer</th><th>Contact</th><th>Type</th><th className="text-end">Orders</th><th className="text-end">Spent</th><th>Joined</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td><div className="fw-semibold">{customer.name}</div><div className="text-muted">{customer.email || '-'}</div></td>
                      <td><div className="d-flex align-items-center gap-2 text-muted"><Phone size={20} />{customer.phone}</div></td>
                      <td><StatusBadge status={customer.customerType || 'WALK_IN'} variant={customer.customerType === 'APP' ? 'info' : 'secondary'} /></td>
                      <td className="text-end fw-semibold">{customer.totalOrders || 0}</td>
                      <td className="text-end fw-semibold">{formatCurrency(customer.totalSpent || 0)}</td>
                      <td className="text-muted">{formatDate(customer.createdAt)}</td>
                      <td className="text-end"><Button variant="light" className="kuiklo-icon-btn" onClick={() => viewCustomer(customer._id)}><Eye size={20} /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setCurrentPage} />
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={Boolean(selectedCustomer)} onHide={() => setSelectedCustomer(null)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>Customer Profile</Modal.Title></Modal.Header>
        <Modal.Body>
          {detailsLoading ? <SkeletonTable rows={4} columns={3} /> : selectedCustomer?._id ? (
            <>
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
                <div>
                  <h2 className="kuiklo-section-title mb-1">{selectedCustomer.name}</h2>
                  <div className="text-muted d-flex flex-wrap gap-3">
                    <span><Phone size={20} /> {selectedCustomer.phone}</span>
                    {selectedCustomer.email && <span><Mail size={20} /> {selectedCustomer.email}</span>}
                  </div>
                </div>
                <StatusBadge status={selectedCustomer.status} />
              </div>
              <Row className="g-3 mb-4">
                <Col md={4}><StatisticsCard title="Total Orders" value={selectedCustomer.stats?.totalOrders ?? selectedCustomer.totalOrders ?? 0} /></Col>
                <Col md={4}><StatisticsCard title="Total Spending" value={formatCurrency(selectedCustomer.stats?.totalSpent ?? selectedCustomer.totalSpent ?? 0)} /></Col>
                <Col md={4}><StatisticsCard title="Last Order" value={selectedCustomer.stats?.lastOrderDate ? formatDate(selectedCustomer.stats.lastOrderDate) : '-'} /></Col>
              </Row>
              <h2 className="kuiklo-section-title mb-3">Order History</h2>
              <Table responsive hover className="align-middle mb-0">
                <thead><tr><th>Order</th><th>Date</th><th>Type</th><th>Status</th><th className="text-end">Amount</th></tr></thead>
                <tbody>
                  {(selectedCustomer.orderHistory || []).length === 0 ? <tr><td colSpan="5" className="text-center text-muted py-4">No orders found</td></tr> : selectedCustomer.orderHistory.map((order) => (
                    <tr key={order._id}>
                      <td className="fw-semibold text-primary">{order.orderNumber}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td><StatusBadge status={order.orderType} /></td>
                      <td><StatusBadge status={order.status} /></td>
                      <td className="text-end fw-semibold">{formatCurrency(order.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : null}
        </Modal.Body>
      </Modal>
    </div>
  );
}


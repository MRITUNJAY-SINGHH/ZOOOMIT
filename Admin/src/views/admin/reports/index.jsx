import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Tabs, Tab } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchReportData(activeTab); }, [activeTab]);

  const fetchReportData = async (tab) => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${tab}`);
      const responseData = res.data.data ? res.data.data : res.data;
      setData(Array.isArray(responseData) ? responseData : []);
    } catch (err) { toast.error('Failed to load report data'); setData([]); }
    finally { setLoading(false); }
  };

  const renderSalesTable = () => (
    <Table responsive hover className="align-middle mb-0">
      <thead className="table-light"><tr><th>Order #</th><th>Date</th><th>Type</th><th>Payment</th><th className="text-end">Amount</th></tr></thead>
      <tbody>
        {data.map(item => (
          <tr key={item._id}>
            <td className="fw-medium text-primary">{item.orderNumber}</td>
            <td className="text-muted">{new Date(item.createdAt).toLocaleDateString()}</td>
            <td><Badge bg={item.orderType === 'ONLINE' ? 'info' : 'secondary'}>{item.orderType}</Badge></td>
            <td><Badge bg="success">{item.paymentStatus}</Badge></td>
            <td className="text-end fw-bold">₹{(item.amount || 0).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderInventoryTable = () => (
    <Table responsive hover className="align-middle mb-0">
      <thead className="table-light"><tr><th>Product</th><th>SKU</th><th>Category</th><th className="text-end">Stock</th><th>Status</th></tr></thead>
      <tbody>
        {data.map(item => (
          <tr key={item._id}>
            <td className="fw-medium">{item.name}</td>
            <td className="text-muted">{item.sku || '-'}</td>
            <td className="text-muted">{item.category?.name || '-'}</td>
            <td className={`text-end fw-bold ${(item.totalStock || item.stock) < 10 ? 'text-danger' : ''}`}>{item.totalStock || item.stock || 0}</td>
            <td><Badge bg={item.status === 'Active' || item.isActive ? 'success' : 'danger'}>{item.status || (item.isActive ? 'Active' : 'Inactive')}</Badge></td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderPaymentsTable = () => (
    <Table responsive hover className="align-middle mb-0">
      <thead className="table-light"><tr><th>TXN ID</th><th>Order</th><th>Method</th><th>Status</th><th className="text-end">Amount</th></tr></thead>
      <tbody>
        {data.map(item => (
          <tr key={item._id}>
            <td className="fw-medium">{item.transactionId}</td>
            <td className="text-muted">{item.order?.orderNumber || '-'}</td>
            <td>{item.paymentMethod}</td>
            <td><Badge bg={item.paymentStatus === 'Paid' ? 'success' : 'warning'}>{item.paymentStatus}</Badge></td>
            <td className="text-end fw-bold">₹{(item.amount || 0).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderContent = () => {
    if (loading) return <SkeletonTable rows={6} columns={5} />;
    if (data.length === 0) return <EmptyState icon="lucide:bar-chart-3" title="No Data Found" message="No report data available for this section." />;
    if (activeTab === 'sales') return renderSalesTable();
    if (activeTab === 'inventory') return renderInventoryTable();
    if (activeTab === 'payments') return renderPaymentsTable();
  };

  return (
    <div>
      <PageHeader title="Reports" description="View sales, inventory, and payment reports." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Reports' }]} />
      <Card>
        <Card.Body>
          <div className="d-flex flex-wrap gap-1 mb-3">
            {[{ key: 'sales', label: 'Sales Report', icon: 'lucide:trending-up' }, { key: 'inventory', label: 'Inventory Report', icon: 'lucide:boxes' }, { key: 'payments', label: 'Payment Report', icon: 'lucide:credit-card' }].map(tab => (
              <Button key={tab.key} variant={activeTab === tab.key ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setActiveTab(tab.key)}>
                <Icon icon={tab.icon} width={14} className="me-1" />{tab.label}
              </Button>
            ))}
            <Button variant="outline-secondary" size="sm" className="ms-auto" onClick={() => fetchReportData(activeTab)}><Icon icon="lucide:refresh-cw" width={14} /></Button>
          </div>
          {renderContent()}
        </Card.Body>
      </Card>
    </div>
  );
}

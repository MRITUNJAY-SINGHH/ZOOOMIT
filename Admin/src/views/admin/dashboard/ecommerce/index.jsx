import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import { Link } from 'react-router';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import SkeletonCard from '@/components/common/SkeletonCard';
import SkeletonTable from '@/components/common/SkeletonTable';

const StatCard = ({ icon, label, value, color }) => (
  <Card className="h-100">
    <Card.Body className="d-flex align-items-center gap-3">
      <div className={`rounded d-flex align-items-center justify-content-center bg-${color}-subtle`} style={{ width: 48, height: 48, minWidth: 48 }}>
        <Icon icon={icon} width={22} className={`text-${color}`} />
      </div>
      <div>
        <div className="text-muted small mb-1">{label}</div>
        <h5 className="mb-0 fw-bold">{value}</h5>
      </div>
    </Card.Body>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiring, setExpiring] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [statsRes, ordersRes, txnsRes, lowStockRes, expRes] = await Promise.allSettled([
          api.get('/reports/dashboard'),
          api.get('/orders?page=1&limit=5'),
          api.get('/payments?page=1&limit=5'),
          api.get('/inventory/low-stock'),
          api.get('/inventory/expiring')
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (ordersRes.status === 'fulfilled') {
          const d = ordersRes.value.data;
          setRecentOrders(d.data || d || []);
        }
        if (txnsRes.status === 'fulfilled') {
          const d = txnsRes.value.data;
          setRecentTxns(d.data || d || []);
        }
        if (lowStockRes.status === 'fulfilled') setLowStock(lowStockRes.value.data || []);
        if (expRes.status === 'fulfilled') setExpiring(expRes.value.data || []);
      } catch (error) {
        console.error('Dashboard load failed', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Welcome back! Here's what's happening today." breadcrumbs={[{ label: 'Dashboard' }]} />
        <Row className="g-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => <Col md={3} sm={6} key={i}><SkeletonCard lines={1} /></Col>)}
        </Row>
        <Row className="g-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => <Col md={3} sm={6} key={i}><SkeletonCard lines={1} /></Col>)}
        </Row>
        <Row className="g-3"><Col md={8}><SkeletonTable rows={5} columns={5} /></Col><Col md={4}><SkeletonCard lines={4} /></Col></Row>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Welcome back! Here's what's happening today." breadcrumbs={[{ label: 'Dashboard' }]} />

      {/* Sales KPI Cards */}
      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <StatCard icon="lucide:indian-rupee" label="Total Sales" value={`₹${(stats?.totalSales || 0).toLocaleString()}`} color="primary" />
        </Col>
        <Col md={3} sm={6}>
          <StatCard icon="lucide:trending-up" label="Today's Sales" value={`₹${(stats?.todaySales || 0).toLocaleString()}`} color="success" />
        </Col>
        <Col md={3} sm={6}>
          <StatCard icon="lucide:globe" label="Online Sales" value={`₹${(stats?.onlineSales || 0).toLocaleString()}`} color="info" />
        </Col>
        <Col md={3} sm={6}>
          <StatCard icon="lucide:store" label="Offline Sales" value={`₹${(stats?.offlineSales || 0).toLocaleString()}`} color="warning" />
        </Col>
      </Row>

      {/* Secondary KPI Cards */}
      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <StatCard icon="lucide:shopping-bag" label="Total Orders" value={stats?.totalOrders || 0} color="primary" />
        </Col>
        <Col md={3} sm={6}>
          <StatCard icon="lucide:users" label="Total Customers" value={stats?.totalCustomers || 0} color="info" />
        </Col>
        <Col md={3} sm={6}>
          <StatCard icon="lucide:package" label="Total Products" value={stats?.totalProducts || 0} color="secondary" />
        </Col>
        <Col md={3} sm={6}>
          <StatCard icon="lucide:user-check" label="Total Staff" value={stats?.totalStaff || 0} color="dark" />
        </Col>
      </Row>

      {/* Alerts + Recent Orders */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Header className="bg-transparent d-flex align-items-center gap-2">
              <Icon icon="lucide:alert-triangle" className="text-danger" width={18} />
              <h6 className="mb-0">Alerts</h6>
            </Card.Header>
            <Card.Body>
              <Link to="/inventory/low-stock" className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom text-decoration-none text-body">
                <span><Icon icon="lucide:package-minus" width={16} className="text-danger me-2" />Low Stock Products</span>
                <Badge bg="danger" pill>{Array.isArray(lowStock) ? lowStock.length : 0}</Badge>
              </Link>
              <Link to="/inventory/upcoming-expiry" className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom text-decoration-none text-body">
                <span><Icon icon="lucide:clock" width={16} className="text-warning me-2" />Expiring Products</span>
                <Badge bg="warning" text="dark" pill>{Array.isArray(expiring) ? expiring.length : 0}</Badge>
              </Link>
              <Link to="/orders/all" className="d-flex justify-content-between align-items-center text-decoration-none text-body">
                <span><Icon icon="lucide:hourglass" width={16} className="text-info me-2" />Pending Orders</span>
                <Badge bg="info" pill>{stats?.pendingOrders || 0}</Badge>
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="h-100">
            <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Recent Orders</h6>
              <Link to="/orders/all" className="small text-decoration-none">View All →</Link>
            </Card.Header>
            <Card.Body className="p-0">
              {recentOrders.length === 0 ? (
                <div className="text-center text-muted p-4">No recent orders</div>
              ) : (
                <Table responsive hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Order #</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th className="pe-3 text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.slice(0, 5).map((order) => (
                      <tr key={order._id}>
                        <td className="ps-3 fw-medium text-primary">{order.orderNumber}</td>
                        <td className="text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td><Badge bg={order.orderType === 'ONLINE' ? 'info' : 'secondary'}>{order.orderType}</Badge></td>
                        <td><Badge bg={order.status === 'Delivered' ? 'success' : order.status === 'Cancelled' ? 'danger' : 'warning'}>{order.status}</Badge></td>
                        <td className="pe-3 text-end fw-bold">₹{(order.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Transactions */}
      <Row className="g-3">
        <Col md={12}>
          <Card>
            <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Recent Transactions</h6>
              <Link to="/payments" className="small text-decoration-none">View All →</Link>
            </Card.Header>
            <Card.Body className="p-0">
              {recentTxns.length === 0 ? (
                <div className="text-center text-muted p-4">No recent transactions</div>
              ) : (
                <Table responsive hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">TXN ID</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="pe-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTxns.slice(0, 5).map((txn) => (
                      <tr key={txn._id}>
                        <td className="ps-3 fw-medium">{txn.transactionId}</td>
                        <td>{txn.paymentMethod}</td>
                        <td className="fw-bold text-success">₹{(txn.amount || 0).toLocaleString()}</td>
                        <td><Badge bg={txn.paymentStatus === 'Paid' ? 'success' : 'danger'}>{txn.paymentStatus}</Badge></td>
                        <td className="pe-3 text-muted">{new Date(txn.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

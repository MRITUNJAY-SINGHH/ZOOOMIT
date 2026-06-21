import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Badge, Spinner } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';

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
        const [statsRes, ordersRes, txnsRes, lowStockRes, expRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/orders'),
          api.get('/payments'),
          api.get('/inventory/low-stock'),
          api.get('/inventory/expiring')
        ]);
        
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data.slice(0, 5));
        setRecentTxns(txnsRes.data.slice(0, 5));
        setLowStock(lowStockRes.data);
        setExpiring(expRes.data);
      } catch (error) {
        console.error('Dashboard load failed', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <h4 className="mb-4">Overview</h4>

      {/* Main KPI Row */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Card.Body>
              <h6 className="text-white-50 mb-2">Total Sales</h6>
              <h3 className="mb-0">₹{stats?.totalSales?.toLocaleString() || '0'}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)' }}>
            <Card.Body>
              <h6 className="text-white-50 mb-2">Today's Sales</h6>
              <h3 className="mb-0">₹{stats?.todaySales?.toLocaleString() || '0'}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)' }}>
            <Card.Body>
              <h6 className="text-white-50 mb-2">Online Sales</h6>
              <h3 className="mb-0">₹{stats?.onlineSales?.toLocaleString() || '0'}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)' }}>
            <Card.Body>
              <h6 className="text-white-50 mb-2">Offline Sales</h6>
              <h3 className="mb-0">₹{stats?.offlineSales?.toLocaleString() || '0'}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Secondary KPI Row */}
      <Row className="g-3 mb-4">
        <Col md={2} sm={4}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body className="p-3">
              <Icon icon="lucide:shopping-bag" className="text-primary mb-2 fs-3" />
              <h4 className="mb-1">{stats?.totalOrders || 0}</h4>
              <small className="text-muted">Total Orders</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body className="p-3">
              <Icon icon="lucide:clock" className="text-warning mb-2 fs-3" />
              <h4 className="mb-1">{stats?.pendingOrders || 0}</h4>
              <small className="text-muted">Pending</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body className="p-3">
              <Icon icon="lucide:check-circle" className="text-success mb-2 fs-3" />
              <h4 className="mb-1">{stats?.completedOrders || 0}</h4>
              <small className="text-muted">Completed</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body className="p-3">
              <Icon icon="lucide:users" className="text-info mb-2 fs-3" />
              <h4 className="mb-1">{stats?.totalCustomers || 0}</h4>
              <small className="text-muted">Customers</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body className="p-3">
              <Icon icon="lucide:package" className="text-secondary mb-2 fs-3" />
              <h4 className="mb-1">{stats?.totalProducts || 0}</h4>
              <small className="text-muted">Products</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body className="p-3">
              <Icon icon="lucide:user-circle" className="text-dark mb-2 fs-3" />
              <h4 className="mb-1">{stats?.totalStaff || 0}</h4>
              <small className="text-muted">Staff</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        {/* Inventory Alerts */}
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm border-top border-danger border-3">
            <Card.Header className="bg-white border-0 pt-3 pb-0">
              <h6 className="mb-0 text-danger"><Icon icon="lucide:alert-triangle" className="me-2" />Inventory Alerts</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span className="fw-medium">Low Stock Products</span>
                <Badge bg="danger" pill>{lowStock.length}</Badge>
              </div>
              <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span className="fw-medium">Expiring Products</span>
                <Badge bg="warning" text="dark" pill>{expiring.length}</Badge>
              </div>
              <div className="text-center mt-3">
                <a href="/inventory/low-stock" className="text-decoration-none small text-primary fw-medium">View All Alerts &rarr;</a>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Orders */}
        <Col md={8}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Recent Orders</h6>
              <a href="/orders" className="small text-decoration-none">View All</a>
            </Card.Header>
            <Card.Body className="p-0">
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
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="ps-3 fw-medium text-primary">{order.orderNumber}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td><Badge bg="light" text="dark">{order.orderType}</Badge></td>
                      <td>
                        <Badge bg={
                          order.status === 'Delivered' ? 'success' : 
                          order.status === 'Cancelled' ? 'danger' : 'warning'
                        }>{order.status}</Badge>
                      </td>
                      <td className="pe-3 text-end fw-bold">₹{order.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        {/* Recent Transactions */}
        <Col md={12}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Recent Transactions</h6>
              <a href="/payments" className="small text-decoration-none">View All</a>
            </Card.Header>
            <Card.Body className="p-0">
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
                  {recentTxns.map((txn) => (
                    <tr key={txn._id}>
                      <td className="ps-3 fw-medium">{txn.transactionId}</td>
                      <td>{txn.paymentMethod}</td>
                      <td className="fw-bold text-success">₹{txn.amount.toLocaleString()}</td>
                      <td>
                        <Badge bg={txn.paymentStatus === 'Paid' ? 'success' : 'danger'}>
                          {txn.paymentStatus}
                        </Badge>
                      </td>
                      <td className="pe-3 text-muted">{new Date(txn.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

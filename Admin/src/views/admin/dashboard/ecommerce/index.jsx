import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Badge, Modal, Alert } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import {
  Calendar,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Package,
  AlertTriangle,
  Users,
  CheckCircle,
  Clock,
  Plus,
  PackagePlus,
  Receipt,
  SlidersHorizontal,
  Trash2,
  AlertCircle,
  IndianRupee,
  RotateCcw,
  Zap
} from 'lucide-react';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import StatisticsCard from '@/components/common/StatisticsCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ErrorState from '@/components/common/ErrorState';
import PermissionGuard from '@/components/PermissionGuard';
import { formatCurrency } from '@/utils/format';

import SalesOverviewChart from './components/SalesOverviewChart';
import OrdersOverviewChart from './components/OrdersOverviewChart';
import TopSellingProducts from './components/TopSellingProducts';
import TopCustomers from './components/TopCustomers';
import RecentOrdersTable from './components/RecentOrdersTable';
import RecentTransactions from './components/RecentTransactions';
import LowStockAlerts from './components/LowStockAlerts';
import ExpiringSoon from './components/ExpiringSoon';

const PERIOD_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  last_week: "Last Week",
  this_month: "This Month",
  last_month: "Last Month",
  last_30_days: "Last 30 Days",
  this_year: "This Year",
  custom: "Custom Range"
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: statsData, isLoading: loading, error, refetch: loadDashboard } = useQuery({
    queryKey: ['dashboardStats', period, startDate, endDate, refreshKey],
    queryFn: async () => {
      let url = `/reports/dashboard?period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(url);
      return res.data || {};
    }
  });

  const handlePeriodChange = (e) => {
    const selected = e.target.value;
    if (selected === 'custom') {
      setTempStart(startDate || new Date().toISOString().split('T')[0]);
      setTempEnd(endDate || new Date().toISOString().split('T')[0]);
      setCustomModalOpen(true);
    } else {
      setPeriod(selected);
      setStartDate('');
      setEndDate('');
    }
  };

  const applyCustomDate = (e) => {
    e.preventDefault();
    if (tempStart && tempEnd) {
      if (new Date(tempStart) > new Date(tempEnd)) {
        alert('Start date must be before or equal to End date');
        return;
      }
      setStartDate(tempStart);
      setEndDate(tempEnd);
      setPeriod('custom');
      setCustomModalOpen(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      let url = `/reports/dashboard?period=${period}&refresh=true`;
      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      await api.get(url);
      setRefreshKey(prev => prev + 1);
      await loadDashboard();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = statsData || {};
  const errorMessage = error?.message;

  const sales = stats.sales || {};
  const orders = stats.orders || {};
  const inventory = stats.inventory || {};
  const customers = stats.customers || {};
  const actionCenter = stats.actionCenter || {};

  const hasActionCenterAlerts = 
    (actionCenter.pendingOrdersCount > 0) || 
    (actionCenter.pendingRefundsCount > 0) || 
    (actionCenter.failedPaymentsCount > 0) || 
    (actionCenter.criticalLowStockCount > 0);

  if (loading && !statsData) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Welcome back to Kuiklo ERP." breadcrumbs={[{ label: 'Dashboard' }]} />
        <LoadingSkeleton type="cards" cards={8} />
      </div>
    );
  }

  if (error && !statsData) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Welcome back to Kuiklo ERP." breadcrumbs={[{ label: 'Dashboard' }]} />
        <ErrorState message={errorMessage} onRetry={handleManualRefresh} />
      </div>
    );
  }

  return (
    <div>
      {/* Native Template Page Header with Integrated Date & Refresh Controls */}
      <PageHeader
        title="Dashboard"
        description="Welcome back to Kuiklo ERP."
        breadcrumbs={[{ label: 'Dashboard' }]}
        rightContent={
          <div className="d-flex align-items-center gap-2">
            <Form.Select 
              size="sm" 
              value={period} 
              onChange={handlePeriodChange}
              style={{ width: 'auto', minWidth: '140px' }}
            >
              {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Form.Select>

            {period === 'custom' && startDate && endDate && (
              <Badge bg="primary-subtle" className="text-primary border border-primary-subtle px-2 py-2">
                {startDate} → {endDate}
              </Badge>
            )}

            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="d-flex align-items-center gap-1"
              title="Bypass cache and load fresh figures"
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-animation' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        }
      />

      {/* Action Center Banner (Clean Theme Card) */}
      {hasActionCenterAlerts && (
        <Card className="mb-3 border" style={{ borderColor: 'rgba(255, 193, 7, 0.3)' }}>
          <Card.Body className="py-2 px-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-1 text-warning fw-bold me-2 small">
                  <AlertTriangle size={16} />
                  <span>Action Needed:</span>
                </div>

                {actionCenter.pendingOrdersCount > 0 && (
                  <Link
                    to="/orders/all?status=Pending"
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-1 px-2 fw-semibold"
                    style={{ fontSize: '0.8rem', borderRadius: '6px' }}
                  >
                    <ShoppingBag size={14} />
                    <span>{actionCenter.pendingOrdersCount} Pending Orders</span>
                  </Link>
                )}

                {actionCenter.criticalLowStockCount > 0 && (
                  <Link
                    to="/inventory/low-stock"
                    className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1 py-1 px-2 fw-semibold"
                    style={{ fontSize: '0.8rem', borderRadius: '6px' }}
                  >
                    <AlertCircle size={14} />
                    <span>{actionCenter.criticalLowStockCount} Items Low Stock</span>
                  </Link>
                )}

                {actionCenter.pendingRefundsCount > 0 && (
                  <Link
                    to="/reports/payments"
                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 py-1 px-2 fw-semibold"
                    style={{ fontSize: '0.8rem', borderRadius: '6px' }}
                  >
                    <RotateCcw size={14} />
                    <span>{actionCenter.pendingRefundsCount} Pending Refunds</span>
                  </Link>
                )}

                {actionCenter.failedPaymentsCount > 0 && (
                  <Link
                    to="/reports/payments"
                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 py-1 px-2 fw-semibold"
                    style={{ fontSize: '0.8rem', borderRadius: '6px' }}
                  >
                    <AlertCircle size={14} />
                    <span>{actionCenter.failedPaymentsCount} Failed Payments</span>
                  </Link>
                )}
              </div>

              <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                Direct operational links
              </small>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Quick Actions Panel */}
      <Card className="mb-3 border shadow-sm">
        <Card.Body className="py-2 px-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-1 text-muted small fw-bold text-uppercase me-2" style={{ letterSpacing: '0.04em' }}>
              <Zap size={15} className="text-primary" />
              <span>Quick Actions:</span>
            </div>

            <div className="d-flex flex-wrap gap-2 align-items-center flex-grow-1">
              <PermissionGuard permission="products.create">
                <Button as={Link} to="/catalog/products" variant="primary" size="sm" className="d-inline-flex align-items-center gap-1 py-1 px-3 fw-medium">
                  <Plus size={15} /> Add Product
                </Button>
              </PermissionGuard>

              <PermissionGuard permission="inventory.create">
                <Button as={Link} to="/inventory/stock-entry" variant="success" size="sm" className="d-inline-flex align-items-center gap-1 py-1 px-3 fw-medium">
                  <PackagePlus size={15} /> Stock Inward
                </Button>
              </PermissionGuard>

              <PermissionGuard permission="pos.create">
                <Button as={Link} to="/pos" variant="primary" size="sm" className="d-inline-flex align-items-center gap-1 py-1 px-3 fw-medium">
                  <Receipt size={15} /> POS Billing
                </Button>
              </PermissionGuard>

              <PermissionGuard permission="orders.create">
                <Button as={Link} to="/orders/all" variant="secondary" size="sm" className="d-inline-flex align-items-center gap-1 py-1 px-3 fw-medium">
                  <ShoppingBag size={15} /> Create Order
                </Button>
              </PermissionGuard>

              <PermissionGuard permission="inventory.adjust">
                <Button as={Link} to="/inventory/adjustment" variant="secondary" size="sm" className="d-inline-flex align-items-center gap-1 py-1 px-3 fw-medium">
                  <SlidersHorizontal size={15} /> Stock Adjustment
                </Button>
              </PermissionGuard>

              <PermissionGuard permission="inventory.damage">
                <Button as={Link} to="/inventory/damage" variant="danger" size="sm" className="d-inline-flex align-items-center gap-1 py-1 px-3 fw-medium">
                  <Trash2 size={15} /> Damage / Wastage
                </Button>
              </PermissionGuard>

              <PermissionGuard permission="customers.create">
                <Button as={Link} to="/customers" variant="secondary" size="sm" className="d-inline-flex align-items-center gap-1 py-1 px-3 fw-medium">
                  <Users size={15} /> Add Customer
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Executive KPI Section (9 Clean Cards) */}
      <Row className="g-3 mb-3">
        {/* 1. Period Net Sales */}
        <Col xl={3} md={6}>
          <StatisticsCard 
            icon={IndianRupee} 
            title={`Net Sales (${PERIOD_LABELS[period] || 'Period'})`} 
            value={formatCurrency(sales.netSales || 0)} 
            subtitle={`Gross: ${formatCurrency(sales.grossSales || 0)} • Refunds: ${formatCurrency(sales.refundAmount || 0)}`}
            variant="primary" 
            onClick={() => navigate('/reports/sales')}
          />
        </Col>

        {/* 2. Live Today's Sales */}
        <Col xl={3} md={6}>
          <StatisticsCard 
            icon={TrendingUp} 
            title="Sales Today (Live)" 
            value={formatCurrency(sales.salesToday || 0)} 
            subtitle={`Net: ${formatCurrency(sales.netSalesToday || 0)}`}
            variant="success" 
            onClick={() => navigate('/reports/sales')}
          />
        </Col>

        {/* 3. Completed Orders */}
        <Col xl={3} md={6}>
          <StatisticsCard 
            icon={CheckCircle} 
            title="Completed Orders" 
            value={orders.completedOrders || 0} 
            subtitle={`Total: ${orders.totalOrders || 0} (Delivered/Completed)`}
            variant="info" 
            onClick={() => navigate('/orders/all?status=Delivered')}
          />
        </Col>

        {/* 4. Active Orders Pipeline */}
        <Col xl={3} md={6}>
          <StatisticsCard 
            icon={Clock} 
            title="In-Progress Orders" 
            value={(orders.pendingOrders || 0) + (orders.confirmedOrders || 0) + (orders.assignedOrders || 0) + (orders.outForDeliveryOrders || 0)} 
            subtitle={`Pending: ${orders.pendingOrders || 0} • Out for Delivery: ${orders.outForDeliveryOrders || 0}`}
            variant="warning" 
            onClick={() => navigate('/orders/all?status=Pending')}
          />
        </Col>

        {/* 5. Inventory Valuation */}
        <Col xl={3} md={6}>
          <StatisticsCard 
            icon={Package} 
            title="Inventory Valuation" 
            value={formatCurrency(inventory.inventoryValue || 0)} 
            subtitle="At current cost price"
            variant="primary" 
            onClick={() => navigate('/inventory/stock-entry')}
          />
        </Col>

        {/* 6. Low Stock & Out of Stock */}
        <Col xl={3} md={6}>
          <StatisticsCard 
            icon={AlertTriangle} 
            title="Low & Zero Stock Items" 
            value={`${inventory.lowStockCount || 0} / ${inventory.outOfStockCount || 0}`} 
            subtitle="Low stock / Out of stock"
            variant="danger" 
            onClick={() => navigate('/inventory/low-stock')}
          />
        </Col>

        {/* 7. Perishables & Expiring */}
        <Col xl={3} md={6}>
          <StatisticsCard 
            icon={AlertCircle} 
            title="Expiring Soon (30 Days)" 
            value={inventory.expiringSoonCount || 0} 
            subtitle={`Expired batches: ${inventory.expiredCount || 0}`}
            variant="warning" 
            onClick={() => navigate('/inventory/expiring')}
          />
        </Col>

        {/* 8. Customers */}
        <Col xl={3} md={6}>
          <StatisticsCard 
            icon={Users} 
            title="Customer Base" 
            value={customers.totalCustomers || 0} 
            subtitle={`+${customers.newCustomers || 0} new in selected period`}
            variant="secondary" 
            onClick={() => navigate('/customers')}
          />
        </Col>
      </Row>

      {/* Analytics & Trends Section */}
      <Row className="g-3 mb-3">
        <Col lg={6}>
          <SalesOverviewChart 
            period={period} 
            startDate={startDate} 
            endDate={endDate} 
            refreshKey={refreshKey} 
          />
        </Col>
        <Col lg={6}>
          <OrdersOverviewChart 
            period={period} 
            startDate={startDate} 
            endDate={endDate} 
            refreshKey={refreshKey} 
          />
        </Col>
      </Row>

      {/* Live Operational Streams Row (Pair 1: Recent Orders & Payments) */}
      <Row className="g-3 mb-3">
        <Col lg={6}>
          <RecentOrdersTable refreshKey={refreshKey} />
        </Col>
        <Col lg={6}>
          <RecentTransactions refreshKey={refreshKey} />
        </Col>
      </Row>

      {/* Inventory & Perishables Row (Pair 2: Low Stock & Expiring) */}
      <Row className="g-3 mb-3">
        <Col lg={6}>
          <LowStockAlerts refreshKey={refreshKey} />
        </Col>
        <Col lg={6}>
          <ExpiringSoon refreshKey={refreshKey} />
        </Col>
      </Row>

      {/* Sales & Customers Intelligence Row (Pair 3: Top Products & Top Customers) */}
      <Row className="g-3 mb-3">
        <Col lg={6}>
          <TopSellingProducts 
            period={period} 
            startDate={startDate} 
            endDate={endDate} 
            refreshKey={refreshKey} 
          />
        </Col>
        <Col lg={6}>
          <TopCustomers refreshKey={refreshKey} />
        </Col>
      </Row>

      {/* Custom Date Range Picker Modal */}
      <Modal show={customModalOpen} onHide={() => setCustomModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 mb-0">Select Custom Date Range</Modal.Title>
        </Modal.Header>
        <Form onSubmit={applyCustomDate}>
          <Modal.Body>
            <div className="mb-3">
              <Form.Label className="fw-semibold">Start Date</Form.Label>
              <Form.Control 
                type="date" 
                value={tempStart} 
                onChange={(e) => setTempStart(e.target.value)} 
                required 
              />
            </div>
            <div className="mb-3">
              <Form.Label className="fw-semibold">End Date</Form.Label>
              <Form.Control 
                type="date" 
                value={tempEnd} 
                onChange={(e) => setTempEnd(e.target.value)} 
                required 
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setCustomModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Apply Date Range
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

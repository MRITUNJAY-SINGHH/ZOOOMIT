import React, { useEffect, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { BarChart3, IndianRupee, Package, Plus, Receipt, ShoppingBag, Store, Truck, UserCheck, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ErrorState from '@/components/common/ErrorState';
import StatisticsCard from '@/components/common/StatisticsCard';
import { formatCurrency } from '@/utils/format';
import SalesOverviewChart from './components/SalesOverviewChart';
import OrdersOverviewChart from './components/OrdersOverviewChart';
import TopSellingProducts from './components/TopSellingProducts';
import RecentOrdersTable from './components/RecentOrdersTable';
import LowStockAlerts from './components/LowStockAlerts';
import ExpiringSoon from './components/ExpiringSoon';

const metricValue = (stats, keys, formatter = (value) => value?.toLocaleString?.('en-IN') ?? value ?? '-') => {
  const key = keys.find((item) => stats?.[item] !== undefined && stats?.[item] !== null);
  return key ? formatter(stats[key]) : '-';
};

import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: statsData, isLoading: loading, error, refetch: loadDashboard } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data || {};
    }
  });

  const stats = statsData || {};
  const errorMessage = error?.message;

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Welcome back to Kuiklo ERP." breadcrumbs={[{ label: 'Dashboard' }]} />
        <LoadingSkeleton type="cards" cards={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Welcome back to Kuiklo ERP." breadcrumbs={[{ label: 'Dashboard' }]} />
        <ErrorState message={errorMessage} onRetry={loadDashboard} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome back to Kuiklo ERP."
        breadcrumbs={[{ label: 'Dashboard' }]}
        rightContent={<Button variant="outline-secondary" onClick={() => loadDashboard(false)}>Refresh</Button>}
      />

      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button as={Link} to="/catalog/products" variant="primary"><Plus size={20} />Add Product</Button>
        <Button as={Link} to="/pos" variant="primary"><Receipt size={20} />New Billing</Button>
        <Button as={Link} to="/orders/all" variant="secondary"><ShoppingBag size={20} />Create Order</Button>
        <Button as={Link} to="/customers" variant="secondary"><Users size={20} />Add Customer</Button>
      </div>

      <Row className="g-3 mb-4">
        <Col xl={3} md={6}><StatisticsCard icon={IndianRupee} title="Total Sales" value={metricValue(stats, ['totalSales', 'sales'], formatCurrency)} variant="primary" onClick={() => navigate('/reports/sales')} /></Col>
        <Col xl={3} md={6}><StatisticsCard icon={IndianRupee} title="Today's Sales" value={metricValue(stats, ['todaySales', 'todaysSales'], formatCurrency)} variant="success" onClick={() => navigate('/reports/sales')} /></Col>
        <Col xl={3} md={6}><StatisticsCard icon={Store} title="Online Sales" value={metricValue(stats, ['onlineSales'], formatCurrency)} variant="info" onClick={() => navigate('/reports/sales')} /></Col>
        <Col xl={3} md={6}><StatisticsCard icon={Store} title="Offline Sales" value={metricValue(stats, ['offlineSales'], formatCurrency)} variant="secondary" onClick={() => navigate('/reports/sales')} /></Col>
        <Col xl={3} md={6}><StatisticsCard icon={ShoppingBag} title="Total Orders" value={metricValue(stats, ['totalOrders', 'orders'])} variant="info" onClick={() => navigate('/orders/all')} /></Col>
        <Col xl={3} md={6}><StatisticsCard icon={Users} title="Total Customers" value={metricValue(stats, ['totalCustomers', 'customers'])} variant="warning" onClick={() => navigate('/customers')} /></Col>
        <Col xl={3} md={6}><StatisticsCard icon={Package} title="Total Products" value={metricValue(stats, ['totalProducts', 'products'])} variant="primary" onClick={() => navigate('/catalog/products')} /></Col>
        <Col xl={3} md={6}><StatisticsCard icon={UserCheck} title="Total Staff" value={metricValue(stats, ['totalStaff', 'staff'])} variant="success" onClick={() => navigate('/users')} /></Col>
        <Col xl={3} md={6}><StatisticsCard icon={Truck} title="Total Suppliers" value={metricValue(stats, ['totalSuppliers', 'suppliers'])} variant="info" onClick={() => navigate('/suppliers')} /></Col>
        <Col xl={3} md={6}><StatisticsCard icon={BarChart3} title="Revenue MTD" value={metricValue(stats, ['monthRevenue', 'mtdRevenue'], formatCurrency)} variant="primary" onClick={() => navigate('/reports/sales')} /></Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={4}><SalesOverviewChart /></Col>
        <Col lg={4}><OrdersOverviewChart /></Col>
        <Col lg={4}><TopSellingProducts /></Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={4}><RecentOrdersTable /></Col>
        <Col lg={4}><LowStockAlerts /></Col>
        <Col lg={4}><ExpiringSoon /></Col>
      </Row>
    </div>
  );
}

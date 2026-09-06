import React, { useEffect, useState } from 'react';
import { Col, Row, Alert, Button } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import StatisticsCard from '@/components/common/StatisticsCard';
import { Truck, CheckCircle, Package, Calendar, Clock, Activity, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router';

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyDeliveries();
  }, []);

  const loadMyDeliveries = async () => {
    try {
      const res = await fetchApi('/orders/delivery/my-orders');
      setOrders(res.data || res);
    } catch (e) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Delivery Dashboard" description="Welcome back! Here's your delivery overview." breadcrumbs={[{ label: 'Dashboard' }]} />
        <LoadingSkeleton type="cards" cards={6} />
      </div>
    );
  }

  // Calculate metrics
  const assignedOrders = orders.filter(o => ['Assigned', 'Accepted', 'Picked Up', 'Out For Delivery'].includes(o.status));
  const pendingAcceptance = orders.filter(o => o.status === 'Assigned');
  const activeDeliveries = orders.filter(o => ['Accepted', 'Picked Up', 'Out For Delivery'].includes(o.status));
  
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const deliveredToday = deliveredOrders.filter(o => new Date(o.updatedAt).getTime() >= today);
  const deliveredThisWeek = deliveredOrders.filter(o => new Date(o.updatedAt).getTime() >= startOfWeek.getTime());
  const deliveredThisMonth = deliveredOrders.filter(o => new Date(o.updatedAt).getTime() >= startOfMonth);

  return (
    <div>
      <PageHeader title="Delivery Dashboard" description="Welcome back! Here's your delivery overview." breadcrumbs={[{ label: 'Dashboard' }]} />

      {pendingAcceptance.length > 0 && (
        <Alert variant="danger" className="mb-4 shadow-sm border-0 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center">
            <Bell size={24} className="me-3" />
            <div>
              <h5 className="mb-1 text-danger">Action Required!</h5>
              <span className="text-danger">
                You have <strong>{pendingAcceptance.length} new {pendingAcceptance.length === 1 ? 'order' : 'orders'}</strong> waiting for acceptance.
              </span>
            </div>
          </div>
          <Button variant="danger" onClick={() => navigate('/delivery/orders')}>View Orders</Button>
        </Alert>
      )}

      <Row className="g-3 mb-4">
        <Col sm={6} xl={4}>
          <StatisticsCard 
            title="Total Assigned" 
            value={assignedOrders.length}
            icon={Package} 
            variant="primary"
            helper="Orders assigned to you"
          />
        </Col>
        <Col sm={6} xl={4}>
          <StatisticsCard 
            title="Pending Acceptance" 
            value={pendingAcceptance.length}
            icon={Clock} 
            variant="warning"
            helper="Awaiting your response"
          />
        </Col>
        <Col sm={6} xl={4}>
          <StatisticsCard 
            title="Active Deliveries" 
            value={activeDeliveries.length}
            icon={Activity} 
            variant="info"
            helper="Currently in progress"
          />
        </Col>
      </Row>

      <Row className="g-3">
        <Col sm={6} xl={4}>
          <StatisticsCard 
            title="Delivered Today" 
            value={deliveredToday.length}
            icon={CheckCircle} 
            variant="success"
            helper="Completed today"
          />
        </Col>
        <Col sm={6} xl={4}>
          <StatisticsCard 
            title="Delivered This Week" 
            value={deliveredThisWeek.length}
            icon={Calendar} 
            variant="success"
            helper="Completed this week"
          />
        </Col>
        <Col sm={6} xl={4}>
          <StatisticsCard 
            title="Delivered This Month" 
            value={deliveredThisMonth.length}
            icon={Truck} 
            variant="success"
            helper={`Total: ${deliveredOrders.length} all time`}
          />
        </Col>
      </Row>
    </div>
  );
}

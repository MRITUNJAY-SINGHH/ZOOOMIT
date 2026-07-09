import React from 'react';
import { Button, Col, Row, Card } from 'react-bootstrap';
import { Plus, Receipt, ShoppingBag, Users, Clock } from 'lucide-react';
import { Link } from 'react-router';
import PageHeader from '@/components/common/PageHeader';
import PermissionGuard from '@/components/PermissionGuard';
import RecentOrdersTable from '../ecommerce/components/RecentOrdersTable';

export default function StaffDashboard() {
  return (
    <div>
      <PageHeader
        title="Workspace"
        description="Welcome back to Kuiklo ERP."
        breadcrumbs={[{ label: 'Workspace' }]}
      />

      <div className="d-flex flex-wrap gap-2 mb-4">
        <PermissionGuard permission="pos.create">
          <Button as={Link} to="/pos" variant="primary">
            <Receipt size={20} className="me-2" /> New Billing
          </Button>
        </PermissionGuard>
        
        <PermissionGuard permission="orders.create">
          <Button as={Link} to="/orders/all" variant="secondary">
            <ShoppingBag size={20} className="me-2" /> Create Order
          </Button>
        </PermissionGuard>
        
        <PermissionGuard permission="customers.create">
          <Button as={Link} to="/customers" variant="outline-primary">
            <Users size={20} className="me-2" /> Add Customer
          </Button>
        </PermissionGuard>
      </div>

      <Row className="g-3">
        <Col lg={8}>
          <PermissionGuard permission="orders.view" fallback={
            <Card className="border-0 shadow-sm h-100 p-5 text-center text-muted">
              You do not have permission to view orders.
            </Card>
          }>
            <RecentOrdersTable />
          </PermissionGuard>
        </Col>
        
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
              <Clock size={48} className="text-muted mb-3 opacity-50" />
              <h5 className="fw-bold mb-1">Shift Started</h5>
              <p className="text-muted mb-0">You are currently logged in and ready to assist customers.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

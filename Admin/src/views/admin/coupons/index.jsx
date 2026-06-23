import React from 'react';
import { Card } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import PageHeader from '@/components/common/PageHeader';

export default function Coupons() {
  return (
    <div>
      <PageHeader title="Coupons" description="Create and manage discount coupons for your customers." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Coupons' }]} />
      <Card>
        <Card.Body>
          <div className="text-center py-5">
            <Icon icon="lucide:ticket-percent" width={48} className="text-muted opacity-50 mb-3" />
            <h5 className="mb-2">Coupons Module</h5>
            <p className="text-muted">Coupon management will be available here. Create percentage, flat, and conditional discount coupons.</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

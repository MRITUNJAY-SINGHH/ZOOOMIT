import React from 'react';
import { Card } from 'react-bootstrap';
import EmptyState from '@/components/common/EmptyState';

export default function TopSellingProducts() {
  return (
    <Card className="h-100">
      <Card.Body>
        <h2 className="kuiklo-section-title mb-3">Top Selling Products</h2>
        <EmptyState
          icon="lucide:bar-chart-3"
          title="Sales ranking unavailable"
          message="Add a top-selling-products backend endpoint to show this widget without placeholder data."
        />
      </Card.Body>
    </Card>
  );
}

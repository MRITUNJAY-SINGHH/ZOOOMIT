import React from 'react';
import { Badge } from 'react-bootstrap';

const STATUS_VARIANTS = {
  active: 'success',
  inactive: 'secondary',
  paid: 'success',
  pending: 'warning',
  refunded: 'dark',
  failed: 'danger',
  cancelled: 'danger',
  canceled: 'danger',
  delivered: 'success',
  confirmed: 'info',
  assigned: 'primary',
  outfordelivery: 'secondary',
  returned: 'dark',
  online: 'info',
  offline: 'secondary',
};

export default function StatusBadge({ status, variant, className = '' }) {
  const label = status || 'Unknown';
  const key = String(label).replace(/\s+/g, '').toLowerCase();
  return (
    <Badge bg={variant || STATUS_VARIANTS[key] || 'secondary'} className={`kuiklo-status-badge ${className}`}>
      {label}
    </Badge>
  );
}

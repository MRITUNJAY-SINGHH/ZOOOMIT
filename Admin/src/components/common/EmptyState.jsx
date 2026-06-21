import React from 'react';
import { Icon } from '@iconify/react';
import { Button } from 'react-bootstrap';

export default function EmptyState({ icon = 'lucide:inbox', title = 'No Data Found', message, actionLabel, onAction }) {
  return (
    <div className="text-center p-5">
      <div className="mb-3">
        <Icon icon={icon} className="text-muted opacity-50" width="48" height="48" />
      </div>
      <h5 className="mb-2 fw-medium text-dark">{title}</h5>
      {message && <p className="text-muted mb-4">{message}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

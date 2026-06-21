import React from 'react';
import { Icon } from '@iconify/react';
import { Button } from 'react-bootstrap';
import SkeletonTable from './SkeletonTable';

export default function ApiRetryWrapper({ isLoading, hasError, errorMessage, onRetry, children, loadingType = 'table' }) {
  if (isLoading) {
    if (loadingType === 'table') return <SkeletonTable />;
    if (loadingType === 'card') return <div className="p-3"><div className="placeholder-glow"><span className="placeholder col-12" style={{height: '100px'}}></span></div></div>;
    return <div className="p-4 text-center"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  if (hasError) {
    return (
      <div className="text-center p-5 bg-light rounded border border-danger-subtle">
        <div className="mb-3">
          <Icon icon="lucide:alert-triangle" className="text-danger opacity-75" width="48" height="48" />
        </div>
        <h5 className="mb-2 fw-medium text-danger">Something went wrong</h5>
        <p className="text-muted mb-4">{errorMessage || 'Failed to fetch data from the server.'}</p>
        <Button variant="outline-danger" onClick={onRetry}>
          <Icon icon="lucide:refresh-cw" className="me-2" />
          Retry
        </Button>
      </div>
    );
  }

  return children;
}

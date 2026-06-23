import React from 'react';
import { Button } from 'react-bootstrap';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import SkeletonTable from './SkeletonTable';

export default function ApiRetryWrapper({ isLoading, hasError, errorMessage, onRetry, children, loadingType = 'table' }) {
  if (isLoading) {
    if (loadingType === 'table') return <SkeletonTable />;
    if (loadingType === 'card') return <div className="p-3"><div className="placeholder-glow"><span className="placeholder col-12" style={{height: '100px'}}></span></div></div>;
    return <div className="p-4 text-center"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  if (hasError) {
    return (
      <div className="kuiklo-state kuiklo-error-state text-center">
        <div className="mb-3">
          <AlertTriangle className="text-danger" size={48} />
        </div>
        <h2>Something went wrong</h2>
        <p className="text-muted mb-4">{errorMessage || 'Failed to fetch data from the server.'}</p>
        <Button variant="outline-danger" onClick={onRetry}>
          <RefreshCw size={20} />
          Retry
        </Button>
      </div>
    );
  }

  return children;
}

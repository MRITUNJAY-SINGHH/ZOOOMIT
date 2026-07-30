import React from 'react';
import { Button } from 'react-bootstrap';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = 'Something went wrong', message = 'Failed to fetch data from the server.', onRetry }) {
  return (
    <div className="Zooom-state Zooom-error-state text-center">
      <AlertTriangle size={48} className="text-danger mb-3" />
      <h2>{title}</h2>
      <p className="text-muted">{message}</p>
      {onRetry && (
        <Button variant="outline-danger" onClick={onRetry}>
          <RefreshCw size={20} />
          Retry
        </Button>
      )}
    </div>
  );
}

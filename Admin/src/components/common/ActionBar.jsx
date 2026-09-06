import React, { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Download, Plus, RefreshCw } from 'lucide-react';

export default function ActionBar({ left, count, onRefresh, onExport, onAdd, addLabel = 'Add', right }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="Zooom-action-card mb-3">
      <Card.Body>
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3">
          <div className="d-flex flex-column flex-md-row flex-wrap align-items-md-center gap-2 flex-grow-1">
            {left}
          </div>
          <div className="d-flex flex-wrap align-items-center justify-content-md-end gap-2">
            {typeof count !== 'undefined' && <span className="Zooom-record-count text-muted">{count} records</span>}
            {onRefresh && <Button variant="outline-secondary" onClick={handleRefresh}><RefreshCw size={20} className={isRefreshing ? 'spin-animation' : ''} /></Button>}
            {onExport && <Button variant="outline-secondary" onClick={onExport}><Download size={20} />Export</Button>}
            {onAdd && <Button variant="primary" onClick={onAdd}><Plus size={20} />{addLabel}</Button>}
            {right}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

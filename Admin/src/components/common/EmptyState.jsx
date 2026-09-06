import React from 'react';
import { Button } from 'react-bootstrap';
import * as Icons from 'lucide-react';

const resolveIcon = (icon) => {
  if (typeof icon !== 'string') return icon || Icons.Inbox;
  const pascal = icon.replace(/^lucide:/, '').split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  return Icons[pascal] || Icons.Inbox;
};

export default function EmptyState({ icon = 'lucide:inbox', title = 'No Data Found', message, actionLabel, onAction }) {
  const StateIcon = resolveIcon(icon);

  return (
    <div className="Zooom-state Zooom-empty-state text-center">
      <div className="Zooom-state-icon mb-3">
        <StateIcon size={48} />
      </div>
      <h2>{title}</h2>
      {message && <p className="text-muted mb-4">{message}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

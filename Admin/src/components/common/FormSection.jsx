import React from 'react';
import { Card } from 'react-bootstrap';

export default function FormSection({ title, description, children, actions }) {
  return (
    <Card className="kuiklo-section-card">
      <Card.Body>
        <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
          <div>
            {title && <h2 className="kuiklo-section-title mb-1">{title}</h2>}
            {description && <p className="text-muted mb-0">{description}</p>}
          </div>
          {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
        </div>
        {children}
      </Card.Body>
    </Card>
  );
}

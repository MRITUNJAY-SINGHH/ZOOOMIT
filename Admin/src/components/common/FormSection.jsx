import React from 'react';
import { Card } from 'react-bootstrap';

export default function FormSection({ title, description, actions, children }) {
  return (
    <Card className="mb-4 border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1 text-dark fw-bold">{title}</h5>
            {description && <p className="text-muted mb-0 small">{description}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
        {children}
      </Card.Body>
    </Card>
  );
}

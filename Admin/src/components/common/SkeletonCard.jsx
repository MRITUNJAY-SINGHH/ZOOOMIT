import React from 'react';
import { Card } from 'react-bootstrap';

export default function SkeletonCard({ lines = 3 }) {
  return (
    <Card aria-hidden="true">
      <Card.Body>
        <div className="placeholder-glow">
          <h5 className="card-title placeholder-glow">
            <span className="placeholder col-6"></span>
          </h5>
          <p className="card-text placeholder-glow">
            {Array.from({ length: lines }).map((_, i) => (
              <React.Fragment key={i}>
                <span className={`placeholder col-${Math.floor(Math.random() * 4) + 5}`}></span>{' '}
              </React.Fragment>
            ))}
          </p>
          <span className="placeholder col-4 mt-2"></span>
        </div>
      </Card.Body>
    </Card>
  );
}

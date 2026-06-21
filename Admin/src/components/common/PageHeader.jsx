import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { Link } from 'react-router';

export default function PageHeader({ title, description, breadcrumbs }) {
  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h4 className="mb-1 text-dark fw-bold">{title}</h4>
          {description && <p className="text-muted mb-2">{description}</p>}
          {breadcrumbs && (
            <Breadcrumb className="m-0 fs-14">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return isLast ? (
                  <Breadcrumb.Item active key={index}>{crumb.label}</Breadcrumb.Item>
                ) : (
                  <Breadcrumb.Item linkAs={Link} linkProps={{ to: crumb.path }} key={index}>
                    {crumb.label}
                  </Breadcrumb.Item>
                );
              })}
            </Breadcrumb>
          )}
        </div>
      </div>
    </div>
  );
}

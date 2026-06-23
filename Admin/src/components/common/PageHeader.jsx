import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { Link } from 'react-router';

export default function PageHeader({ title, description, breadcrumbs, rightContent }) {
  return (
    <div className="kuiklo-page-header d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-3">
      <div className="flex-grow-1">
        <h1 className="page-main-title kuiklo-page-title m-0">{title}</h1>
        {description && <p className="kuiklo-page-description text-muted mb-0 mt-1">{description}</p>}
        {breadcrumbs && (
          <Breadcrumb className="kuiklo-breadcrumb m-0 mt-2 py-0">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast || !crumb.path ? (
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
      {rightContent ? (
        <div className="text-lg-end">
          {rightContent}
        </div>
      ) : null}
    </div>
  );
}

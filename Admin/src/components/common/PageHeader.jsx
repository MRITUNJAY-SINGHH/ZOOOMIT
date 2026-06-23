import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { Link, useLocation } from 'react-router';

export default function PageHeader({ title, description, breadcrumbs, rightContent }) {
  const location = useLocation();

  let activeBreadcrumbs = breadcrumbs;
  if (!activeBreadcrumbs) {
    const paths = location.pathname.split('/').filter(p => p);
    activeBreadcrumbs = [{ label: 'Dashboard', path: '/dashboard' }];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      activeBreadcrumbs.push({
        label,
        path: index === paths.length - 1 ? null : currentPath
      });
    });
  }

  return (
    <div className="page-title-box d-flex flex-column flex-md-row align-items-md-center justify-content-between p-0 m-0 pb-3">
      <div className="page-title-left">
        <h3 className="page-title fw-bold mb-0">{title}</h3>
        {description && <p className="text-muted mb-0 mt-1">{description}</p>}
      </div>
      
      <div className="page-title-right d-flex align-items-center gap-3 mt-2 mt-md-0">
        <Breadcrumb className="m-0 font-size-13" listProps={{ className: 'm-0 align-items-center' }}>
          {activeBreadcrumbs.map((crumb, index) => {
            const isLast = index === activeBreadcrumbs.length - 1;
            return isLast || !crumb.path ? (
              <Breadcrumb.Item active key={index} className="fw-medium text-muted">{crumb.label}</Breadcrumb.Item>
            ) : (
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: crumb.path }} key={index} className="fw-semibold">
                {crumb.label}
              </Breadcrumb.Item>
            );
          })}
        </Breadcrumb>
        {rightContent && <div>{rightContent}</div>}
      </div>
    </div>
  );
}

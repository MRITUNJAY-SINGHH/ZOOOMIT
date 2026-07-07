import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { Link, useLocation } from 'react-router';

export default function PageHeader({ title, rightContent }) {
  return (
    <div className="report-header d-flex justify-content-between align-items-center mb-0">
      <div className="report-header-left">
        <h3 className="report-title">{title}</h3>
      </div>
      {rightContent && <div className="report-header-right">{rightContent}</div>}
    </div>
  );
}

import React from 'react';
import PageHeader from '@/components/common/PageHeader';

export default function InvoicesList() {
  return (
    <div>
      <PageHeader 
        title="Invoices" 
        description="Manage all your generated invoices." 
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Invoices' }]} 
      />
      <div className="card">
        <div className="card-body text-center p-5 text-muted">
          <p>Invoice management is coming soon...</p>
        </div>
      </div>
    </div>
  );
}

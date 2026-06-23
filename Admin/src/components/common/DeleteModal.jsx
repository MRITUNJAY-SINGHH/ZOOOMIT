import React from 'react';
import ConfirmModal from './ConfirmModal';

export default function DeleteModal({ itemName = 'this record', ...props }) {
  return (
    <ConfirmModal
      title="Delete record"
      message={`Delete ${itemName}? This action cannot be undone.`}
      confirmLabel="Delete"
      confirmVariant="danger"
      {...props}
    />
  );
}

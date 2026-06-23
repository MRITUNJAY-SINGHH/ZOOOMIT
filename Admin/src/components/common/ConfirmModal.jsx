import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { AlertCircle } from 'lucide-react';

export default function ConfirmModal({
  show,
  title = 'Confirm action',
  message = 'Are you sure you want to continue?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  busy = false,
}) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex gap-3">
          <div className="kuiklo-modal-icon text-primary"><AlertCircle size={20} /></div>
          <p className="mb-0 text-muted">{message}</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
      </Modal.Footer>
    </Modal>
  );
}

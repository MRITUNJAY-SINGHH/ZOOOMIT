import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { MoreHorizontal } from 'lucide-react';

export default function ActionDropdown({ actions = [] }) {
  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="light" className="kuiklo-icon-btn" aria-label="Row actions">
        <MoreHorizontal size={20} />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {actions.map((action) => (
          <Dropdown.Item
            key={action.label}
            onClick={action.onClick}
            className={action.variant === 'danger' ? 'text-danger' : ''}
            disabled={action.disabled}
          >
            {action.icon && <action.icon size={20} className="me-2" />}
            {action.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { X } from 'lucide-react';

export default function FilterBar({ filters = [], onClear, className = '' }) {
  const hasFilters = filters.length > 0;

  return (
    <div className={`kuiklo-filter-bar d-flex flex-wrap align-items-center gap-2 ${className}`}>
      {filters.map((filter) => (
        <Form.Select
          key={filter.name}
          value={filter.value}
          onChange={(event) => filter.onChange?.(event.target.value)}
          aria-label={filter.label}
        >
          {(filter.options || []).map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Form.Select>
      ))}
      {hasFilters && onClear && (
        <Button variant="outline-secondary" onClick={onClear}>
          <X size={20} />
          Clear
        </Button>
      )}
    </div>
  );
}

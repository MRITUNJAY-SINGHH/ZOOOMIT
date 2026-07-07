import React from 'react';
import { Form, Button } from 'react-bootstrap';
import { FilterX } from 'lucide-react';

export default function FilterBar({ filters, onClear }) {
  if (!filters || filters.length === 0) return null;

  return (
    <div className="d-flex align-items-center gap-2">
      {filters.map((filter, index) => (
        <Form.Select 
          key={index}
          value={filter.value} 
          onChange={(e) => filter.onChange(e.target.value)}
          aria-label={filter.label}
          size="sm"
          style={{ minWidth: '150px' }}
        >
          {filter.options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </Form.Select>
      ))}
      {onClear && (
        <Button variant="outline-secondary" size="sm" onClick={onClear} title="Clear Filters">
          <FilterX size={16} />
        </Button>
      )}
    </div>
  );
}

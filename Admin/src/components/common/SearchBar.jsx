import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '', ...props }) {
  return (
    <InputGroup className={`Zooom-search ${className}`} {...props}>
      <InputGroup.Text>
        <Search size={20} />
      </InputGroup.Text>
      <Form.Control
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </InputGroup>
  );
}

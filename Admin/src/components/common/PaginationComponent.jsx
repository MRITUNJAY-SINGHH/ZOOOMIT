import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationComponent({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  return (
    <div className="Zooom-pagination d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-3 pt-3 border-top">
      <div className="text-muted">
        Page {currentPage} of {totalPages || 1} · {totalRecords} records
      </div>
      <div className="d-flex flex-wrap align-items-center gap-2">
        {onPageSizeChange && (
          <Form.Select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} aria-label="Rows per page">
            {[10, 20, 50, 100].map((size) => <option value={size} key={size}>{size} / page</option>)}
          </Form.Select>
        )}
        <Button variant="primary" disabled={currentPage <= 1} onClick={() => onPageChange?.(currentPage - 1)} className="d-flex align-items-center gap-1 shadow-sm px-3">
          <ChevronLeft size={18} />
          Prev
        </Button>
        <Button variant="primary" disabled={currentPage >= totalPages} onClick={() => onPageChange?.(currentPage + 1)} className="d-flex align-items-center gap-1 shadow-sm px-3">
          Next
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
}

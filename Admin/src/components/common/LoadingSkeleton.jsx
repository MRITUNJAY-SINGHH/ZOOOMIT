import React from 'react';
import SkeletonCard from './SkeletonCard';
import SkeletonTable from './SkeletonTable';

export default function LoadingSkeleton({ type = 'table', rows = 6, columns = 5, cards = 4 }) {
  if (type === 'cards') {
    return (
      <div className="row g-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div className="col-md-6 col-xl-3" key={index}>
            <SkeletonCard lines={3} />
          </div>
        ))}
      </div>
    );
  }

  return <SkeletonTable rows={rows} columns={columns} />;
}

import React from 'react';
import { Table } from 'react-bootstrap';

export default function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <Table responsive className="align-middle mb-0">
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i}><div className="placeholder-glow"><span className="placeholder col-8"></span></div></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rIndex) => (
          <tr key={rIndex}>
            {Array.from({ length: columns }).map((_, cIndex) => (
              <td key={cIndex}>
                <div className="placeholder-glow">
                  <span className={`placeholder col-${Math.floor(Math.random() * 5) + 4}`}></span>
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

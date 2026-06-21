import React, { useState } from 'react';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import Papa from 'papaparse';
import { fetchApi } from '@/utils/api';

export default function BulkImport({ onBack, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function(results) {
        // Map CSV fields to backend fields
        // Expected basic CSV: name, slug, barcode, mrp, sellingPrice, categoryId
        const products = results.data.map(row => ({
          name: row.name || row.Name,
          slug: row.slug || row.Slug || (row.name ? row.name.toLowerCase().replace(/ /g, '-') : ''),
          barcode: row.barcode || row.Barcode,
          mrp: parseFloat(row.mrp || row.MRP || 0),
          sellingPrice: parseFloat(row.sellingPrice || row.Price || 0),
          category: row.categoryId || row.Category, // Requires category ID mapping
          lowStockThreshold: parseInt(row.lowStockThreshold || 10)
        })).filter(p => p.name && p.category);

        if (products.length === 0) return alert("No valid products found. Ensure 'name' and 'categoryId' columns exist.");

        setLoading(true);
        try {
          const res = await fetchApi('/products/bulk', {
            method: 'POST',
            body: JSON.stringify({ products })
          });
          setResult(res);
        } catch (err) {
          alert("Import Error: " + err.message);
        }
        setLoading(false);
      }
    });
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4>Bulk Import Products (CSV)</h4>
        <Button variant="secondary" size="sm" onClick={onBack}>Cancel</Button>
      </Card.Header>
      <Card.Body>
        <p>Please upload a CSV file with the following headers: <code>name, slug, barcode, mrp, sellingPrice, categoryId</code></p>
        <Form.Group className="mb-4">
          <Form.Control type="file" accept=".csv" onChange={handleFileUpload} disabled={loading} />
        </Form.Group>

        {loading && <p>Processing import... please wait.</p>}

        {result && (
          <Alert variant={result.errorCount === 0 ? "success" : "warning"}>
            <h5>Import Complete</h5>
            <p>Successful: {result.successCount}</p>
            <p>Failed: {result.errorCount}</p>
            {result.errors && result.errors.length > 0 && (
              <ul className="text-danger">
                {result.errors.slice(0, 5).map((e, idx) => <li key={idx}>{e}</li>)}
                {result.errors.length > 5 && <li>...and {result.errors.length - 5} more</li>}
              </ul>
            )}
            <Button variant="primary" className="mt-3" onClick={onComplete}>Back to Products</Button>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}

import React, { useState, useRef } from 'react';
import { Card, Button, ProgressBar } from 'react-bootstrap';
import Papa from 'papaparse';
import { fetchApi } from '@/utils/api';
import { ArrowLeft, UploadCloud, FileText, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { useNavigate } from 'react-router';

export default function BulkImport() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      alert("Please upload a valid CSV file.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function(results) {
        const products = results.data.map(row => ({
          name: row.name || row.Name,
          slug: row.slug || row.Slug || (row.name ? row.name.toLowerCase().replace(/ /g, '-') : ''),
          barcode: row.barcode || row.Barcode,
          mrp: parseFloat(row.mrp || row.MRP || 0),
          sellingPrice: parseFloat(row.sellingPrice || row.Price || 0),
          category: row.categoryId || row.Category,
          lowStockThreshold: parseInt(row.lowStockThreshold || 10)
        })).filter(p => p.name && p.category);

        if (products.length === 0) return alert("No valid products found. Ensure 'name' and 'categoryId' columns exist.");

        setLoading(true);
        setProgress(20);

        try {
          // Simulate progress for UI
          const interval = setInterval(() => {
            setProgress(prev => {
              if (prev >= 90) {
                clearInterval(interval);
                return 90;
              }
              return prev + 10;
            });
          }, 300);

          const res = await fetchApi('/products/bulk', {
            method: 'POST',
            body: JSON.stringify({ products })
          });
          
          clearInterval(interval);
          setProgress(100);
          setResult(res);

          if (res.errorCount === 0) {
            setTimeout(() => {
              navigate('/catalog/products');
            }, 1500);
          }
        } catch (err) {
          alert("Import Error: " + err.message);
          setProgress(0);
        }
        setLoading(false);
      }
    });
  };

  return (
    <div className="report-page pt-1">
      <PageHeader 
        title="Bulk Import Products" 
        rightContent={
          <Button variant="primary" className="d-flex align-items-center gap-2" onClick={() => navigate('/catalog/products')}>
            <ArrowLeft size={16} /> Back to Products
          </Button>
        } 
      />
      <Card>
        <Card.Body className="p-5">
          <p className="text-muted text-center mb-4">Upload a CSV file with the following headers: <code>name, slug, barcode, mrp, sellingPrice, categoryId</code></p>
          
          {!result ? (
            <div 
              className={`p-5 rounded-4 text-center ${dragActive ? 'bg-light border-primary' : ''}`}
              style={{ 
                border: '2px dashed rgba(255,255,255,0.2)', 
                backgroundColor: dragActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleChange}
                style={{ display: "none" }}
              />
              
              {loading ? (
                <div className="py-4">
                  <div className="spinner-border text-primary mb-3" role="status"></div>
                  <h5 className="mb-3">Processing File...</h5>
                  <ProgressBar animated now={progress} style={{ height: '10px', maxWidth: '400px', margin: '0 auto' }} />
                  <p className="text-muted mt-2 small">{progress}% complete</p>
                </div>
              ) : (
                <div className="py-4">
                  <UploadCloud size={64} className="text-muted mb-3" />
                  <h5>Drag and drop your CSV file here</h5>
                  <p className="text-muted mb-4">or click to browse from your computer</p>
                  <Button variant="primary" className="px-4">Select File</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5">
              {result.errorCount === 0 ? (
                <>
                  <CheckCircle size={64} className="text-success mb-3" />
                  <h4 className="text-success">Import Successful!</h4>
                  <p className="text-muted">Successfully imported {result.successCount} products.</p>
                  <p className="text-muted small">Redirecting to products list...</p>
                </>
              ) : (
                <>
                  <XCircle size={64} className="text-danger mb-3" />
                  <h4 className="text-danger">Import Completed with Errors</h4>
                  <p>Successful: <strong>{result.successCount}</strong></p>
                  <p>Failed: <strong className="text-danger">{result.errorCount}</strong></p>
                  
                  {result.errors && result.errors.length > 0 && (
                    <div className="text-start bg-dark p-3 rounded mt-4" style={{ maxWidth: '600px', margin: '0 auto', maxHeight: '200px', overflowY: 'auto' }}>
                      <ul className="text-danger mb-0">
                        {result.errors.slice(0, 10).map((e, idx) => <li key={idx}>{e}</li>)}
                        {result.errors.length > 10 && <li>...and {result.errors.length - 10} more</li>}
                      </ul>
                    </div>
                  )}
                  <Button variant="primary" className="mt-4" onClick={() => navigate('/catalog/products')}>Back to Products</Button>
                </>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

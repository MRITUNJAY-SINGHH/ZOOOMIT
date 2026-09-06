import { useState, useEffect, useRef } from 'react';
import { Search, Package, ShoppingCart, User, FileText, Loader2 } from 'lucide-react';
import { FormControl, Card, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import api from '@/utils/api';

const SearchBoxRoundedRight = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
        setIsOpen(true);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const hasResults = results && (
    results.products?.length > 0 ||
    results.orders?.length > 0 ||
    results.customers?.length > 0 ||
    results.invoices?.length > 0
  );

  return (
    <div id="search-box-rounded-right" className="app-search d-none d-xl-flex position-relative" style={{ width: '60vw', maxWidth: '800px' }} ref={wrapperRef}>
      <FormControl 
        type="search" 
        className="rounded-pill topbar-search fs-16" 
        name="search" 
        placeholder="Search products, orders, customers..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (query.trim()) setIsOpen(true); }}
      />
      {loading ? (
        <Loader2 size={20} className="app-search-icon text-muted spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        <Search size={20} strokeWidth={2} className="app-search-icon text-muted" />
      )}

      {isOpen && query.trim() && (
        <div className="smart-autocomplete-menu" style={{ top: '115%', maxHeight: '60vh' }}>
          {!loading && !hasResults ? (
            <div className="p-4 text-center text-muted">No results found for "{query}"</div>
          ) : (
            <div>
              {/* Products */}
              {results?.products?.length > 0 && (
                <>
                  <div className="bg-body-secondary fw-bold text-muted px-3 py-2 font-size-11 text-uppercase tracking-wider">Products</div>
                  {results.products.map(p => (
                    <button type="button" key={`p-${p._id}`} onClick={() => handleNavigate(`/admin/catalog/products?search=${p.name}`)} className="smart-autocomplete-item">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary-subtle text-primary rounded p-2"><Package size={16} /></div>
                        <div>
                          <div className="fw-medium font-size-13">{p.name}</div>
                          <div className="text-muted font-size-11">SKU: {p.sku || p.baseSku || '-'} | ₹{p.sellingPrice}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Orders */}
              {results?.orders?.length > 0 && (
                <>
                  <div className="bg-body-secondary fw-bold text-muted px-3 py-2 font-size-11 text-uppercase tracking-wider">Orders</div>
                  {results.orders.map(o => (
                    <button type="button" key={`o-${o._id}`} onClick={() => handleNavigate(`/admin/orders/all?search=${o.orderNumber}`)} className="smart-autocomplete-item">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-success-subtle text-success rounded p-2"><ShoppingCart size={16} /></div>
                        <div>
                          <div className="fw-medium font-size-13">{o.orderNumber} <Badge bg="secondary" className="ms-1 font-size-10">{o.status}</Badge></div>
                          <div className="text-muted font-size-11">₹{o.totalAmount} | {new Date(o.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Customers */}
              {results?.customers?.length > 0 && (
                <>
                  <div className="bg-body-secondary fw-bold text-muted px-3 py-2 font-size-11 text-uppercase tracking-wider">Customers</div>
                  {results.customers.map(c => (
                    <button type="button" key={`c-${c._id}`} onClick={() => handleNavigate(`/admin/customers?search=${c.phone}`)} className="smart-autocomplete-item">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-info-subtle text-info rounded p-2"><User size={16} /></div>
                        <div>
                          <div className="fw-medium font-size-13">{c.name || 'Unknown'}</div>
                          <div className="text-muted font-size-11">{c.phone || c.email}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Invoices */}
              {results?.invoices?.length > 0 && (
                <>
                  <div className="bg-body-secondary fw-bold text-muted px-3 py-2 font-size-11 text-uppercase tracking-wider">Invoices</div>
                  {results.invoices.map(i => (
                    <button type="button" key={`i-${i._id}`} onClick={() => handleNavigate(`/admin/invoices?search=${i.invoiceNumber}`)} className="smart-autocomplete-item">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-warning-subtle text-warning rounded p-2"><FileText size={16} /></div>
                        <div>
                          <div className="fw-medium font-size-13">{i.invoiceNumber}</div>
                          <div className="text-muted font-size-11">₹{i.totalsSnapshot?.amount} | {new Date(i.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
export default SearchBoxRoundedRight

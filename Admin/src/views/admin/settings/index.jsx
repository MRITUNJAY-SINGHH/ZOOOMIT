import React, { useState, useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonCard from '@/components/common/SkeletonCard';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try { setLoading(true); const res = await api.get('/settings'); setSettings(res.data); }
    catch (err) { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => { setSettings({ ...settings, [e.target.name]: e.target.value }); };

  const handleArrayChange = (e) => {
    const arr = e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    setSettings({ ...settings, [e.target.name]: arr });
  };

  const handleSave = async () => {
    try { setSaving(true); await api.put('/settings', settings); toast.success('Settings saved successfully'); }
    catch (err) { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div>
      <PageHeader title="Settings" description="Configure store information, invoicing, and inventory alerts." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Settings' }]} />
      <SkeletonCard lines={5} />
    </div>
  );

  if (!settings) return (
    <div>
      <PageHeader title="Settings" description="Configure store information, invoicing, and inventory alerts." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Settings' }]} />
      <div className="text-center p-5"><Icon icon="lucide:alert-triangle" className="text-danger" width={40} /><p className="mt-2">Failed to load settings</p><Button variant="outline-danger" size="sm" onClick={fetchSettings}>Retry</Button></div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Settings" description="Configure store information, invoicing, and inventory alerts." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Settings' }]} />

      <Card className="mb-3">
        <Card.Header className="bg-transparent"><h6 className="mb-0"><Icon icon="lucide:store" width={16} className="me-2" />Store Information</h6></Card.Header>
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-6"><Form.Label>Store Name</Form.Label><Form.Control name="storeName" value={settings.storeName || ''} onChange={handleChange} /></div>
            <div className="col-md-6"><Form.Label>GST Number</Form.Label><Form.Control name="gstNumber" value={settings.gstNumber || ''} onChange={handleChange} /></div>
            <div className="col-md-12"><Form.Label>Address</Form.Label><Form.Control as="textarea" rows={2} name="address" value={settings.address || ''} onChange={handleChange} /></div>
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header className="bg-transparent"><h6 className="mb-0"><Icon icon="lucide:receipt" width={16} className="me-2" />Invoice & Billing</h6></Card.Header>
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-6"><Form.Label>Online Invoice Prefix</Form.Label><Form.Control name="invoicePrefixOnline" value={settings.invoicePrefixOnline || ''} onChange={handleChange} /></div>
            <div className="col-md-6"><Form.Label>Offline POS Prefix</Form.Label><Form.Control name="invoicePrefixOffline" value={settings.invoicePrefixOffline || ''} onChange={handleChange} /></div>
            <div className="col-md-12"><Form.Label>Invoice Footer Notes</Form.Label><Form.Control name="invoiceFooter" value={settings.invoiceFooter || ''} onChange={handleChange} /></div>
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header className="bg-transparent"><h6 className="mb-0"><Icon icon="lucide:alert-triangle" width={16} className="me-2" />Inventory Alerts</h6></Card.Header>
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Label>Default Low Stock Threshold</Form.Label>
              <Form.Control type="number" name="lowStockThresholdDefault" value={settings.lowStockThresholdDefault || 10} onChange={handleChange} />
              <Form.Text className="text-muted">Will trigger low stock warning if no product-specific threshold is set.</Form.Text>
            </div>
            <div className="col-md-6">
              <Form.Label>Expiry Alert Days (Comma separated)</Form.Label>
              <Form.Control name="expiryAlertDays" value={settings.expiryAlertDays?.join(', ') || ''} onChange={handleArrayChange} />
              <Form.Text className="text-muted">Example: 30, 15, 10, 5</Form.Text>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="text-end">
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <Icon icon="lucide:save" width={14} className="me-2" />}
          Save Configuration
        </Button>
      </div>
    </div>
  );
}

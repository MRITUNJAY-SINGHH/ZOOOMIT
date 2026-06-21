import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    // convert comma separated to array of numbers
    const arr = value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    setSettings({ ...settings, [name]: arr });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <h4 className="mb-4">System Settings</h4>

      <Card className="mb-4">
        <Card.Header>Store Information</Card.Header>
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Label>Store Name</Form.Label>
              <Form.Control name="storeName" value={settings.storeName || ''} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <Form.Label>GST Number</Form.Label>
              <Form.Control name="gstNumber" value={settings.gstNumber || ''} onChange={handleChange} />
            </div>
            <div className="col-md-12">
              <Form.Label>Address</Form.Label>
              <Form.Control as="textarea" name="address" value={settings.address || ''} onChange={handleChange} />
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Invoice & Billing</Card.Header>
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Label>Online Invoice Prefix</Form.Label>
              <Form.Control name="invoicePrefixOnline" value={settings.invoicePrefixOnline || ''} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <Form.Label>Offline POS Prefix</Form.Label>
              <Form.Control name="invoicePrefixOffline" value={settings.invoicePrefixOffline || ''} onChange={handleChange} />
            </div>
            <div className="col-md-12">
              <Form.Label>Invoice Footer Notes</Form.Label>
              <Form.Control name="invoiceFooter" value={settings.invoiceFooter || ''} onChange={handleChange} />
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Inventory Alerts</Card.Header>
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
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? <Spinner size="sm" className="me-2" /> : <Icon icon="lucide:save" className="me-2" />}
          Save Configuration
        </Button>
      </div>
    </div>
  );
}

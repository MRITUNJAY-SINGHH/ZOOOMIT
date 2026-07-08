import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Tab, Nav, Row, Col } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonCard from '@/components/common/SkeletonCard';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try { 
      setLoading(true); 
      const res = await api.get('/settings'); 
      setSettings(res.data); 
    }
    catch (err) { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => { setSettings({ ...settings, [e.target.name]: e.target.value }); };

  const handleBankChange = (e) => {
    setSettings({
      ...settings,
      bankDetails: {
        ...(settings.bankDetails || {}),
        [e.target.name]: e.target.value
      }
    });
  };

  const handleArrayChange = (e) => {
    const arr = e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    setSettings({ ...settings, [e.target.name]: arr });
  };

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const loadToast = toast.loading('Uploading image...');
    try {
      const res = await api.post('/upload/product-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSettings(prev => ({ ...prev, [fieldName]: res.data.url }));
      toast.success('Image uploaded successfully', { id: loadToast });
    } catch (err) {
      toast.error('Failed to upload image', { id: loadToast });
    }
  };

  const handleSave = async () => {
    try { 
      setSaving(true); 
      await api.put('/settings', settings); 
      toast.success('Settings saved successfully'); 
    }
    catch (err) { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div>
      <PageHeader title="Settings" />
      <SkeletonCard lines={8} />
    </div>
  );

  if (!settings) return (
    <div>
      <PageHeader title="Settings" />
      <div className="text-center p-5"><Icon icon="lucide:alert-triangle" className="text-danger" width={40} /><p className="mt-2">Failed to load settings</p><Button variant="outline-danger" size="sm" onClick={fetchSettings}>Retry</Button></div>
    </div>
  );

  return (
    <div>
      <PageHeader 
        title="Settings" 
        rightContent={
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <Icon icon="lucide:save" width={16} className="me-2" />}
            Save All Settings
          </Button>
        }
      />

      <Tab.Container defaultActiveKey="general">
        <Row>
          <Col md={3}>
            <Card className="mb-4">
              <Card.Body className="p-0">
                <Nav variant="pills" className="flex-column custom-nav-pills p-2">
                  <Nav.Item>
                    <Nav.Link eventKey="general" className="d-flex align-items-center gap-2 py-2 px-3 rounded-2">
                      <Icon icon="lucide:store" width={18} /> General
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="branding" className="d-flex align-items-center gap-2 py-2 px-3 rounded-2">
                      <Icon icon="lucide:image" width={18} /> Branding
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="invoicing" className="d-flex align-items-center gap-2 py-2 px-3 rounded-2">
                      <Icon icon="lucide:receipt" width={18} /> Invoicing
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="alerts" className="d-flex align-items-center gap-2 py-2 px-3 rounded-2">
                      <Icon icon="lucide:bell" width={18} /> Alerts
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>
          <Col md={9}>
            <Tab.Content>
              {/* GENERAL TAB */}
              <Tab.Pane eventKey="general">
                <Card className="mb-3 border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-bottom border-light">
                    <h5 className="mb-0 fw-bold">General Information</h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Store Name</Form.Label>
                        <Form.Control name="storeName" value={settings.storeName || ''} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">GST Number</Form.Label>
                        <Form.Control name="gstNumber" value={settings.gstNumber || ''} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Store Phone</Form.Label>
                        <Form.Control name="storePhone" value={settings.storePhone || ''} onChange={handleChange} placeholder="+91 9876543210" />
                      </div>
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Store Email</Form.Label>
                        <Form.Control type="email" name="storeEmail" value={settings.storeEmail || ''} onChange={handleChange} placeholder="contact@kuiklo.com" />
                      </div>
                      <div className="col-md-12">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Address</Form.Label>
                        <Form.Control as="textarea" rows={3} name="address" value={settings.address || ''} onChange={handleChange} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* BRANDING TAB */}
              <Tab.Pane eventKey="branding">
                <Card className="mb-3 border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-bottom border-light">
                    <h5 className="mb-0 fw-bold">Store Branding</h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <div className="row g-5">
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase d-block mb-3">Store Logo</Form.Label>
                        <div className="p-4 border border-dashed rounded text-center" style={{ backgroundColor: 'var(--bs-light)' }}>
                          {settings.storeLogo ? (
                            <div className="mb-3">
                              <img src={settings.storeLogo} alt="Store Logo" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                          ) : (
                            <div className="mb-3 text-muted">
                              <Icon icon="lucide:image" width={40} />
                              <p className="mt-2 small">No logo uploaded</p>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="d-none" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'storeLogo')} />
                          <Button variant="outline-primary" size="sm" onClick={() => logoInputRef.current.click()}>
                            <Icon icon="lucide:upload" width={14} className="me-2" /> Upload Logo
                          </Button>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase d-block mb-3">Authorized Signature</Form.Label>
                        <div className="p-4 border border-dashed rounded text-center" style={{ backgroundColor: 'var(--bs-light)' }}>
                          {settings.authorizedSignature ? (
                            <div className="mb-3">
                              <img src={settings.authorizedSignature} alt="Signature" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                          ) : (
                            <div className="mb-3 text-muted">
                              <Icon icon="lucide:pen-tool" width={40} />
                              <p className="mt-2 small">No signature uploaded</p>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="d-none" ref={signatureInputRef} onChange={(e) => handleImageUpload(e, 'authorizedSignature')} />
                          <Button variant="outline-primary" size="sm" onClick={() => signatureInputRef.current.click()}>
                            <Icon icon="lucide:upload" width={14} className="me-2" /> Upload Signature
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* INVOICING TAB */}
              <Tab.Pane eventKey="invoicing">
                <Card className="mb-3 border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-bottom border-light">
                    <h5 className="mb-0 fw-bold">Invoicing & Billing</h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <h5 className="mb-4 fw-bolder text-primary text-uppercase" style={{ letterSpacing: '1.5px' }}>Invoice Numbering</h5>
                    <div className="row g-4 mb-4 pb-4 border-bottom border-light">
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Online Invoice Prefix</Form.Label>
                        <Form.Control name="invoicePrefixOnline" value={settings.invoicePrefixOnline || ''} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Offline POS Prefix</Form.Label>
                        <Form.Control name="invoicePrefixOffline" value={settings.invoicePrefixOffline || ''} onChange={handleChange} />
                      </div>
                    </div>

                    <h5 className="mb-4 fw-bolder text-primary text-uppercase" style={{ letterSpacing: '1.5px' }}>Bank Details (For Invoices)</h5>
                    <div className="row g-4 mb-4 pb-4 border-bottom border-light">
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Account Name</Form.Label>
                        <Form.Control name="accountName" value={settings.bankDetails?.accountName || ''} onChange={handleBankChange} />
                      </div>
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Account Number</Form.Label>
                        <Form.Control name="accountNumber" value={settings.bankDetails?.accountNumber || ''} onChange={handleBankChange} />
                      </div>
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Bank Name</Form.Label>
                        <Form.Control name="bankName" value={settings.bankDetails?.bankName || ''} onChange={handleBankChange} />
                      </div>
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">IFSC Code</Form.Label>
                        <Form.Control name="ifscCode" value={settings.bankDetails?.ifscCode || ''} onChange={handleBankChange} />
                      </div>
                    </div>

                    <h5 className="mb-4 fw-bolder text-primary text-uppercase" style={{ letterSpacing: '1.5px' }}>Terms & Notes</h5>
                    <div className="row g-4">
                      <div className="col-md-12">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Terms and Conditions</Form.Label>
                        <Form.Control as="textarea" rows={3} name="termsAndConditions" value={settings.termsAndConditions || ''} onChange={handleChange} />
                      </div>
                      <div className="col-md-12">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Invoice Footer Notes</Form.Label>
                        <Form.Control name="invoiceFooter" value={settings.invoiceFooter || ''} onChange={handleChange} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* ALERTS TAB */}
              <Tab.Pane eventKey="alerts">
                <Card className="mb-3 border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-bottom border-light">
                    <h5 className="mb-0 fw-bold">Inventory Alerts</h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Default Low Stock Threshold</Form.Label>
                        <Form.Control type="number" name="lowStockThresholdDefault" value={settings.lowStockThresholdDefault || 10} onChange={handleChange} />
                        <Form.Text className="text-muted small">Will trigger low stock warning if no product-specific threshold is set.</Form.Text>
                      </div>
                      <div className="col-md-6">
                        <Form.Label className="fw-medium text-muted small text-uppercase">Expiry Alert Days</Form.Label>
                        <Form.Control name="expiryAlertDays" value={settings.expiryAlertDays?.join(', ') || ''} onChange={handleArrayChange} placeholder="e.g. 30, 15, 10, 5" />
                        <Form.Text className="text-muted small">Comma separated days before expiry to alert.</Form.Text>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </div>
  );
}

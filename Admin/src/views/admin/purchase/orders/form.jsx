import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Table, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import { formatCurrency } from '@/utils/format';
import Select from 'react-select';

export default function PurchaseOrderForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [poData, setPoData] = useState(null);

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      supplier: '',
      expectedDate: '',
      notes: '',
      status: 'Draft',
      items: [],
      discount: 0,
      tax: 0,
      charges: 0
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items");
  const watchDiscount = watch("discount");
  const watchTax = watch("tax");
  const watchCharges = watch("charges");

  useEffect(() => {
    fetchFormData();
    if (isEdit) {
      loadPO();
    }
  }, [id]);

  const fetchFormData = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products')
      ]);
      setSuppliers(supRes.data.data.map(s => ({ value: s._id, label: s.name })));
      // Filter out only active products
      setProducts(prodRes.data.data.map(p => ({ 
        value: p._id, 
        label: `${p.name} (${p.sku || 'No SKU'})`,
        product: p 
      })));
    } catch (e) {
      toast.error('Failed to load form data');
    }
  };

  const formatSupplierOptionLabel = ({ label, supplier }, { context }) => {
    if (context === 'value') return <div className="fw-bold">{label}</div>;
    return (
      <div className="d-flex justify-content-between align-items-center w-100">
        <div className="d-flex flex-column">
          <div className="fw-bold text-body">{label}</div>
          {supplier && (
            <small className="text-muted" style={{ fontSize: '11px' }}>
              Contact: {supplier.contactPerson || supplier.name} | Phone: {supplier.phone}
              {supplier.gstNumber && ` | GST: ${supplier.gstNumber}`}
            </small>
          )}
        </div>
        {supplier?.paymentTerms && (
          <Badge bg="primary" style={{ fontSize: '10px' }}>{supplier.paymentTerms}</Badge>
        )}
      </div>
    );
  };

  const formatProductOptionLabel = ({ label, product }, { context }) => {
    if (context === 'value') return <div className="fw-bold">{product?.name || label}</div>;
    return (
      <div className="d-flex justify-content-between align-items-center w-100">
        <div className="d-flex flex-column">
          <div className="fw-bold text-body">{product?.name || label}</div>
          {product && (
            <small className="text-muted" style={{ fontSize: '11px' }}>
              Base: <Badge bg="secondary" style={{ fontSize: '10px' }}>{product.baseUnit || 'PCS'}</Badge> | SKU: {product.baseSku || '-'}
              {product.brand && ` | ${product.brand}`}
            </small>
          )}
        </div>
        {product && (
          <div className="text-end">
            <div className="fw-bold text-primary" style={{ fontSize: '13px' }}>{formatCurrency(product.sellingPrice || product.mrp || 0)}</div>
            <small className="text-muted" style={{ fontSize: '11px' }}>Stock: {product.stock || 0}</small>
          </div>
        )}
      </div>
    );
  };

  const loadPO = async () => {
    try {
      const res = await api.get(`/purchase/orders/${id}`);
      setPoData(res.data);
      reset({
        supplier: res.data.supplier._id,
        expectedDate: res.data.expectedDate ? new Date(res.data.expectedDate).toISOString().split('T')[0] : '',
        notes: res.data.notes || '',
        status: res.data.status,
        discount: res.data.discount || 0,
        tax: res.data.tax || 0,
        charges: res.data.charges || 0,
        items: res.data.items.map(item => ({
          product: item.product._id,
          productObj: { value: item.product._id, label: item.product.name },
          purchaseUnit: item.purchaseUnit,
          requestedQty: item.requestedQty,
          receivedQty: item.receivedQty || 0,
          unitCost: item.unitCost,
          discount: item.discount || 0,
          gst: item.gst || 0,
          total: item.total
        }))
      });
    } catch (e) {
      toast.error('Failed to load Purchase Order');
    } finally {
      setInitialLoading(false);
    }
  };

  // Recalculate Totals
  const calculateTotals = () => {
    let subtotal = 0;
    watchItems.forEach(item => {
      const qty = Number(item.requestedQty) || 0;
      const cost = Number(item.unitCost) || 0;
      const disc = Number(item.discount) || 0;
      const itemGst = Number(item.gst) || 0;
      
      const itemSub = (qty * cost) - disc;
      const itemTax = itemSub * (itemGst / 100);
      const itemTotal = itemSub + itemTax;
      
      subtotal += itemTotal;
    });

    const discount = Number(watchDiscount) || 0;
    const tax = Number(watchTax) || 0;
    const charges = Number(watchCharges) || 0;

    const grandTotal = subtotal - discount + tax + charges;
    // Basic rounding
    const roundedTotal = Math.round(grandTotal);
    const roundOff = roundedTotal - grandTotal;

    return { subtotal, discount, tax, charges, roundOff, grandTotal: roundedTotal };
  };

  const totals = calculateTotals();

  const handleProductSelect = (index, selectedOption) => {
    const p = selectedOption.product;
    setValue(`items.${index}.product`, p._id);
    setValue(`items.${index}.productObj`, selectedOption);
    setValue(`items.${index}.purchaseUnit`, p.purchaseUnit || p.baseUnit || 'PCS');
    setValue(`items.${index}.unitCost`, p.costPrice || 0);
    updateItemTotal(index);
  };

  const updateItemTotal = (index) => {
    const items = control._formValues.items;
    const item = items[index];
    const qty = Number(item.requestedQty) || 0;
    const cost = Number(item.unitCost) || 0;
    const disc = Number(item.discount) || 0;
    const gst = Number(item.gst) || 0;
    
    const itemSub = (qty * cost) - disc;
    const itemTax = itemSub * (gst / 100);
    const itemTotal = itemSub + itemTax;
    
    setValue(`items.${index}.total`, Number(itemTotal.toFixed(2)));
  };

  const onSubmit = async (data) => {
    if (data.items.length === 0) {
      return toast.error("Please add at least one item.");
    }
    
    setLoading(true);
    try {
      const payload = {
        ...data,
        ...totals
      };
      
      if (isEdit) {
        await api.put(`/purchase/orders/${id}`, payload);
        toast.success("Purchase Order updated successfully");
      } else {
        await api.post('/purchase/orders', payload);
        toast.success("Purchase Order created successfully");
      }
      navigate('/purchase/orders');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save purchase order');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = poData && (poData.status === 'Received' || poData.status === 'Cancelled');

  if (initialLoading) return <div>Loading...</div>;

  return (
    <div>
      <PageHeader
        title={isEdit ? `Edit PO: ${poData?.orderNumber}` : "Create Purchase Order"}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Purchase', path: '/purchase/orders' },
          { label: isEdit ? 'Edit' : 'Create' }
        ]}
        onBack={() => navigate('/purchase/orders')}
      />

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Supplier Details</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier <span className="text-danger">*</span></Form.Label>
                  <Controller
                    name="supplier"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={suppliers}
                        isDisabled={isLocked}
                        value={suppliers.find(s => s.value === field.value) || null}
                        onChange={(option) => field.onChange(option?.value)}
                        placeholder="Select Supplier..."
                        formatOptionLabel={formatSupplierOptionLabel}
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                      />
                    )}
                  />
                  {errors.supplier && <span className="text-danger small">Supplier is required</span>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expected Date</Form.Label>
                  <Form.Control
                    type="date"
                    disabled={isLocked}
                    {...register('expectedDate')}
                  />
                </Form.Group>
              </Col>
            </Row>
            {isEdit && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select disabled={isLocked} {...register('status')}>
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Cancelled">Cancelled</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Order Items</h5>
            {!isLocked && (
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => append({ product: '', purchaseUnit: 'PCS', requestedQty: 1, unitCost: 0, discount: 0, gst: 0, total: 0 })}
              >
                <Icon icon="lucide:plus" width={16} className="me-1" /> Add Item
              </Button>
            )}
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive bordered className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th style={{ minWidth: '300px' }}>Product</th>
                  <th style={{ width: '120px' }}>Unit</th>
                  <th style={{ width: '120px' }}>Quantity</th>
                  {isEdit && poData?.status === 'Partially Received' && <th style={{ width: '120px' }}>Received</th>}
                  <th style={{ width: '150px' }}>Unit Cost</th>
                  <th style={{ width: '120px' }}>GST %</th>
                  <th style={{ width: '150px' }}>Total</th>
                  {!isLocked && <th style={{ width: '60px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td>
                      <Controller
                        name={`items.${index}.productObj`}
                        control={control}
                        render={({ field: selectField }) => (
                          <Select
                            {...selectField}
                            options={products}
                            isDisabled={isLocked}
                            value={products.find(p => p.value === selectField.value) || null}
                            onChange={(option) => {
                              selectField.onChange(option?.value);
                              if (option?.product) {
                                setValue(`items.${index}.purchaseUnit`, option.product.purchaseUnit || option.product.baseUnit || 'PCS');
                                setValue(`items.${index}.unitCost`, option.product.costPrice || 0);
                                setValue(`items.${index}.gst`, option.product.taxRate || 0);
                                updateItemTotal(index);
                              }
                            }}
                            formatOptionLabel={formatProductOptionLabel}
                            classNamePrefix="react-select"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                          />
                        )}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        disabled={isLocked}
                        {...register(`items.${index}.purchaseUnit`)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min="1"
                        disabled={isLocked}
                        {...register(`items.${index}.requestedQty`, { 
                          onChange: () => updateItemTotal(index)
                        })}
                      />
                    </td>
                    {isEdit && poData?.status === 'Partially Received' && (
                      <td>
                        <Form.Control
                          type="number"
                          disabled
                          {...register(`items.${index}.receivedQty`)}
                        />
                      </td>
                    )}
                    <td>
                      <Form.Control
                        type="number"
                        step="0.01"
                        disabled={isLocked}
                        {...register(`items.${index}.unitCost`, { 
                          onChange: () => updateItemTotal(index)
                        })}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        disabled={isLocked}
                        {...register(`items.${index}.gst`, { 
                          onChange: () => updateItemTotal(index)
                        })}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        step="0.01"
                        readOnly
                        className="bg-light"
                        {...register(`items.${index}.total`)}
                      />
                    </td>
                    {!isLocked && (
                      <td className="text-center">
                        <Button variant="link" className="text-danger p-0" onClick={() => remove(index)}>
                          <Icon icon="lucide:trash-2" width={18} />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No items added. Click "Add Item" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        <Row>
          <Col md={7}>
            <Card className="mb-4 h-100">
              <Card.Header>
                <h5 className="mb-0">Additional Notes</h5>
              </Card.Header>
              <Card.Body>
                <Form.Control
                  as="textarea"
                  rows={4}
                  disabled={isLocked}
                  placeholder="Add any notes for the supplier..."
                  {...register('notes')}
                />
              </Card.Body>
            </Card>
          </Col>
          <Col md={5}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Order Summary</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span className="fw-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2 align-items-center">
                  <span>Overall Discount</span>
                  <div style={{ width: '100px' }}>
                    <Form.Control
                      type="number"
                      size="sm"
                      disabled={isLocked}
                      {...register('discount')}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-2 align-items-center">
                  <span>Additional Tax</span>
                  <div style={{ width: '100px' }}>
                    <Form.Control
                      type="number"
                      size="sm"
                      disabled={isLocked}
                      {...register('tax')}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-2 align-items-center">
                  <span>Shipping/Charges</span>
                  <div style={{ width: '100px' }}>
                    <Form.Control
                      type="number"
                      size="sm"
                      disabled={isLocked}
                      {...register('charges')}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Round Off</span>
                  <span className="text-muted">{totals.roundOff.toFixed(2)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <span className="fw-bold">Grand Total</span>
                  <span className="fw-bold fs-5 text-primary">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-end gap-2">
                <Button variant="light" onClick={() => navigate('/purchase/orders')}>Cancel</Button>
                {!isLocked && (
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (isEdit ? 'Update Order' : 'Create Order')}
                  </Button>
                )}
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

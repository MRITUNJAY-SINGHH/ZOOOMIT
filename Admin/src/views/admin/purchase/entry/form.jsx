import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Row, Col, Table, Badge, InputGroup, Modal } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import { formatCurrency, formatDate } from '@/utils/format';
import Select from 'react-select';
import PermissionGuard from '@/components/common/PermissionGuard';
import ProductForm from '../../catalog/products/ProductForm';

export default function PurchaseEntryForm() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id'); // Edit/View existing GRN
  const poId = searchParams.get('po'); // Create GRN from PO
  
  const isEdit = !!id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit || !!poId);
  const [finalizing, setFinalizing] = useState(false);
  
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [entryData, setEntryData] = useState(null);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const barcodeInputRef = useRef(null);

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      supplier: '',
      supplierInvoiceNo: '',
      invoiceDate: '',
      receivedDate: new Date().toISOString().split('T')[0],
      purchaseOrder: '',
      status: 'Draft',
      items: [],
      discount: 0,
      tax: 0,
      charges: 0,
      paidAmount: 0,
      paymentMethod: 'CASH'
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
  const watchPaid = watch("paidAmount");

  useEffect(() => {
    fetchFormData();
    if (id) {
      loadEntry(id);
    } else if (poId) {
      loadPO(poId);
    }
  }, [id, poId]);

  const fetchFormData = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products')
      ]);
      setSuppliers(supRes.data.data.map(s => ({ value: s._id, label: s.name })));
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

  const loadEntry = async (entryId) => {
    try {
      const res = await api.get(`/purchase/entries/${entryId}`);
      const data = res.data;
      setEntryData(data);
      reset({
        supplier: data.supplier._id,
        supplierInvoiceNo: data.supplierInvoiceNo || '',
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toISOString().split('T')[0] : '',
        receivedDate: data.receivedDate ? new Date(data.receivedDate).toISOString().split('T')[0] : '',
        purchaseOrder: data.purchaseOrder?._id || '',
        status: data.status,
        discount: data.discount || 0,
        tax: data.tax || 0,
        charges: data.charges || 0,
        paidAmount: data.paidAmount || 0,
        paymentMethod: data.paymentMethod || 'CASH',
        items: data.items.map(item => ({
          product: item.product._id,
          productObj: { value: item.product._id, label: item.product.name },
          batchNumber: item.batchNumber,
          purchaseUnit: item.purchaseUnit,
          purchaseQty: item.purchaseQty,
          conversionFactor: item.conversionFactor,
          stockUnit: item.stockUnit,
          stockQty: item.stockQty,
          unitCost: item.unitCost,
          discount: item.discount || 0,
          gst: item.gst || 0,
          total: item.total,
          manufacturingDate: item.manufacturingDate ? new Date(item.manufacturingDate).toISOString().split('T')[0] : '',
          expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''
        }))
      });
    } catch (e) {
      toast.error('Failed to load GRN');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadPO = async (purchaseOrderId) => {
    try {
      const res = await api.get(`/purchase/orders/${purchaseOrderId}`);
      const po = res.data;
      
      reset({
        supplier: po.supplier._id,
        purchaseOrder: po._id,
        receivedDate: new Date().toISOString().split('T')[0],
        status: 'Draft',
        discount: 0,
        tax: 0,
        charges: 0,
        paidAmount: 0,
        items: po.items
          .filter(item => item.receivedQty < item.requestedQty)
          .map(item => {
            const pendingQty = item.requestedQty - (item.receivedQty || 0);
            return {
              product: item.product._id,
              productObj: { value: item.product._id, label: item.product.name, product: item.product },
              batchNumber: `BAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              purchaseUnit: item.purchaseUnit,
              purchaseQty: pendingQty,
              conversionFactor: item.product.purchaseToStockFactor || 1,
              stockUnit: item.product.baseUnit || 'PCS',
              stockQty: pendingQty * (item.product.purchaseToStockFactor || 1),
              unitCost: item.unitCost,
              discount: item.discount || 0,
              gst: item.gst || 0,
              total: pendingQty * item.unitCost, // Initial calc
              manufacturingDate: '',
              expiryDate: ''
            };
          })
      });
    } catch (e) {
      toast.error('Failed to load PO for receipt');
    } finally {
      setInitialLoading(false);
    }
  };

  // Recalculate Totals
  const calculateTotals = () => {
    let subtotal = 0;
    watchItems.forEach(item => {
      const qty = Number(item.purchaseQty) || 0;
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
    const roundedTotal = Math.round(grandTotal);
    const roundOff = roundedTotal - grandTotal;

    const paid = Number(watchPaid) || 0;
    const dueAmount = roundedTotal - paid;
    
    let paymentStatus = 'UNPAID';
    if (dueAmount <= 0 && paid > 0) paymentStatus = 'PAID';
    else if (paid > 0 && dueAmount > 0) paymentStatus = 'PARTIAL';

    return { subtotal, discount, tax, charges, roundOff, grandTotal: roundedTotal, dueAmount, paymentStatus };
  };

  const totals = calculateTotals();

  const handleProductSelect = (index, selectedOption) => {
    const p = selectedOption.product;
    setValue(`items.${index}.product`, p._id);
    setValue(`items.${index}.productObj`, selectedOption);
    setValue(`items.${index}.batchNumber`, `BAT-${Date.now()}`);
    setValue(`items.${index}.purchaseUnit`, p.purchaseUnit || p.baseUnit || 'PCS');
    setValue(`items.${index}.conversionFactor`, p.purchaseToStockFactor || 1);
    setValue(`items.${index}.stockUnit`, p.baseUnit || 'PCS');
    setValue(`items.${index}.unitCost`, p.costPrice || 0);
    setValue(`items.${index}.receivedMrp`, p.mrp || 0);
    updateItemTotal(index);
  };

  const handleBarcodeScan = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    setIsScanning(true);
    try {
      const res = await api.get(`/products/barcode/${barcodeInput.trim()}`);
      if (res.data) {
        const product = res.data.type === 'Variant' ? res.data.variantData : res.data.data;
        // The API returns the product master in data, or variant in variantData
        const productMaster = res.data.type === 'Variant' ? res.data.data : res.data.data;
        
        const existingIndex = fields.findIndex(f => 
          f.product === product._id || (f.productObj && f.productObj.product && (f.productObj.product.barcode === barcodeInput || f.productObj.product.baseSku === barcodeInput))
        );

        if (existingIndex >= 0) {
          const currentQty = Number(watch(`items.${existingIndex}.purchaseQty`)) || 0;
          setValue(`items.${existingIndex}.purchaseQty`, currentQty + 1);
          updateItemTotal(existingIndex);
          toast.success(`Incremented quantity for ${productMaster.name}`);
        } else {
          append({ 
            product: productMaster._id, 
            productObj: { value: productMaster._id, label: productMaster.name, product: productMaster },
            batchNumber: `BAT-${Date.now()}`, 
            purchaseUnit: productMaster.purchaseUnit || productMaster.baseUnit || 'PCS', 
            conversionFactor: productMaster.purchaseToStockFactor || 1, 
            stockUnit: productMaster.baseUnit || 'PCS', 
            purchaseQty: 1, 
            stockQty: 1 * (productMaster.purchaseToStockFactor || 1), 
            unitCost: product.costPrice || productMaster.costPrice || 0,
            receivedMrp: product.mrp || productMaster.mrp || 0,
            discount: 0, 
            gst: productMaster.taxRate || 0, 
            total: product.costPrice || productMaster.costPrice || 0 
          });
          toast.success(`Added ${productMaster.name}`);
        }
      }
    } catch (e) {
      if (e.response?.status === 404) {
        toast.error('Product not found. Opening Quick Create...', { icon: '⚠️' });
        setShowProductModal(true);
      } else {
        toast.error('Failed to lookup barcode');
      }
    } finally {
      setIsScanning(false);
      setBarcodeInput('');
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    }
  };

  const handleProductCreated = (newProduct) => {
    setShowProductModal(false);
    toast.success('Product created successfully');
    
    // Add to global options
    setProducts(prev => [{ value: newProduct._id, label: newProduct.name, product: newProduct }, ...prev]);
    
    // Auto-select and append to GRN
    append({ 
      product: newProduct._id, 
      productObj: { value: newProduct._id, label: newProduct.name, product: newProduct },
      batchNumber: `BAT-${Date.now()}`, 
      purchaseUnit: newProduct.purchaseUnit || newProduct.baseUnit || 'PCS', 
      conversionFactor: newProduct.purchaseToStockFactor || 1, 
      stockUnit: newProduct.baseUnit || 'PCS', 
      purchaseQty: 1, 
      stockQty: 1 * (newProduct.purchaseToStockFactor || 1), 
      unitCost: newProduct.costPrice || 0,
      receivedMrp: newProduct.mrp || 0,
      discount: 0, 
      gst: newProduct.taxRate || 0, 
      total: newProduct.costPrice || 0 
    });
    
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  const updateItemTotal = (index) => {
    const items = control._formValues.items;
    const item = items[index];
    
    // Update stock qty based on purchase qty and conversion
    const pQty = Number(item.purchaseQty) || 0;
    const conv = Number(item.conversionFactor) || 1;
    setValue(`items.${index}.stockQty`, pQty * conv);

    const cost = Number(item.unitCost) || 0;
    const disc = Number(item.discount) || 0;
    const gst = Number(item.gst) || 0;
    
    const itemSub = (pQty * cost) - disc;
    const itemTax = itemSub * (gst / 100);
    const itemTotal = itemSub + itemTax;
    
    setValue(`items.${index}.total`, Number(itemTotal.toFixed(2)));
  };

  const onSubmit = async (data) => {
    if (data.items.length === 0) {
      return toast.error("Please add at least one item to receive.");
    }
    if (data.paidAmount > totals.grandTotal) {
      return toast.error("Paid amount cannot exceed Grand Total.");
    }
    
    setLoading(true);
    try {
      const payload = {
        ...data,
        ...totals
      };
      
      let savedEntry;
      if (isEdit) {
        const res = await api.put(`/purchase/entries/${id}`, payload);
        savedEntry = res.data;
        toast.success("Draft GRN updated successfully");
      } else {
        const res = await api.post('/purchase/entries', payload);
        savedEntry = res.data;
        toast.success("Draft GRN created successfully");
        navigate(`/purchase/entry?id=${savedEntry._id}`); // Switch to edit mode
      }
      setEntryData(savedEntry);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save GRN');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (window.confirm("Are you sure you want to finalize this GRN? This will update stock, create batches, and lock the document permanently. This action cannot be undone.")) {
      setFinalizing(true);
      try {
        await api.post(`/purchase/entries/${id}/finalize`);
        toast.success("GRN Finalized and Stock Updated!");
        loadEntry(id); // Reload to get Finalized status
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to finalize GRN');
      } finally {
        setFinalizing(false);
      }
    }
  };

  const isLocked = entryData?.status === 'Finalized';

  if (initialLoading) return <div>Loading...</div>;

  return (
    <div>
      <PageHeader
        title={isLocked ? `View GRN: ${entryData.entryNumber}` : (isEdit ? `Edit GRN: ${entryData.entryNumber}` : "Goods Received Note (GRN)")}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Purchase History', path: '/purchase/history' },
          { label: isEdit ? 'GRN' : 'Create' }
        ]}
        onBack={() => navigate('/purchase/history')}
      />

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Supplier & Invoice Details</h5>
            {entryData && (
              <Badge bg={isLocked ? 'success' : 'secondary'} className="fs-6">
                {entryData.status}
              </Badge>
            )}
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
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
                        isDisabled={isLocked || !!poId}
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
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier Invoice No <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    disabled={isLocked}
                    {...register('supplierInvoiceNo', { required: true })}
                  />
                  {errors.supplierInvoiceNo && <span className="text-danger small">Required</span>}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Invoice Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    disabled={isLocked}
                    {...register('invoiceDate', { required: true })}
                  />
                  {errors.invoiceDate && <span className="text-danger small">Required</span>}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Received Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    disabled={isLocked}
                    {...register('receivedDate', { required: true })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header className="d-flex flex-column gap-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Received Items</h5>
              {!isLocked && (
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => append({ product: '', batchNumber: `BAT-${Date.now()}`, purchaseUnit: 'PCS', conversionFactor: 1, stockUnit: 'PCS', purchaseQty: 1, stockQty: 1, unitCost: 0, receivedMrp: 0, discount: 0, gst: 0, total: 0 })}
                >
                  <Icon icon="lucide:plus" width={16} className="me-1" /> Add Item
                </Button>
              )}
            </div>
            
            {!isLocked && !poId && (
              <Form onSubmit={handleBarcodeScan}>
                <InputGroup className="w-100" style={{ maxWidth: '400px' }}>
                  <InputGroup.Text className="bg-light">
                    <Icon icon="lucide:barcode" width={18} />
                  </InputGroup.Text>
                  <Form.Control
                    ref={barcodeInputRef}
                    placeholder="Scan or type Barcode / SKU and press Enter..."
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    disabled={isScanning}
                  />
                  <Button variant="primary" type="submit" disabled={isScanning || !barcodeInput.trim()}>
                    {isScanning ? <Spinner size="sm" /> : 'Search'}
                  </Button>
                </InputGroup>
              </Form>
            )}
          </Card.Header>
          <Card.Body className="p-0 overflow-auto">
            <Table responsive bordered className="mb-0" style={{ minWidth: '1500px' }}>
              <thead className="bg-light">
                <tr>
                  <th style={{ width: '250px' }}>Product</th>
                  <th style={{ width: '150px' }}>Batch No</th>
                  <th style={{ width: '120px' }}>Purch Qty</th>
                  <th style={{ width: '100px' }}>Purch Unit</th>
                  <th style={{ width: '150px' }}>Conv Factor &rarr; Stock</th>
                  <th style={{ width: '120px' }}>Act. Cost</th>
                  <th style={{ width: '100px' }}>Master MRP</th>
                  <th style={{ width: '120px' }}>Recv. MRP</th>
                  <th style={{ width: '100px' }}>GST %</th>
                  <th style={{ width: '140px' }}>Total</th>
                  <th style={{ width: '140px' }}>Mfg Date</th>
                  <th style={{ width: '140px' }}>Exp Date</th>
                  {!isLocked && <th style={{ width: '50px' }}></th>}
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
                            isDisabled={isLocked || !!poId}
                            onChange={(option) => {
                              selectField.onChange(option);
                              handleProductSelect(index, option);
                            }}
                            placeholder="Select Product..."
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
                        size="sm"
                        disabled={isLocked}
                        {...register(`items.${index}.batchNumber`)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        min="1"
                        disabled={isLocked}
                        {...register(`items.${index}.purchaseQty`, { 
                          onChange: () => updateItemTotal(index)
                        })}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        size="sm"
                        disabled={isLocked}
                        {...register(`items.${index}.purchaseUnit`)}
                      />
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <Form.Control
                          type="number"
                          size="sm"
                          step="0.01"
                          disabled={isLocked}
                          style={{ width: '60px' }}
                          {...register(`items.${index}.conversionFactor`, { 
                            onChange: () => updateItemTotal(index)
                          })}
                        />
                        <span className="text-muted small">&rarr;</span>
                        <Form.Control
                          type="text"
                          size="sm"
                          readOnly
                          className="bg-light"
                          style={{ width: '70px' }}
                          title={`Stock: ${watchItems[index]?.stockQty}`}
                          {...register(`items.${index}.stockUnit`)}
                        />
                      </div>
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
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
                        size="sm"
                        disabled
                        value={fields[index]?.productObj?.product?.mrp || watchItems[index]?.productObj?.product?.mrp || 0}
                        className="bg-light"
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        step="0.01"
                        disabled={isLocked}
                        {...register(`items.${index}.receivedMrp`)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        disabled={isLocked}
                        {...register(`items.${index}.gst`, { 
                          onChange: () => updateItemTotal(index)
                        })}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        step="0.01"
                        readOnly
                        className="bg-light fw-bold"
                        {...register(`items.${index}.total`)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="date"
                        size="sm"
                        disabled={isLocked}
                        {...register(`items.${index}.manufacturingDate`)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="date"
                        size="sm"
                        disabled={isLocked}
                        {...register(`items.${index}.expiryDate`)}
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
                    <td colSpan="11" className="text-center py-4 text-muted">
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
                <h5 className="mb-0">Payment Snapshot & Notes</h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Paid Amount</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        disabled={isLocked}
                        {...register('paidAmount')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Payment Method</Form.Label>
                      <Form.Select disabled={isLocked} {...register('paymentMethod')}>
                        <option value="CASH">Cash</option>
                        <option value="BANK">Bank Transfer</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="CARD">Card</option>
                        <option value="UPI">UPI</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group>
                  <Form.Label>Additional Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    disabled={isLocked}
                    {...register('notes')}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
          <Col md={5}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">GRN Summary</h5>
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
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-bold fs-5">Grand Total</span>
                  <span className="fw-bold fs-5 text-primary">{formatCurrency(totals.grandTotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-bold text-success">Paid</span>
                  <span className="fw-bold text-success">{formatCurrency(watchPaid)}</span>
                </div>
                <div className="d-flex justify-content-between rounded bg-light p-2 mt-2">
                  <span className="fw-bold text-danger">Due Balance</span>
                  <span className="fw-bold text-danger">{formatCurrency(totals.dueAmount)}</span>
                </div>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between gap-2">
                <Button variant="light" onClick={() => navigate('/purchase/history')}>Back</Button>
                
                <div className="d-flex gap-2">
                  {!isLocked && (
                    <Button variant="outline-primary" type="submit" disabled={loading || finalizing}>
                      {loading ? 'Saving Draft...' : 'Save Draft'}
                    </Button>
                  )}
                  {isEdit && !isLocked && (
                    <PermissionGuard permission="purchase.finalize">
                      <Button variant="success" onClick={handleFinalize} disabled={loading || finalizing}>
                        {finalizing ? 'Finalizing...' : 'Finalize & Update Stock'}
                      </Button>
                    </PermissionGuard>
                  )}
                </div>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Quick Create Product Modal */}
      <Modal 
        show={showProductModal} 
        onHide={() => setShowProductModal(false)}
        size="xl"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Quick Create Product</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 bg-light">
          {/* We reuse the full ProductForm component but pass onSave and onBack */}
          <div style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.5rem' }}>
             <ProductForm 
               onBack={() => setShowProductModal(false)}
               onSave={(newProduct) => handleProductCreated(newProduct)}
             />
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

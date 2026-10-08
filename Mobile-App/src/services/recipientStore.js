// Tiny in-memory store that carries the "Order for someone else" recipient
// from the cart screen to checkout. Null means a normal order for the customer.
let currentRecipient = null;

export const getOrderRecipient = () => currentRecipient;

export const setOrderRecipient = (recipient) => {
  currentRecipient = recipient || null;
};

export const clearOrderRecipient = () => {
  currentRecipient = null;
};

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

export const normalizePhone = (v) =>
  clean(v).replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');

export const validateRecipient = (r) => {
  const errors = {};
  if (clean(r.name).length < 2) errors.name = 'Enter the recipient name';
  if (!/^[6-9]\d{9}$/.test(normalizePhone(r.phone))) errors.phone = 'Enter a valid 10-digit mobile number';
  if (clean(r.street).length < 5) errors.street = 'Enter house no., building and street';
  if (!clean(r.city)) errors.city = 'Enter the city';
  if (!/^\d{6}$/.test(clean(r.zipCode))) errors.zipCode = 'Enter a 6-digit pincode';
  return errors;
};

export const toRecipientPayload = (r) => ({
  name: clean(r.name),
  phone: normalizePhone(r.phone),
  street: clean(r.street),
  landmark: clean(r.landmark),
  city: clean(r.city),
  state: clean(r.state),
  zipCode: clean(r.zipCode),
  notes: clean(r.notes)
});

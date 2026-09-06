/**
 * Decimal-safe arithmetic and validation utilities for Kuiklo ERP & POS
 * Eliminates JavaScript floating-point representation anomalies.
 */

/**
 * Rounds a number to a fixed decimal precision safely
 * @param {number|string} val 
 * @param {number} decimals 
 * @returns {number}
 */
export const roundTo = (val, decimals = 3) => {
  const num = Number(val);
  if (isNaN(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

/**
 * Safe multiplication
 * @param {number|string} a 
 * @param {number|string} b 
 * @param {number} decimals 
 * @returns {number}
 */
export const multiply = (a, b, decimals = 2) => {
  const numA = Number(a) || 0;
  const numB = Number(b) || 0;
  return roundTo(numA * numB, decimals);
};

/**
 * Safe division
 * @param {number|string} a 
 * @param {number|string} b 
 * @param {number} decimals 
 * @returns {number}
 */
export const divide = (a, b, decimals = 2) => {
  const numA = Number(a) || 0;
  const numB = Number(b) || 1;
  if (numB === 0) return 0;
  return roundTo(numA / numB, decimals);
};

/**
 * Validates if quantity satisfies minimum, maximum, and step rules using integer scaling
 * @param {number|string} qty 
 * @param {number|string} minQty 
 * @param {number|string} maxQty 
 * @param {number|string} qtyStep 
 * @param {number} decimals 
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validateQuantityRules = (qty, minQty = 1, maxQty = 100, qtyStep = 1, decimals = 3) => {
  const q = roundTo(qty, decimals);
  const min = roundTo(minQty, decimals);
  const max = roundTo(maxQty, decimals);
  const step = roundTo(qtyStep, decimals);

  if (q < min) {
    return { isValid: false, error: `Quantity (${q}) cannot be less than minimum allowed (${min})` };
  }

  if (q > max) {
    return { isValid: false, error: `Quantity (${q}) cannot exceed maximum allowed (${max})` };
  }

  if (step > 0) {
    const scale = Math.pow(10, decimals);
    const diffScaled = Math.round((q - min) * scale);
    const stepScaled = Math.round(step * scale);

    if (diffScaled % stepScaled !== 0) {
      return { 
        isValid: false, 
        error: `Quantity (${q}) must be in step increments of ${step} starting from ${min} (e.g. ${min}, ${roundTo(min + step, decimals)}, ${roundTo(min + step * 2, decimals)})` 
      };
    }
  }

  return { isValid: true };
};

/**
 * Computes GST Tax breakdown based on Tax Mode
 * @param {number} sellingPrice Per-unit price
 * @param {number} quantity Quantity sold
 * @param {number} taxRate GST rate (e.g. 5, 12, 18, 28)
 * @param {'INCLUSIVE'|'EXCLUSIVE'} taxMode Store tax mode
 * @returns {{ taxableAmount: number, taxAmount: number, cgst: number, sgst: number, igst: number, totalAmount: number }}
 */
export const calculateTax = (sellingPrice, quantity, taxRate = 0, taxMode = 'INCLUSIVE') => {
  const price = Number(sellingPrice) || 0;
  const qty = Number(quantity) || 0;
  const rate = Number(taxRate) || 0;
  const gross = multiply(price, qty, 2);

  if (rate === 0) {
    return {
      taxableAmount: gross,
      taxAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalAmount: gross
    };
  }

  if (taxMode === 'EXCLUSIVE') {
    const taxableAmount = gross;
    const taxAmount = roundTo(taxableAmount * (rate / 100), 2);
    const totalAmount = roundTo(taxableAmount + taxAmount, 2);
    const cgst = roundTo(taxAmount / 2, 2);
    const sgst = roundTo(taxAmount - cgst, 2); // Avoid 1 paisa split rounding errors

    return {
      taxableAmount,
      taxAmount,
      cgst,
      sgst,
      igst: taxAmount,
      totalAmount
    };
  } else {
    // INCLUSIVE (Standard Retail/MRP)
    const taxableAmount = roundTo(gross / (1 + (rate / 100)), 2);
    const taxAmount = roundTo(gross - taxableAmount, 2);
    const totalAmount = gross;
    const cgst = roundTo(taxAmount / 2, 2);
    const sgst = roundTo(taxAmount - cgst, 2);

    return {
      taxableAmount,
      taxAmount,
      cgst,
      sgst,
      igst: taxAmount,
      totalAmount
    };
  }
};

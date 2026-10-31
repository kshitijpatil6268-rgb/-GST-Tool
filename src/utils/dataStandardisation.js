/**
 * Standardises invoice numbers for matching:
 * 1. Convert to text
 * 2. Remove leading and trailing spaces
 * 3. Convert alphabetic characters into uppercase
 * 4. Standardise repeated spaces to a single space
 * 5. Preserve hyphens, slashes, special characters and leading zeros
 * 6. Exclude blank values and values that are only zeros
 *
 * @param {any} val - Raw invoice number from Excel
 * @returns {string} Standardised invoice number, or empty string if invalid
 */
export function standardiseInvoiceNumber(val) {
  if (val === null || val === undefined) return '';

  let str = String(val).trim();
  if (!str) return '';

  // Convert alphabetic characters to uppercase
  str = str.toUpperCase();

  // Standardise repeated spaces (replace 2 or more spaces with 1 space)
  str = str.replace(/\s+/g, ' ');

  // Check if string contains only zero(s) (e.g. "0", "00", "000")
  if (/^0+$/.test(str)) {
    return '';
  }

  return str;
}

/**
 * Checks if a standardized invoice number is valid for reconciliation.
 *
 * @param {string} val
 * @returns {boolean}
 */
export function isValidInvoiceNumber(val) {
  const std = standardiseInvoiceNumber(val);
  return std.length > 0;
}

/**
 * Parses and formats dates from various formats (Excel serial number, DD/MM/YYYY, YYYY-MM-DD, DD-MMM-YYYY)
 *
 * @param {any} val
 * @returns {string} Formatted date string (DD/MM/YYYY or original readable string)
 */
export function formatDisplayDate(val) {
  if (val === null || val === undefined || val === '') return '-';

  // If number, it could be an Excel serial date
  if (typeof val === 'number') {
    if (val > 20000 && val < 60000) {
      // Excel epoch: Dec 30 1899
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
      }
    }
    return String(val);
  }

  const str = String(val).trim();
  // If Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return str;
}

/**
 * Parses numeric monetary values, stripping currency symbols (like "Rs.", "₹"), commas, etc.
 *
 * @param {any} val
 * @returns {number}
 */
export function parseCurrencyAmount(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const str = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a number to Indian currency format (e.g. ₹ 1,23,456.78)
 *
 * @param {number|string} val
 * @returns {string}
 */
export function formatCurrency(val) {
  const num = parseCurrencyAmount(val);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
}


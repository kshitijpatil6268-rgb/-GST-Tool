import * as XLSX from 'xlsx';
import { detectHeaders, GSTR2B_FIELD_PATTERNS, BOOKS_FIELD_PATTERNS } from './headerDetection.js';
import { standardiseInvoiceNumber, parseCurrencyAmount } from './dataStandardisation.js';
import { consolidateBooksInvoices } from './invoiceConsolidation.js';

/**
 * Reads a File object in the browser and returns a SheetJS workbook.
 *
 * @param {File} file
 * @returns {Promise<XLSX.WorkBook>}
 */
export async function readWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd'
        });
        resolve(workbook);
      } catch (err) {
        reject(new Error(`Failed to parse Excel file "${file.name}": ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error(`Error reading file "${file.name}"`));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Finds the most likely target worksheet name from available sheet names.
 *
 * @param {Array<string>} sheetNames
 * @param {'gstr2b'|'books'} type
 * @returns {string} Best matched sheet name
 */
export function findPreferredSheet(sheetNames, type) {
  if (!sheetNames || sheetNames.length === 0) return '';

  if (type === 'gstr2b') {
    // Look for exact B2B first
    const exactB2B = sheetNames.find(n => /^b2b$/i.test(n.trim()));
    if (exactB2B) return exactB2B;

    // Look for sheets containing B2B
    const containsB2B = sheetNames.find(n => /b2b/i.test(n));
    if (containsB2B) return containsB2B;

    // Look for sheets containing GSTR-2B or 2B
    const gstr2bSheet = sheetNames.find(n => /(gstr[-_ ]?2b|2b)/i.test(n));
    if (gstr2bSheet) return gstr2bSheet;
  } else {
    // Books: Look for Payable Details
    const exactPayable = sheetNames.find(n => /^payable\s*details$/i.test(n.trim()));
    if (exactPayable) return exactPayable;

    const containsPayable = sheetNames.find(n => /payable/i.test(n));
    if (containsPayable) return containsPayable;

    const booksSheet = sheetNames.find(n => /books?/i.test(n));
    if (booksSheet) return booksSheet;
  }

  // Fallback to first sheet
  return sheetNames[0];
}

/**
 * Parses GSTR-2B sheet data from a workbook.
 *
 * @param {XLSX.WorkBook} workbook
 * @param {string} [sheetName] - Optional chosen sheet name
 * @returns {{
 *   invoices: Array<Object>,
 *   sheetNames: Array<string>,
 *   activeSheet: string,
 *   headerRowIndex: number,
 *   columnMap: Object,
 *   totalRowsRead: number
 * }}
 */
export function parseGSTR2BWorkbook(workbook, sheetName) {
  const sheetNames = workbook.SheetNames;
  const activeSheet = sheetName || findPreferredSheet(sheetNames, 'gstr2b');

  if (!activeSheet || !workbook.Sheets[activeSheet]) {
    throw new Error(`Worksheet "${activeSheet || 'B2B'}" not found in GSTR-2B file.`);
  }

  const sheet = workbook.Sheets[activeSheet];
  // Convert sheet to 2D array
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error(`The worksheet "${activeSheet}" is empty.`);
  }

  // Detect header row
  const { headerRowIndex, columnMap, detectedHeaders } = detectHeaders(rawRows, GSTR2B_FIELD_PATTERNS, 'GSTR-2B');

  // Extract data rows starting from row after header
  const invoiceMap = new Map();
  let totalDataRows = 0;

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawInvNum = row[columnMap.invoiceNumber];
    const stdInvNum = standardiseInvoiceNumber(rawInvNum);

    // Skip empty or zero invoice numbers
    if (!stdInvNum) continue;

    totalDataRows++;

    const gstin = columnMap.supplierGstin !== undefined ? String(row[columnMap.supplierGstin] || '').trim() : '';
    const supplierName = columnMap.supplierName !== undefined ? String(row[columnMap.supplierName] || '').trim() : '';
    const invoiceDate = columnMap.invoiceDate !== undefined ? row[columnMap.invoiceDate] : '';
    const invoiceType = columnMap.invoiceType !== undefined ? String(row[columnMap.invoiceType] || '').trim() : 'Regular';
    const invoiceValue = columnMap.invoiceValue !== undefined ? parseCurrencyAmount(row[columnMap.invoiceValue]) : 0;
    const taxableValue = columnMap.taxableValue !== undefined ? parseCurrencyAmount(row[columnMap.taxableValue]) : 0;
    const igst = columnMap.igst !== undefined ? parseCurrencyAmount(row[columnMap.igst]) : 0;
    const cgst = columnMap.cgst !== undefined ? parseCurrencyAmount(row[columnMap.cgst]) : 0;
    const sgst = columnMap.sgst !== undefined ? parseCurrencyAmount(row[columnMap.sgst]) : 0;

    if (!invoiceMap.has(stdInvNum)) {
      invoiceMap.set(stdInvNum, {
        cleanInvoiceNumber: stdInvNum,
        originalInvoiceNumber: String(rawInvNum).trim(),
        supplierGstin: gstin,
        supplierName: supplierName,
        invoiceDate: invoiceDate,
        invoiceType: invoiceType || 'Regular',
        invoiceValue: invoiceValue,
        taxableValue: taxableValue,
        igst: igst,
        cgst: cgst,
        sgst: sgst,
        rawRows: [row]
      });
    } else {
      // If invoice appears multiple times in GSTR-2B (e.g. multiple line items with different tax rates)
      const existing = invoiceMap.get(stdInvNum);
      existing.rawRows.push(row);
      // If previous values were empty, fill them
      if (!existing.supplierGstin && gstin) existing.supplierGstin = gstin;
      if (!existing.supplierName && supplierName) existing.supplierName = supplierName;
      if (!existing.invoiceDate && invoiceDate) existing.invoiceDate = invoiceDate;
      // If invoiceValue is 0 on one row and positive on another, update it
      if ((!existing.invoiceValue || existing.invoiceValue === 0) && invoiceValue > 0) {
        existing.invoiceValue = invoiceValue;
      }
    }
  }

  const invoices = Array.from(invoiceMap.values());

  if (invoices.length === 0) {
    throw new Error(`No valid invoices found in GSTR-2B worksheet "${activeSheet}". Please verify the file content.`);
  }

  return {
    invoices,
    sheetNames,
    activeSheet,
    headerRowIndex,
    columnMap,
    detectedHeaders,
    totalRowsRead: totalDataRows
  };
}

/**
 * Parses Books (Payable Details) sheet data from a workbook.
 *
 * @param {XLSX.WorkBook} workbook
 * @param {string} [sheetName] - Optional chosen sheet name
 * @returns {{
 *   invoices: Array<Object>,
 *   sheetNames: Array<string>,
 *   activeSheet: string,
 *   headerRowIndex: number,
 *   columnMap: Object,
 *   totalRowsRead: number
 * }}
 */
export function parseBooksWorkbook(workbook, sheetName) {
  const sheetNames = workbook.SheetNames;
  const activeSheet = sheetName || findPreferredSheet(sheetNames, 'books');

  if (!activeSheet || !workbook.Sheets[activeSheet]) {
    throw new Error(`Worksheet "${activeSheet || 'Payable Details'}" not found in Books file.`);
  }

  const sheet = workbook.Sheets[activeSheet];
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error(`The worksheet "${activeSheet}" is empty.`);
  }

  // Detect header row
  const { headerRowIndex, columnMap, detectedHeaders } = detectHeaders(rawRows, BOOKS_FIELD_PATTERNS, 'Books');

  // Extract raw data rows starting from row after header
  const dataRows = [];
  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (row && row.length > 0) {
      dataRows.push(row);
    }
  }

  // Consolidate item-level records into unique invoice-level records
  const invoices = consolidateBooksInvoices(dataRows, columnMap);

  if (invoices.length === 0) {
    throw new Error(`No valid purchase invoices found in Books worksheet "${activeSheet}". Please verify the file content.`);
  }

  return {
    invoices,
    sheetNames,
    activeSheet,
    headerRowIndex,
    columnMap,
    detectedHeaders,
    totalRowsRead: dataRows.length
  };
}

import assert from 'node:assert';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import { standardiseInvoiceNumber, isValidInvoiceNumber } from '../src/utils/dataStandardisation.js';
import { detectHeaders, GSTR2B_FIELD_PATTERNS, BOOKS_FIELD_PATTERNS } from '../src/utils/headerDetection.js';
import { consolidateBooksInvoices } from '../src/utils/invoiceConsolidation.js';
import { parseGSTR2BWorkbook, parseBooksWorkbook } from '../src/utils/excelParser.js';
import { reconcileInvoices } from '../src/utils/reconciliation.js';
import { exportReconciliationExcel, buildReconciliationWorkbook } from '../src/utils/excelExport.js';

console.log('--- Starting GSTR-2B Reconciliation Unit & Integration Tests ---');

// 1. Standardisation Tests
console.log('\n[Test 1] Invoice Number Standardisation');
assert.strictEqual(standardiseInvoiceNumber(' inv-1024/24-25 '), 'INV-1024/24-25');
assert.strictEqual(standardiseInvoiceNumber('abc   123 / xy-01'), 'ABC 123 / XY-01');
assert.strictEqual(standardiseInvoiceNumber('00123/2025'), '00123/2025'); // Preserves leading zeros
assert.strictEqual(standardiseInvoiceNumber('0'), ''); // Ignored
assert.strictEqual(standardiseInvoiceNumber('000'), ''); // Ignored
assert.strictEqual(standardiseInvoiceNumber(''), ''); // Ignored
assert.strictEqual(standardiseInvoiceNumber(null), '');
assert.strictEqual(standardiseInvoiceNumber(undefined), '');
assert.strictEqual(isValidInvoiceNumber('0'), false);
assert.strictEqual(isValidInvoiceNumber('INV-01'), true);
console.log('✓ Standardisation tests passed.');

// 2. Multi-item Consolidation Tests
console.log('\n[Test 2] Books Item-Wise Record Consolidation');
const mockBooksData = [
  // Row 1: Header (simulated)
  // Row 2-4: 3 items for INV001
  ['1', 'Vendor A', 'INV001', '01-07-2025', '1500', '500', 'Paid', 'Bill', 'Product A'],
  ['2', 'Vendor A', 'INV001', '01-07-2025', '1500', '700', 'Paid', 'Bill', 'Product B'],
  ['3', 'Vendor A', 'INV001', '01-07-2025', '1500', '300', 'Paid', 'Bill', 'Product C'],
  // Row 5: Draft status - should be excluded
  ['4', 'Vendor B', 'INV002', '02-07-2025', '2000', '2000', 'Draft', 'Bill', 'Product D'],
  // Row 6: Void status - should be excluded
  ['5', 'Vendor C', 'INV003', '03-07-2025', '1000', '1000', 'Void', 'Bill', 'Product E'],
  // Row 7: Valid invoice with zero/blank Transaction# - should be ignored
  ['6', 'Vendor D', '0', '04-07-2025', '500', '500', 'Paid', 'Bill', 'Product F'],
  // Row 8: Valid invoice INV004
  ['7', 'Vendor E', 'INV004', '05-07-2025', '3500', '3500', 'Overdue', 'Bill', 'Product G']
];

const mockBooksColMap = {
  vendorName: 1,
  transactionNumber: 2,
  date: 3,
  billAmount: 4,
  itemAmount: 5,
  status: 6,
  transactionType: 7,
  itemName: 8
};

const consolidated = consolidateBooksInvoices(mockBooksData, mockBooksColMap);
console.log('Consolidated invoices count:', consolidated.length);
assert.strictEqual(consolidated.length, 2, 'Should only consolidate 2 valid invoices (INV001 and INV004)');

const inv001 = consolidated.find(c => c.cleanInvoiceNumber === 'INV001');
assert(inv001, 'INV001 must exist');
assert.strictEqual(inv001.items.length, 3, 'INV001 should retain all 3 product line items');
assert.strictEqual(inv001.billAmount, 1500, 'Bill Amount should be 1500 and not 4500 (not blindly summed)');
console.log('✓ Multi-item consolidation tests passed.');

// 3. Integration Test with Sample Files
console.log('\n[Test 3] End-to-End Test with Real Sample Datasets');
const gstrFileBuf = fs.readFileSync('public/sample-files/sample_gstr2b.xlsx');
const booksFileBuf = fs.readFileSync('public/sample-files/sample_books.xlsx');

const gstrWb = XLSX.read(gstrFileBuf, { type: 'buffer', cellDates: true });
const booksWb = XLSX.read(booksFileBuf, { type: 'buffer', cellDates: true });

const parsedGstr = parseGSTR2BWorkbook(gstrWb);
const parsedBooks = parseBooksWorkbook(booksWb);

console.log('Parsed GSTR-2B unique invoices:', parsedGstr.invoices.length);
console.log('Parsed Books unique invoices:', parsedBooks.invoices.length);

assert(parsedGstr.invoices.length > 0, 'GSTR-2B invoices must be > 0');
assert(parsedBooks.invoices.length > 0, 'Books invoices must be > 0');

const reconResult = reconcileInvoices(parsedGstr.invoices, parsedBooks.invoices);
const { summary } = reconResult;

console.log('Reconciliation Summary:');
console.log('  Total GSTR-2B Invoices:', summary.totalGstrCount);
console.log('  Total Books Invoices:  ', summary.totalBooksCount);
console.log('  Present in Both:       ', summary.presentInBothCount);
console.log('  Only in Books:         ', summary.onlyInBooksCount);
console.log('  Only in GSTR-2B:       ', summary.onlyInGstrCount);
console.log('  Validation Status:     ', summary.isValid);

// Verify exact mathematical laws
assert.strictEqual(summary.isValid, true, 'Validation check must pass');
assert.strictEqual(
  summary.presentInBothCount + summary.onlyInBooksCount,
  summary.totalBooksCount,
  'Present in Both + Only in Books must equal Total Books Invoices'
);
assert.strictEqual(
  summary.presentInBothCount + summary.onlyInGstrCount,
  summary.totalGstrCount,
  'Present in Both + Only in GSTR-2B must equal Total GSTR-2B Invoices'
);
console.log('✓ Mathematical identity checks passed.');

// 4. Excel Export Test
console.log('\n[Test 4] Excel Export Workbook Generation');
const exportedWb = buildReconciliationWorkbook(reconResult);
console.log('Exported sheets:', exportedWb.SheetNames);
assert.deepStrictEqual(
  exportedWb.SheetNames,
  ['Reconciliation Summary', 'Present in Both', 'Only in Books', 'Only in GSTR-2B'],
  'Must contain all 4 required worksheets'
);

const outBuf = XLSX.write(exportedWb, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync('test_export_output.xlsx', outBuf);
assert(fs.existsSync('test_export_output.xlsx'), 'Exported file must exist on disk');

const reReadWb = XLSX.read(fs.readFileSync('test_export_output.xlsx'), { type: 'buffer' });
assert.strictEqual(reReadWb.SheetNames.length, 4);
fs.unlinkSync('test_export_output.xlsx');
console.log('✓ Excel export tests passed.');

console.log('\n ALL TESTS PASSED SUCCESSFULLY! ');

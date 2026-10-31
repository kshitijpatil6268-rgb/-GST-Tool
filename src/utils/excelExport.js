import * as XLSX from 'xlsx';
import { formatDisplayDate } from './dataStandardisation.js';

/**
 * Builds the SheetJS workbook containing the 4 required reconciliation sheets.
 *
 * @param {Object} reconciliationResult
 * @returns {XLSX.WorkBook}
 */
export function buildReconciliationWorkbook(reconciliationResult) {
  if (!reconciliationResult || !reconciliationResult.summary) {
    throw new Error('No reconciliation data available to export.');
  }

  const { summary, presentInBoth, onlyInBooks, onlyInGstr } = reconciliationResult;
  const wb = XLSX.utils.book_new();

  // 1. Reconciliation Summary Sheet
  const summaryRows = [
    ['GSTR-2B RECONCILIATION SUMMARY REPORT'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Particulars', 'Invoice Count', 'Remarks'],
    ['Total Invoices in GSTR-2B', summary.totalGstrCount, 'Unique invoices extracted from GSTR-2B file'],
    ['Total Invoices in Books', summary.totalBooksCount, 'Unique invoices extracted from Books file'],
    ['Present in Both', summary.presentInBothCount, 'Matching invoices found in both datasets'],
    ['Only in Books', summary.onlyInBooksCount, 'Recorded in Books but missing in GSTR-2B'],
    ['Only in GSTR-2B', summary.onlyInGstrCount, 'Available in GSTR-2B but missing in Books'],
    [''],
    ['Validation Status:', summary.isValid ? 'VALIDATED (All counts balance perfectly)' : 'COUNT MISMATCH'],
    ['Check 1 (Books):', `${summary.presentInBothCount} + ${summary.onlyInBooksCount} = ${summary.presentInBothCount + summary.onlyInBooksCount} (Total Books: ${summary.totalBooksCount})`],
    ['Check 2 (GSTR-2B):', `${summary.presentInBothCount} + ${summary.onlyInGstrCount} = ${summary.presentInBothCount + summary.onlyInGstrCount} (Total GSTR-2B: ${summary.totalGstrCount})`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Reconciliation Summary');

  // 2. Present in Both Sheet
  const bothHeader = [
    'Invoice Number',
    'Supplier GSTIN (GSTR-2B)',
    'Supplier Name (GSTR-2B)',
    'Vendor Name (Books)',
    'Invoice Date (GSTR-2B)',
    'Invoice Date (Books)',
    'Invoice Value (GSTR-2B)',
    'Bill Amount (Books)'
  ];

  const bothData = presentInBoth.map((row) => [
    row.invoiceNumber,
    row.supplierGstin || '-',
    row.supplierName || '-',
    row.vendorName || '-',
    formatDisplayDate(row.gstrInvoiceDate),
    formatDisplayDate(row.booksInvoiceDate),
    row.gstrInvoiceValue ?? 0,
    row.booksBillAmount ?? 0
  ]);

  const wsBoth = XLSX.utils.aoa_to_sheet([bothHeader, ...bothData]);
  wsBoth['!cols'] = [
    { wch: 22 },
    { wch: 20 },
    { wch: 35 },
    { wch: 35 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsBoth, 'Present in Both');

  // 3. Only in Books Sheet
  const booksHeader = [
    'Transaction Number',
    'Vendor Name',
    'Invoice Date',
    'Transaction Type',
    'Bill Amount'
  ];

  const booksData = onlyInBooks.map((row) => [
    row.originalInvoiceNumber || row.cleanInvoiceNumber,
    row.vendorName || '-',
    formatDisplayDate(row.date),
    row.transactionType || '-',
    row.billAmount ?? 0
  ]);

  const wsBooks = XLSX.utils.aoa_to_sheet([booksHeader, ...booksData]);
  wsBooks['!cols'] = [
    { wch: 24 },
    { wch: 38 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsBooks, 'Only in Books');

  // 4. Only in GSTR-2B Sheet
  const gstrHeader = [
    'Invoice Number',
    'Supplier GSTIN',
    'Supplier Name',
    'Invoice Date',
    'Invoice Type',
    'Invoice Value'
  ];

  const gstrData = onlyInGstr.map((row) => [
    row.originalInvoiceNumber || row.cleanInvoiceNumber,
    row.supplierGstin || '-',
    row.supplierName || '-',
    formatDisplayDate(row.invoiceDate),
    row.invoiceType || 'Regular',
    row.invoiceValue ?? 0
  ]);

  const wsGstr = XLSX.utils.aoa_to_sheet([gstrHeader, ...gstrData]);
  wsGstr['!cols'] = [
    { wch: 24 },
    { wch: 20 },
    { wch: 38 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsGstr, 'Only in GSTR-2B');

  return wb;
}

/**
 * Generates and triggers download of the Reconciliation Excel Workbook in browser or node.
 *
 * @param {Object} reconciliationResult
 * @param {string} [fileName]
 */
export function exportReconciliationExcel(reconciliationResult, fileName = 'GSTR-2B_Reconciliation_Report.xlsx') {
  const wb = buildReconciliationWorkbook(reconciliationResult);

  // Check if browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Generate buffer and trigger browser download via blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } else {
    // Node environment fallback for automated testing
    try {
      const fs = require('fs');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      fs.writeFileSync(fileName, buf);
    } catch {
      // Dynamic import or ignore if fs not required
    }
  }

  return wb;
}

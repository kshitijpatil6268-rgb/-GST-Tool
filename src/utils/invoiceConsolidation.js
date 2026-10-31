import { standardiseInvoiceNumber, parseCurrencyAmount } from './dataStandardisation.js';

/**
 * Consolidates item-level Books purchase records into unique invoice-level records.
 *
 * Rules:
 * 1. Exclude records with blank or zero Transaction#.
 * 2. If Status exists, exclude rows with Status 'Draft', 'Void', or 'Deleted'.
 * 3. Group all rows sharing the same standardised Transaction#.
 * 4. The same invoice number does not inflate the count (1 unique invoice per standardised Transaction#).
 * 5. Bill Amount: Do NOT sum the bill amount across rows if the invoice total is already repeated on each line.
 *    Take the consistent bill amount, or if 0, sum the item amounts.
 * 6. Retain all original item records for drill-down / reference.
 *
 * @param {Array<Object>} rawRows - Array of row objects parsed from Books Excel
 * @param {Object} columnMap - Mapped column indices
 * @returns {Array<Object>} Consolidated invoice records
 */
export function consolidateBooksInvoices(rawRows, columnMap) {
  const invoiceGroups = new Map();

  for (let rowIndex = 0; rowIndex < rawRows.length; rowIndex++) {
    const row = rawRows[rowIndex];

    // Status check
    if (columnMap.status !== undefined) {
      const statusVal = String(row[columnMap.status] || '').trim().toLowerCase();
      if (statusVal === 'draft' || statusVal === 'void' || statusVal === 'deleted') {
        continue; // Skip excluded statuses
      }
    }

    const rawTx = row[columnMap.transactionNumber];
    const stdTx = standardiseInvoiceNumber(rawTx);

    // Skip empty or zero invoice numbers
    if (!stdTx) {
      continue;
    }

    const vendorName = columnMap.vendorName !== undefined ? String(row[columnMap.vendorName] || '').trim() : '';
    const date = columnMap.date !== undefined ? row[columnMap.date] : '';
    const transactionType = columnMap.transactionType !== undefined ? String(row[columnMap.transactionType] || '').trim() : '';
    const rawBillAmount = columnMap.billAmount !== undefined ? row[columnMap.billAmount] : 0;
    const rawItemAmount = columnMap.itemAmount !== undefined ? row[columnMap.itemAmount] : 0;
    const itemName = columnMap.itemName !== undefined ? String(row[columnMap.itemName] || '').trim() : '';
    const sgstAmount = columnMap.sgstAmount !== undefined ? parseCurrencyAmount(row[columnMap.sgstAmount]) : 0;
    const cgstAmount = columnMap.cgstAmount !== undefined ? parseCurrencyAmount(row[columnMap.cgstAmount]) : 0;
    const igstAmount = columnMap.igstAmount !== undefined ? parseCurrencyAmount(row[columnMap.igstAmount]) : 0;

    const itemAmount = parseCurrencyAmount(rawItemAmount);
    const parsedBillAmount = parseCurrencyAmount(rawBillAmount);

    const itemDetail = {
      itemName,
      itemAmount,
      rawItemAmount,
      sgstAmount,
      cgstAmount,
      igstAmount,
      rowIndex
    };

    if (!invoiceGroups.has(stdTx)) {
      invoiceGroups.set(stdTx, {
        cleanInvoiceNumber: stdTx,
        originalInvoiceNumber: String(rawTx).trim(),
        vendorName,
        date,
        transactionType,
        billAmount: parsedBillAmount,
        rawBillAmount,
        totalItemAmount: itemAmount,
        items: [itemDetail],
        rawRows: [row]
      });
    } else {
      const group = invoiceGroups.get(stdTx);
      group.items.push(itemDetail);
      group.rawRows.push(row);
      group.totalItemAmount += itemAmount;

      // If existing bill amount was 0 or empty and current has a value, fill it
      if ((!group.billAmount || group.billAmount === 0) && parsedBillAmount > 0) {
        group.billAmount = parsedBillAmount;
        group.rawBillAmount = rawBillAmount;
      }
      // If vendorName or date was empty, fill it from later row
      if (!group.vendorName && vendorName) group.vendorName = vendorName;
      if (!group.date && date) group.date = date;
      if (!group.transactionType && transactionType) group.transactionType = transactionType;
    }
  }

  // Final check: if bill amount is still 0 but sum of items > 0, fallback to totalItemAmount
  const consolidated = [];
  for (const group of invoiceGroups.values()) {
    if ((!group.billAmount || group.billAmount === 0) && group.totalItemAmount > 0) {
      group.billAmount = group.totalItemAmount;
    }
    consolidated.push(group);
  }

  return consolidated;
}

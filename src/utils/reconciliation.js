/**
 * Invoice Reconciliation Engine (Version 1.0)
 *
 * Strict comparison on standardised Invoice Number only.
 * Categories:
 * 1. Present in Both: GSTR-2B ∩ Books
 * 2. Only in Books: Books − GSTR-2B
 * 3. Only in GSTR-2B: GSTR-2B − Books
 *
 * Validations:
 * Present in Both + Only in Books === Total Books Invoices
 * Present in Both + Only in GSTR-2B === Total GSTR-2B Invoices
 */

/**
 * Reconciles GSTR-2B invoice records against Books invoice records.
 *
 * @param {Array<Object>} gstrInvoices - Array of unique GSTR-2B invoice objects
 * @param {Array<Object>} booksInvoices - Array of unique Books invoice objects
 * @returns {{
 *   summary: {
 *     totalGstrCount: number,
 *     totalBooksCount: number,
 *     presentInBothCount: number,
 *     onlyInBooksCount: number,
 *     onlyInGstrCount: number,
 *     isValid: boolean,
 *     validationMessage: string
 *   },
 *   presentInBoth: Array<Object>,
 *   onlyInBooks: Array<Object>,
 *   onlyInGstr: Array<Object>,
 *   totalGstr: Array<Object>,
 *   totalBooks: Array<Object>
 * }}
 */
export function reconcileInvoices(gstrInvoices, booksInvoices) {
  // Build lookup map for Books
  const booksMap = new Map();
  for (const bInv of booksInvoices) {
    if (!booksMap.has(bInv.cleanInvoiceNumber)) {
      booksMap.set(bInv.cleanInvoiceNumber, bInv);
    }
  }

  // Build lookup map for GSTR-2B
  const gstrMap = new Map();
  for (const gInv of gstrInvoices) {
    if (!gstrMap.has(gInv.cleanInvoiceNumber)) {
      gstrMap.set(gInv.cleanInvoiceNumber, gInv);
    }
  }

  const presentInBoth = [];
  const onlyInGstr = [];
  const onlyInBooks = [];

  // Match GSTR invoices against Books
  for (const [key, gInv] of gstrMap.entries()) {
    if (booksMap.has(key)) {
      const bInv = booksMap.get(key);
      presentInBoth.push({
        cleanInvoiceNumber: key,
        invoiceNumber: gInv.originalInvoiceNumber || bInv.originalInvoiceNumber || key,
        supplierGstin: gInv.supplierGstin || '-',
        supplierName: gInv.supplierName || '-',
        vendorName: bInv.vendorName || '-',
        gstrInvoiceDate: gInv.invoiceDate,
        booksInvoiceDate: bInv.date,
        gstrInvoiceValue: gInv.invoiceValue,
        booksBillAmount: bInv.billAmount,
        gstrRecord: gInv,
        booksRecord: bInv
      });
    } else {
      onlyInGstr.push(gInv);
    }
  }

  // Find invoices only in Books
  for (const [key, bInv] of booksMap.entries()) {
    if (!gstrMap.has(key)) {
      onlyInBooks.push(bInv);
    }
  }

  const totalGstrCount = gstrMap.size;
  const totalBooksCount = booksMap.size;
  const presentInBothCount = presentInBoth.length;
  const onlyInBooksCount = onlyInBooks.length;
  const onlyInGstrCount = onlyInGstr.length;

  // Mathematical validations
  const booksSumCheck = presentInBothCount + onlyInBooksCount;
  const gstrSumCheck = presentInBothCount + onlyInGstrCount;

  let isValid = true;
  let validationMessage = "Reconciliation verification passed.";

  if (booksSumCheck !== totalBooksCount) {
    isValid = false;
    validationMessage = `Books invoice count mismatch: Present in Both (${presentInBothCount}) + Only in Books (${onlyInBooksCount}) = ${booksSumCheck}, but Total Books is ${totalBooksCount}.`;
  } else if (gstrSumCheck !== totalGstrCount) {
    isValid = false;
    validationMessage = `GSTR-2B invoice count mismatch: Present in Both (${presentInBothCount}) + Only in GSTR-2B (${onlyInGstrCount}) = ${gstrSumCheck}, but Total GSTR-2B is ${totalGstrCount}.`;
  }

  return {
    summary: {
      totalGstrCount,
      totalBooksCount,
      presentInBothCount,
      onlyInBooksCount,
      onlyInGstrCount,
      isValid,
      validationMessage
    },
    presentInBoth,
    onlyInBooks,
    onlyInGstr,
    totalGstr: Array.from(gstrMap.values()),
    totalBooks: Array.from(booksMap.values())
  };
}


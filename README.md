# GSTR-2B Reconciliation Web Application (Version 1.0)

A web-based GSTR-2B Reconciliation Application built with **React**, **Vite**, **Tailwind CSS**, and **SheetJS**. It runs 100% in the browser with zero backend data transmission.

## Features

- **Independent Dual Upload**:
  - **GSTR-2B Data**: Supports `.xlsx` and `.xls`, detects B2B worksheets, dynamically resolves multi-row headers and column variations.
  - **Books (Payable Details)**: Supports `.xlsx` and `.xls`, detects item-wise records, excludes draft/void/deleted statuses, and accurately consolidates multi-item entries into single invoice records without inflating invoice counts or duplicating bill amounts.
- **Invoice Number Standardisation**:
  - Uppercase conversion, leading/trailing space trimming, normalised internal spacing.
  - Preserves hyphens, slashes, special characters, and leading zeros.
  - Filters out blank and zero-only invoice numbers.
- **Dynamic Reconciliation Engine**:
  - **Present in Both**: Matching unique invoice numbers in both GSTR-2B and Books.
  - **Only in Books**: Invoices recorded in books but not present in GSTR-2B.
  - **Only in GSTR-2B**: Invoices available in GSTR-2B but not found in books.
- **Mathematical Integrity Verification**:
  - Automatically verifies `Present in Both + Only in Books === Total Books Invoices`
  - Automatically verifies `Present in Both + Only in GSTR-2B === Total GSTR-2B Invoices`
- **Interactive Dashboard**:
  - 5 interactive summary cards (Total GSTR-2B, Total Books, Present in Both, Only in Books, Only in GSTR-2B).
  - Clicking any card dynamically updates the invoice details table below.
  - Full-text search by invoice number, vendor name, or GSTIN.
  - Client-side pagination (10, 25, 50, 100 rows per page).
  - Expandable drill-down into item-level breakdown for consolidated book invoices.
- **Excel Export**:
  - Generates a multi-sheet `.xlsx` report containing:
    1. *Reconciliation Summary*
    2. *Present in Both*
    3. *Only in Books*
    4. *Only in GSTR-2B*
- **Sample Files Included**:
  - Sample test files (`sample_gstr2b.xlsx` and `sample_books.xlsx`) can be loaded with 1-click via the "Load Sample Files" button on the dashboard for instant demonstration.

## Running the Application

### Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000` (or the URL printed in the terminal).

### Run Test Suite
```bash
npm test
```

### Production Build
```bash
npm run build
```


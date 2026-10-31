import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDisplayDate, formatCurrency } from '../utils/dataStandardisation.js';

export default function InvoiceDetailsTable({
  activeCategory,
  reconciliationResult,
  onExportExcel
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowKey, setExpandedRowKey] = useState(null);

  // Configuration for each category
  const categoryConfig = useMemo(() => {
    switch (activeCategory) {
      case 'TOTAL_GSTR':
        return {
          title: 'Total Invoices in GSTR-2B',
          description: 'All unique invoice records extracted from the GSTR-2B worksheet',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          data: reconciliationResult.totalGstr || [],
          columns: [
            { key: 'invoiceNumber', label: 'Invoice Number', primary: true },
            { key: 'supplierGstin', label: 'Supplier GSTIN' },
            { key: 'supplierName', label: 'Supplier Name' },
            { key: 'invoiceDate', label: 'Invoice Date', isDate: true },
            { key: 'invoiceType', label: 'Invoice Type' },
            { key: 'invoiceValue', label: 'Invoice Value', isCurrency: true, alignRight: true }
          ]
        };

      case 'TOTAL_BOOKS':
        return {
          title: 'Total Invoices in Books (Payable Details)',
          description: 'All unique consolidated purchase invoice records extracted from company books',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          data: reconciliationResult.totalBooks || [],
          columns: [
            { key: 'transactionNumber', label: 'Transaction Number', primary: true },
            { key: 'vendorName', label: 'Vendor Name' },
            { key: 'date', label: 'Invoice Date', isDate: true },
            { key: 'transactionType', label: 'Transaction Type' },
            { key: 'billAmount', label: 'Bill Amount', isCurrency: true, alignRight: true }
          ]
        };

      case 'PRESENT_IN_BOTH':
        return {
          title: 'Present in Both (Matched Invoices)',
          description: 'Invoices whose invoice numbers appear in both GSTR-2B and Books',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          data: reconciliationResult.presentInBoth || [],
          columns: [
            { key: 'invoiceNumber', label: 'Invoice Number', primary: true },
            { key: 'supplierGstin', label: 'Supplier GSTIN (2B)' },
            { key: 'supplierName', label: 'Supplier Name (2B)' },
            { key: 'vendorName', label: 'Vendor Name (Books)' },
            { key: 'gstrInvoiceDate', label: '2B Inv Date', isDate: true },
            { key: 'booksInvoiceDate', label: 'Books Date', isDate: true },
            { key: 'gstrInvoiceValue', label: '2B Value', isCurrency: true, alignRight: true },
            { key: 'booksBillAmount', label: 'Books Amount', isCurrency: true, alignRight: true }
          ]
        };

      case 'ONLY_IN_BOOKS':
        return {
          title: 'Only in Books (Missing in GSTR-2B)',
          description: 'Purchase invoices recorded in company books but not found in GSTR-2B',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          data: reconciliationResult.onlyInBooks || [],
          columns: [
            { key: 'transactionNumber', label: 'Transaction Number', primary: true },
            { key: 'vendorName', label: 'Vendor Name' },
            { key: 'date', label: 'Invoice Date', isDate: true },
            { key: 'transactionType', label: 'Transaction Type' },
            { key: 'billAmount', label: 'Bill Amount', isCurrency: true, alignRight: true }
          ]
        };

      case 'ONLY_IN_GSTR':
        return {
          title: 'Only in GSTR-2B (Missing in Books)',
          description: 'Invoices available in GSTR-2B but not recorded in company books',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
          data: reconciliationResult.onlyInGstr || [],
          columns: [
            { key: 'invoiceNumber', label: 'Invoice Number', primary: true },
            { key: 'supplierGstin', label: 'Supplier GSTIN' },
            { key: 'supplierName', label: 'Supplier Name' },
            { key: 'invoiceDate', label: 'Invoice Date', isDate: true },
            { key: 'invoiceValue', label: 'Invoice Value', isCurrency: true, alignRight: true }
          ]
        };

      default:
        return {
          title: 'Invoice Details',
          description: '',
          badgeColor: 'bg-slate-100 text-slate-800',
          data: [],
          columns: []
        };
    }
  }, [activeCategory, reconciliationResult]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return categoryConfig.data;

    const term = searchTerm.toLowerCase().trim();
    return categoryConfig.data.filter((item) => {
      // Check invoice number
      const invNum = (item.originalInvoiceNumber || item.invoiceNumber || item.cleanInvoiceNumber || '').toLowerCase();
      if (invNum.includes(term)) return true;

      // Check vendor / supplier name
      const vendor = (item.vendorName || item.supplierName || '').toLowerCase();
      if (vendor.includes(term)) return true;

      // Check GSTIN
      const gstin = (item.supplierGstin || '').toLowerCase();
      if (gstin.includes(term)) return true;

      return false;
    });
  }, [categoryConfig.data, searchTerm]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, validCurrentPage, pageSize]);

  // Reset page when category or search changes
  React.useEffect(() => {
    setCurrentPage(1);
    setExpandedRowKey(null);
  }, [activeCategory, searchTerm, pageSize]);

  // Render cell value helper
  const renderCellContent = (col, item) => {
    let rawVal = '';

    if (col.key === 'transactionNumber') {
      rawVal = item.originalInvoiceNumber || item.cleanInvoiceNumber;
    } else if (col.key === 'invoiceNumber') {
      rawVal = item.originalInvoiceNumber || item.invoiceNumber || item.cleanInvoiceNumber;
    } else {
      rawVal = item[col.key];
    }

    if (col.isDate) {
      return (
        <span className="font-mono text-xs text-slate-600">
          {formatDisplayDate(rawVal)}
        </span>
      );
    }

    if (col.isCurrency) {
      return (
        <span className="font-mono font-medium text-slate-900">
          {formatCurrency(rawVal)}
        </span>
      );
    }

    if (col.primary) {
      return (
        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {rawVal || '-'}
        </span>
      );
    }

    return <span className="text-slate-700">{rawVal || '-'}</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Section */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-slate-900">
              {categoryConfig.title}
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryConfig.badgeColor}`}
            >
              {totalItems.toLocaleString()} records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {categoryConfig.description}
          </p>
        </div>

        {/* Search and Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search invoice, vendor, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition hover:shadow cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export Reconciliation</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto min-h-[300px]">
        {paginatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No records found</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {searchTerm
                ? `No invoices match your search term "${searchTerm}".`
                : 'There are no invoices in this category.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                {categoryConfig.columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-3 px-4 whitespace-nowrap ${
                      col.alignRight ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
                {(activeCategory === 'TOTAL_BOOKS' || activeCategory === 'ONLY_IN_BOOKS') && (
                  <th className="py-3 px-4 w-20 text-center">Items</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {paginatedData.map((item, idx) => {
                const rowNum = (validCurrentPage - 1) * pageSize + idx + 1;
                const rowKey = item.cleanInvoiceNumber || `${validCurrentPage}-${idx}`;
                const isExpanded = expandedRowKey === rowKey;
                const hasItems = item.items && item.items.length > 1;

                return (
                  <React.Fragment key={rowKey}>
                    <tr className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {rowNum}
                      </td>
                      {categoryConfig.columns.map((col) => (
                        <td
                          key={col.key}
                          className={`py-3 px-4 whitespace-nowrap ${
                            col.alignRight ? 'text-right' : 'text-left'
                          }`}
                        >
                          {renderCellContent(col, item)}
                        </td>
                      ))}
                      {(activeCategory === 'TOTAL_BOOKS' || activeCategory === 'ONLY_IN_BOOKS') && (
                        <td className="py-3 px-4 text-center">
                          {hasItems ? (
                            <button
                              type="button"
                              onClick={() => setExpandedRowKey(isExpanded ? null : rowKey)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition"
                            >
                              <span>{item.items.length} items</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">1 item</span>
                          )}
                        </td>
                      )}
                    </tr>

                    {/* Expandable item-level view for consolidated Books records */}
                    {isExpanded && item.items && (
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <td colSpan={categoryConfig.columns.length + 2} className="p-4 pl-12">
                          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-blue-600" />
                              <span>Consolidated Item Breakdown ({item.items.length} records):</span>
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-[11px]">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-500 font-medium">
                                    <th className="py-1.5 px-3 text-left">Item Name</th>
                                    <th className="py-1.5 px-3 text-right">Item Amount</th>
                                    <th className="py-1.5 px-3 text-right">SGST</th>
                                    <th className="py-1.5 px-3 text-right">CGST</th>
                                    <th className="py-1.5 px-3 text-right">IGST</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {item.items.map((it, itIdx) => (
                                    <tr key={itIdx} className="hover:bg-slate-50">
                                      <td className="py-1 px-3 text-slate-800 font-medium">
                                        {it.itemName || '(No Description)'}
                                      </td>
                                      <td className="py-1 px-3 text-right font-mono">
                                        {formatCurrency(it.itemAmount)}
                                      </td>
                                      <td className="py-1 px-3 text-right font-mono text-slate-600">
                                        {formatCurrency(it.sgstAmount)}
                                      </td>
                                      <td className="py-1 px-3 text-right font-mono text-slate-600">
                                        {formatCurrency(it.cgstAmount)}
                                      </td>
                                      <td className="py-1 px-3 text-right font-mono text-slate-600">
                                        {formatCurrency(it.igstAmount)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-slate-300 rounded px-2 py-1 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-400">|</span>
          <span>
            Showing{' '}
            <strong className="text-slate-800">
              {totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800">
              {Math.min(validCurrentPage * pageSize, totalItems)}
            </strong>{' '}
            of <strong className="text-slate-800">{totalItems}</strong> entries
          </span>
        </div>

        {/* Page Nav */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            disabled={validCurrentPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={validCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-semibold text-slate-800">
            Page {validCurrentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={validCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={validCurrentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

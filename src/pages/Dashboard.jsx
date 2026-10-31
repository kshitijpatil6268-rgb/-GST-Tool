import React, { useState } from 'react';
import { ArrowRight, RefreshCw, Download, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Header from '../components/Header.jsx';
import FileUploadCard from '../components/FileUploadCard.jsx';
import ReconciliationSummary from '../components/ReconciliationSummary.jsx';
import InvoiceDetailsTable from '../components/InvoiceDetailsTable.jsx';
import { readWorkbook, parseGSTR2BWorkbook, parseBooksWorkbook } from '../utils/excelParser.js';
import { reconcileInvoices } from '../utils/reconciliation.js';
import { exportReconciliationExcel } from '../utils/excelExport.js';

export default function Dashboard() {
  // GSTR-2B State
  const [gstrFile, setGstrFile] = useState(null);
  const [gstrWorkbook, setGstrWorkbook] = useState(null);
  const [gstrData, setGstrData] = useState(null);
  const [gstrError, setGstrError] = useState(null);
  const [gstrLoading, setGstrLoading] = useState(false);

  // Books State
  const [booksFile, setBooksFile] = useState(null);
  const [booksWorkbook, setBooksWorkbook] = useState(null);
  const [booksData, setBooksData] = useState(null);
  const [booksError, setBooksError] = useState(null);
  const [booksLoading, setBooksLoading] = useState(false);

  // Reconciliation State
  const [reconciliationResult, setReconciliationResult] = useState(null);
  const [activeCategory, setActiveCategory] = useState('PRESENT_IN_BOTH');
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState(null);

  // Clear previous reconciliation when a file changes
  const clearReconciliation = () => {
    setReconciliationResult(null);
    setReconcileError(null);
  };

  // 1. Handle GSTR-2B File Selection
  const handleGstrFileSelect = async (file) => {
    setGstrFile(file);
    setGstrError(null);
    setGstrLoading(true);
    clearReconciliation();

    try {
      const wb = await readWorkbook(file);
      setGstrWorkbook(wb);
      const parsed = parseGSTR2BWorkbook(wb);
      setGstrData(parsed);
    } catch (err) {
      console.error(err);
      setGstrError(err.message || 'Failed to process GSTR-2B file.');
      setGstrData(null);
    } finally {
      setGstrLoading(false);
    }
  };

  // Handle GSTR-2B Sheet Change
  const handleGstrSheetChange = (sheetName) => {
    if (!gstrWorkbook) return;
    setGstrError(null);
    clearReconciliation();
    try {
      const parsed = parseGSTR2BWorkbook(gstrWorkbook, sheetName);
      setGstrData(parsed);
    } catch (err) {
      setGstrError(err.message);
      setGstrData(null);
    }
  };

  // 2. Handle Books File Selection
  const handleBooksFileSelect = async (file) => {
    setBooksFile(file);
    setBooksError(null);
    setBooksLoading(true);
    clearReconciliation();

    try {
      const wb = await readWorkbook(file);
      setBooksWorkbook(wb);
      const parsed = parseBooksWorkbook(wb);
      setBooksData(parsed);
    } catch (err) {
      console.error(err);
      setBooksError(err.message || 'Failed to process Books file.');
      setBooksData(null);
    } finally {
      setBooksLoading(false);
    }
  };

  // Handle Books Sheet Change
  const handleBooksSheetChange = (sheetName) => {
    if (!booksWorkbook) return;
    setBooksError(null);
    clearReconciliation();
    try {
      const parsed = parseBooksWorkbook(booksWorkbook, sheetName);
      setBooksData(parsed);
    } catch (err) {
      setBooksError(err.message);
      setBooksData(null);
    }
  };

  // 3. Start Reconciliation
  const handleStartReconciliation = () => {
    if (!gstrData || !booksData) {
      setReconcileError('Both GSTR-2B and Books files must be uploaded and parsed before reconciling.');
      return;
    }

    setIsReconciling(true);
    setReconcileError(null);

    try {
      const result = reconcileInvoices(gstrData.invoices, booksData.invoices);
      setReconciliationResult(result);
      setActiveCategory('PRESENT_IN_BOTH');
    } catch (err) {
      console.error(err);
      setReconcileError(`Reconciliation failed: ${err.message}`);
    } finally {
      setIsReconciling(false);
    }
  };

  // 4. Export Reconciliation Excel
  const handleExportExcel = () => {
    if (!reconciliationResult) return;
    try {
      exportReconciliationExcel(reconciliationResult);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  // 5. One-click Load Demo/Sample Data
  const handleLoadSampleData = async () => {
    try {
      setGstrLoading(true);
      setBooksLoading(true);
      clearReconciliation();

      // Fetch sample files from public directory
      const gstrResp = await fetch('/sample-files/sample_gstr2b.xlsx');
      const gstrBlob = await gstrResp.blob();
      const sampleGstrFile = new File([gstrBlob], 'sample_gstr2b.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const booksResp = await fetch('/sample-files/sample_books.xlsx');
      const booksBlob = await booksResp.blob();
      const sampleBooksFile = new File([booksBlob], 'sample_books.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      await handleGstrFileSelect(sampleGstrFile);
      await handleBooksFileSelect(sampleBooksFile);
    } catch (err) {
      console.error('Error loading sample data:', err);
      alert('Could not load sample files. Please select files manually.');
    } finally {
      setGstrLoading(false);
      setBooksLoading(false);
    }
  };

  const isReconcileReady = gstrData && booksData && !gstrError && !booksError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Control Bar: Upload Section Info & Sample Loader */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Excel Data Upload
            </h2>
            <p className="text-sm text-slate-500">
              Upload both independent Excel workbooks to begin automated invoice reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
              title="Load prepared sample datasets for quick testing"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Load Sample Files</span>
            </button>
          </div>
        </div>

        {/* Upload Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GSTR-2B Upload Card */}
          <FileUploadCard
            title="Upload GSTR-2B Data"
            subtitle="Government portal B2B invoice data"
            expectedSheet="B2B"
            file={gstrFile}
            parsedData={gstrData}
            error={gstrError}
            isLoading={gstrLoading}
            onFileSelect={handleGstrFileSelect}
            onSheetChange={handleGstrSheetChange}
          />

          {/* Books Upload Card */}
          <FileUploadCard
            title="Upload Books – Payable Details"
            subtitle="Internal accounting payable purchase records"
            expectedSheet="Payable Details"
            file={booksFile}
            parsedData={booksData}
            error={booksError}
            isLoading={booksLoading}
            onFileSelect={handleBooksFileSelect}
            onSheetChange={handleBooksSheetChange}
          />
        </div>

        {/* Reconciliation Action Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isReconcileReady ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {isReconcileReady
                  ? 'Both files processed successfully. Ready to reconcile!'
                  : 'Upload both GSTR-2B and Books Excel files to unlock reconciliation.'}
              </p>
              <p className="text-xs text-slate-500">
                {reconciliationResult
                  ? 'Reconciliation completed. You can click cards to inspect or export the Excel report.'
                  : 'Reconciliation strictly matches by standardised Invoice Number.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {reconciliationResult && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Export Excel</span>
              </button>
            )}

            <button
              type="button"
              disabled={!isReconcileReady || isReconciling}
              onClick={handleStartReconciliation}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-500/20 disabled:shadow-none transition duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              {isReconciling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Matching Invoices...</span>
                </>
              ) : (
                <>
                  <span>Start Reconciliation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {reconcileError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{reconcileError}</span>
          </div>
        )}

        {/* Reconciliation Results Section */}
        {reconciliationResult && (
          <div className="space-y-6 pt-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Reconciliation Dashboard
              </h2>
              <p className="text-sm text-slate-500">
                Click any summary card to filter and inspect detailed invoice records below.
              </p>
            </div>

            {/* Five Interactive Summary Cards */}
            <ReconciliationSummary
              summary={reconciliationResult.summary}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />

            {/* Detailed Records Table for Active Category */}
            <InvoiceDetailsTable
              activeCategory={activeCategory}
              reconciliationResult={reconciliationResult}
              onExportExcel={handleExportExcel}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>GSTR-2B Reconciliation System • Version 1.0 • Client-Side Secure Engine</p>
      </footer>
    </div>
  );
}

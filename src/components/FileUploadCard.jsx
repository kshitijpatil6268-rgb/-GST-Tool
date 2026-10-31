import React, { useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, RefreshCw, ChevronDown } from 'lucide-react';

export default function FileUploadCard({
  title,
  subtitle,
  expectedSheet,
  file,
  parsedData,
  error,
  isLoading,
  onFileSelect,
  onSheetChange,
  onReset
}) {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.toLowerCase();
      if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
        onFileSelect(droppedFile);
      } else {
        alert('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow transition duration-200 flex flex-col h-full overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <span>{title}</span>
            {parsedData && (
              <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Ready
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle} • Expected worksheet: <span className="font-mono text-slate-700 font-semibold">{expectedSheet}</span>
          </p>
        </div>

        {file && (
          <button
            type="button"
            onClick={triggerSelect}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-blue-50 border border-transparent hover:border-blue-200 transition"
            title="Replace current file"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Replace</span>
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={handleInputChange}
          className="hidden"
        />

        {!file ? (
          /* Dropzone */
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerSelect}
            className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-200 text-blue-600 flex items-center justify-center mb-3 transition">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700 group-hover:text-blue-700">
              Click to browse or drag and drop Excel file
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports .xlsx or .xls
            </p>
          </div>
        ) : (
          /* File Uploaded State */
          <div className="space-y-4">
            <div className="flex items-start justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-start space-x-3 overflow-hidden">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center justify-center space-x-2 py-4 text-sm text-slate-600">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Reading and parsing worksheet...</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <span className="font-semibold block">Validation Error:</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Successfully Processed Info & Sheet Selector */}
            {parsedData && !error && (
              <div className="space-y-3 pt-1">
                {/* Sheet Selector */}
                {parsedData.sheetNames && parsedData.sheetNames.length > 1 && (
                  <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-600 font-medium">Selected Sheet:</span>
                    <div className="relative">
                      <select
                        value={parsedData.activeSheet}
                        onChange={(e) => onSheetChange(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-300 rounded px-2.5 py-1 pr-6 font-medium text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        {parsedData.sheetNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-1.5 top-2 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Extraction Summary Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-slate-500 block">Unique Invoices</span>
                    <span className="text-base font-bold text-slate-800">
                      {parsedData.invoices?.length || 0}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-slate-500 block">Total Data Rows</span>
                    <span className="text-base font-bold text-slate-800">
                      {parsedData.totalRowsRead || 0}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Header Row: Line {parsedData.headerRowIndex + 1}</span>
                  <span className="text-emerald-600 font-medium">Ready for Reconciliation</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


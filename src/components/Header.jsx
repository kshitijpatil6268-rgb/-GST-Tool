import React from 'react';
import { Layers, ShieldCheck, FileSpreadsheet } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                  Kshitij Patil
                </span>
                <span className="text-slate-300">|</span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  GSTR-2B Reconciliation
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  v1.0
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Compare purchase invoices recorded in your books against invoices available in GSTR-2B.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Client-Side Processing</span>
            </div>
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-600">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Version 1.0 Strict Mode</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


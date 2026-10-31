import React from 'react';
import {
  FileSpreadsheet,
  BookOpen,
  CheckCircle2,
  FileQuestion,
  AlertOctagon,
  CheckCheck,
  AlertTriangle
} from 'lucide-react';
import SummaryCard from './SummaryCard';

export default function ReconciliationSummary({
  summary,
  activeCategory,
  onSelectCategory
}) {
  if (!summary) return null;

  const {
    totalGstrCount,
    totalBooksCount,
    presentInBothCount,
    onlyInBooksCount,
    onlyInGstrCount,
    isValid,
    validationMessage
  } = summary;

  const cards = [
    {
      id: 'TOTAL_GSTR',
      title: 'Total in GSTR-2B',
      count: totalGstrCount,
      description: 'All unique invoices from GSTR-2B',
      icon: FileSpreadsheet,
      variant: 'info'
    },
    {
      id: 'TOTAL_BOOKS',
      title: 'Total in Books',
      count: totalBooksCount,
      description: 'All unique invoices from Payable Details',
      icon: BookOpen,
      variant: 'default'
    },
    {
      id: 'PRESENT_IN_BOTH',
      title: 'Present in Both',
      count: presentInBothCount,
      description: 'Matching invoice numbers in both sets',
      icon: CheckCircle2,
      variant: 'matched'
    },
    {
      id: 'ONLY_IN_BOOKS',
      title: 'Only in Books',
      count: onlyInBooksCount,
      description: 'Recorded in Books, missing in GSTR-2B',
      icon: FileQuestion,
      variant: 'warning'
    },
    {
      id: 'ONLY_IN_GSTR',
      title: 'Only in GSTR-2B',
      count: onlyInGstrCount,
      description: 'Available in GSTR-2B, missing in Books',
      icon: AlertOctagon,
      variant: 'danger'
    }
  ];

  return (
    <div className="space-y-4">
      {/* 5 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <SummaryCard
            key={card.id}
            id={card.id}
            title={card.title}
            count={card.count}
            description={card.description}
            icon={card.icon}
            variant={card.variant}
            isActive={activeCategory === card.id}
            onClick={onSelectCategory}
          />
        ))}
      </div>

      {/* Mathematical Integrity Banner */}
      <div
        className={`px-4 py-3 rounded-xl border text-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
          isValid
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-red-50 border-red-200 text-red-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-semibold">
            {isValid ? 'Mathematical Integrity Verified:' : 'Reconciliation Discrepancy Detected:'}
          </span>
          <span className="text-slate-600">
            {validationMessage}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono shrink-0">
          <span className="bg-white/80 px-2.5 py-1 rounded border border-emerald-300/60 shadow-xs">
            Books: {presentInBothCount} + {onlyInBooksCount} = {presentInBothCount + onlyInBooksCount} ({totalBooksCount})
          </span>
          <span className="bg-white/80 px-2.5 py-1 rounded border border-emerald-300/60 shadow-xs">
            GSTR-2B: {presentInBothCount} + {onlyInGstrCount} = {presentInBothCount + onlyInGstrCount} ({totalGstrCount})
          </span>
        </div>
      </div>
    </div>
  );
}


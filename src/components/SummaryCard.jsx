import React from 'react';

export default function SummaryCard({
  id,
  title,
  count,
  description,
  icon: Icon,
  isActive,
  variant = 'default',
  onClick
}) {
  // Color themes for different categories
  const variants = {
    default: {
      activeBorder: 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40',
      inactiveBorder: 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60',
      countColor: 'text-slate-900',
      iconBg: 'bg-blue-100 text-blue-700',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    matched: {
      activeBorder: 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/40',
      inactiveBorder: 'border-emerald-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/30',
      countColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    warning: {
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40',
      inactiveBorder: 'border-amber-200 hover:border-amber-300 bg-white hover:bg-amber-50/30',
      countColor: 'text-amber-800',
      iconBg: 'bg-amber-100 text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    danger: {
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40',
      inactiveBorder: 'border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50/30',
      countColor: 'text-rose-700',
      iconBg: 'bg-rose-100 text-rose-700',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    info: {
      activeBorder: 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40',
      inactiveBorder: 'border-indigo-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/30',
      countColor: 'text-indigo-900',
      iconBg: 'bg-indigo-100 text-indigo-700',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }
  };

  const style = variants[variant] || variants.default;

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`relative w-full text-left p-5 rounded-xl border transition-all duration-150 cursor-pointer shadow-sm ${
        isActive ? `${style.activeBorder} shadow-md -translate-y-0.5` : style.inactiveBorder
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold tracking-tight ${style.countColor}`}>
              {count.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">invoices</span>
          </div>
        </div>

        <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500 truncate mr-2" title={description}>
          {description}
        </p>
        <span
          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border shrink-0 ${
            isActive ? style.badgeBg : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {isActive ? 'Viewing' : 'Click to View'}
        </span>
      </div>
    </button>
  );
}


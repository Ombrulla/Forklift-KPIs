import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  description?: string;
}

export default function KPICard({ title, value, icon, trend, trendUp, description }: KPICardProps) {
  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/50 z-0 hover:z-10">
      {/* Background with overflow hidden just for the circle */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl z-[-1]">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 blur-2xl transition-all group-hover:bg-blue-200"></div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 relative group/tooltip cursor-help">
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          {description && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-56 rounded-lg bg-slate-800 p-3 text-xs text-slate-200 shadow-xl z-50 leading-relaxed font-normal normal-case pointer-events-none transition-opacity duration-200">
                {description}
                <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </>
          )}
        </div>
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
          {icon}
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-md ${
            trendUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
          }`}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}

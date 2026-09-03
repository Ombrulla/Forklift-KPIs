"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle2, XCircle } from 'lucide-react';

export interface KPIItem {
  id: string;
  name: string;
  isActive: boolean;
}

interface KPIDropdownProps {
  kpis: KPIItem[];
  onSelectKPI: (id: string) => void;
}

export default function KPIDropdown({ kpis, onSelectKPI }: KPIDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 focus:outline-none"
      >
        KPI's
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg z-50">
          <div className="p-2 max-h-96 overflow-y-auto">
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Available KPIs</div>
            {kpis.filter(k => k.isActive).map(kpi => (
              <button
                key={kpi.id}
                onClick={() => { onSelectKPI(kpi.id); setIsOpen(false); }}
                className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50 text-slate-700"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="truncate">{kpi.name}</span>
              </button>
            ))}
            
            <div className="mt-4 mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Data</div>
            {kpis.filter(k => !k.isActive).map(kpi => (
              <button
                key={kpi.id}
                onClick={() => { onSelectKPI(kpi.id); setIsOpen(false); }}
                className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50 text-slate-500"
              >
                <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="truncate">{kpi.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

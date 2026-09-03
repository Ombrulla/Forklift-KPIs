import React from 'react';
import { Battery, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';

interface VehicleCardProps {
  id: string;
  utilization: number;
  batterySoc: number;
  idleRatio: number;
  safetyFlags: number;
}

export default function VehicleCard({
  id,
  utilization,
  batterySoc,
  idleRatio,
  safetyFlags,
}: VehicleCardProps) {
  let statusBadge = "Active";
  let statusColor = "bg-emerald-100 text-emerald-700";
  
  if (safetyFlags > 0 || batterySoc < 20) {
    statusBadge = "Attention";
    statusColor = "bg-rose-100 text-rose-700";
  } else if (idleRatio > 30) {
    statusBadge = "Idle-heavy";
    statusColor = "bg-amber-100 text-amber-700";
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-800">Forklift {id}</h3>
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColor}`}>
          {statusBadge}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm font-medium text-slate-600">
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Utilization</span>
          <span className="text-slate-900 font-bold">{utilization.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
          <div 
            className="bg-emerald-500 h-1.5 rounded-full" 
            style={{ width: `${Math.min(100, Math.max(0, utilization))}%` }}
          ></div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm font-medium text-slate-600 mt-2">
        <span className="flex items-center gap-2"><Battery className="w-4 h-4 text-slate-400" /> Battery SoC</span>
        <span className="text-slate-900 font-bold">{batterySoc.toFixed(0)}%</span>
      </div>

      <div className="flex justify-between items-center text-sm font-medium text-slate-600">
        <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Idle ratio</span>
        <span className="text-slate-900 font-bold">{idleRatio.toFixed(0)}%</span>
      </div>

      <div className="flex justify-between items-center text-sm font-medium text-slate-600 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-2">
          {safetyFlags > 0 ? <ShieldAlert className="w-4 h-4 text-rose-500" /> : <ShieldCheck className="w-4 h-4 text-slate-400" />} 
          Safety
        </span>
        {safetyFlags > 0 ? (
          <span className="text-rose-600 font-bold text-xs">{safetyFlags} handbrake misuses today</span>
        ) : (
          <span className="text-emerald-600 font-bold text-xs">No flags</span>
        )}
      </div>
    </div>
  );
}

"use client";

import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AnomalyTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="py-8 text-center text-slate-500">No AI inference logs available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th scope="col" className="px-6 py-3 font-medium">Date</th>
            <th scope="col" className="px-6 py-3 font-medium">Device ID</th>
            <th scope="col" className="px-6 py-3 font-medium">Status</th>
            <th scope="col" className="px-6 py-3 font-medium">Cluster</th>
            <th scope="col" className="px-6 py-3 font-medium">Idle Ratio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 border-t border-slate-100">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50 transition-colors">
              <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">{new Date(row.date).toLocaleDateString()}</td>
              <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.device_id.split("-")[0]}...</td>
              <td className="px-6 py-4">
                {row.is_anomaly ? (
                  <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md w-fit text-xs font-medium border border-rose-200">
                    <AlertTriangle className="h-3 w-3" /> Anomaly
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit text-xs font-medium border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Normal
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-slate-600">Cluster {row.usage_cluster}</td>
              <td className="px-6 py-4 text-slate-600">
                {(row.features_snapshot?.rolling_idle_ratio_7d * 100)?.toFixed(1) || 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function BarChartMisuse({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            tick={{fill: '#64748b', fontSize: 12}}
            tickFormatter={(val) => {
                if (!val) return "";
                const d = new Date(val);
                return `${d.getMonth()+1}/${d.getDate()}`;
            }}
          />
          <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Bar 
            dataKey="handbrake_misuse_sum" 
            name="Handbrake Misuse Events"
            fill="#ef4444" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function DashboardCharts({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-400">No telemetry data available</div>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorEngine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorHydraulic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
            itemStyle={{ color: '#334155' }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="engine_hours_sum" 
            name="Engine Hours"
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorEngine)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="hydraulic_usage_sum" 
            name="Hydraulic Hours"
            stroke="#8b5cf6" 
            fillOpacity={1} 
            fill="url(#colorHydraulic)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

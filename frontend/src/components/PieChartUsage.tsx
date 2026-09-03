"use client";

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#f97316'];

export default function PieChartUsage({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>;
  }

  // Aggregate totals
  const totalTraction = data.reduce((acc, curr) => acc + (curr.traction_usage_sum || 0), 0);
  const totalHydraulic = data.reduce((acc, curr) => acc + (curr.hydraulic_usage_sum || 0), 0);
  const totalEngine = data.reduce((acc, curr) => acc + (curr.engine_hours_sum || 0), 0);
  const avgIdle = data.reduce((acc, curr) => acc + (curr.idle_ratio || 0), 0) / data.length;
  const estimatedIdle = totalEngine * avgIdle;

  const pieData = [
    { name: 'Traction Hours', value: parseFloat(totalTraction.toFixed(1)) },
    { name: 'Hydraulic Hours', value: parseFloat(totalHydraulic.toFixed(1)) },
    { name: 'Estimated Idle', value: parseFloat(estimatedIdle.toFixed(1)) }
  ];

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

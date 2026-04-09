import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MetricsChartsProps {
  data: any[];
}

export function MetricsCharts({ data }: MetricsChartsProps) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="round" 
            stroke="#52525b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            label={{ value: 'Round', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#52525b' }}
          />
          <YAxis 
            stroke="#52525b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            domain={[0, 1]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }}
            itemStyle={{ padding: '2px 0' }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
          <Line 
            type="monotone" 
            dataKey="accuracy" 
            name="Accuracy"
            stroke="#2563eb" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            animationDuration={500}
          />
          <Line 
            type="monotone" 
            dataKey="loss" 
            name="Loss"
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

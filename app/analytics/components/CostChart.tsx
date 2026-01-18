'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface CostChartProps {
  data: {
    date: string
    cost: number
    calls: number
  }[]
}

export default function CostChart({ data }: CostChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Cost Trends</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">OpenAI Cost Trends</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#666', fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: '#666', fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'cost') {
                return [`$${value.toFixed(4)}`, 'Cost']
              }
              if (name === 'calls') {
                return [value, 'API Calls']
              }
              return [value, name]
            }}
          />
          <Line
            type="monotone"
            dataKey="cost"
            stroke="#9333ea"
            strokeWidth={2}
            dot={{ fill: '#9333ea', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}





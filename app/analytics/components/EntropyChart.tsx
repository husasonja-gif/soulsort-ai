'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface EntropyChartProps {
  data: { date: string; entropy: number; saturation: number }[]
}

export default function EntropyChart({ data }: EntropyChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500">No entropy data available</div>
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Entropy & Saturation Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="entropy" stroke="#9333ea" name="Entropy (std)" />
          <Line yAxisId="right" type="monotone" dataKey="saturation" stroke="#ec4899" name="Saturation %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}


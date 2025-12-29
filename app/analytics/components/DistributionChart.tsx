'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DistributionChartProps {
  distributions: Record<string, { bins: number[]; median: number; iqr: number; defaultClustering: number }>
  selectedDim?: string
  onDimChange?: (dim: string) => void
}

export default function DistributionChart({ distributions, selectedDim, onDimChange }: DistributionChartProps) {
  const dims = Object.keys(distributions)
  const currentDim = selectedDim || dims[0]
  const dist = distributions[currentDim]
  
  if (!dist) {
    return <div className="text-gray-500">No distribution data available</div>
  }
  
  const chartData = dist.bins.map((count, idx) => ({
    range: `${idx * 10}-${(idx + 1) * 10}`,
    count,
  }))
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="mb-4">
        {onDimChange && (
          <select
            value={currentDim}
            onChange={(e) => onDimChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {dims.map(dim => (
              <option key={dim} value={dim}>{dim}</option>
            ))}
          </select>
        )}
      </div>
      <div className="mb-2">
        <h3 className="text-lg font-semibold dark:text-gray-100">{currentDim} Distribution</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Median: {dist.median.toFixed(1)} | IQR: {dist.iqr.toFixed(1)} | Default Clustering: {(dist.defaultClustering * 100).toFixed(1)}%
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#9333ea" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


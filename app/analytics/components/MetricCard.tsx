'use client'

interface MetricCardProps {
  title: string
  value: string | number | null
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {title}
      </h3>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value ?? '—'}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
      {trend && (
        <div className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
        </div>
      )}
    </div>
  )
}






'use client'

interface EngagementChartProps {
  data: {
    dau: number
    mau: number
    stickiness: number
    avg_completion_time: number
  } | null | undefined
}

export default function EngagementChart({ data }: EngagementChartProps) {
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Engagement Metrics</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Engagement Metrics</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Daily Active Users</span>
          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.dau}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Monthly Active Users</span>
          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.mau}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Stickiness (DAU/MAU)</span>
          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.stickiness.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Avg Completion Time</span>
          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {data.avg_completion_time ? `${(data.avg_completion_time / 1000 / 60).toFixed(1)} min` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  )
}





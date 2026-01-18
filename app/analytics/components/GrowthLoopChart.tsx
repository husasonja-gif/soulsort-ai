'use client'

interface GrowthLoopChartProps {
  data: {
    shares: number
    signups: number
    conversion_rate: number
    avg_radars_per_requester: number
  } | null | undefined
}

export default function GrowthLoopChart({ data }: GrowthLoopChartProps) {
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Growth Loop Metrics</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Growth Loop Metrics</h2>
      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Total Shares</span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.shares}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Users sharing their radar links
          </div>
        </div>
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Signups from Shares</span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.signups}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            New users from shared links
          </div>
        </div>
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Share → Signup Rate</span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.conversion_rate.toFixed(1)}%</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Conversion from shares to signups
          </div>
        </div>
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Avg Radars/Requester</span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.avg_radars_per_requester.toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Average assessments per requester
          </div>
        </div>
      </div>
    </div>
  )
}





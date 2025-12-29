'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MetricCard from './components/MetricCard'
import FunnelChart from './components/FunnelChart'
import CostChart from './components/CostChart'
import EngagementChart from './components/EngagementChart'
import GrowthLoopChart from './components/GrowthLoopChart'

interface MetricsData {
  total_requesters: number
  completion_rate: number
  avg_cost: number
  dau: number
  funnel: {
    stage: string
    count: number
    conversion_rate: number
  }[]
  growth_loop: {
    shares: number
    signups: number
    conversion_rate: number
    avg_radars_per_requester: number
  }
  cost_trends: {
    date: string
    cost: number
    calls: number
  }[]
  engagement: {
    dau: number
    mau: number
    stickiness: number
    avg_completion_time: number
  }
}

export default function AnalyticsDashboard() {
  const router = useRouter()
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch metrics on mount and when date range changes
  // Middleware already protects this route, so we can directly fetch
  useEffect(() => {
    fetchMetrics(dateRange)
  }, [dateRange])

  const fetchMetrics = async (range: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/analytics/metrics?range=${range}`)
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - redirect to login (shouldn't happen due to middleware, but handle it)
          window.location.href = '/login?redirect=/analytics'
          return
        } else if (response.status === 403) {
          // Authenticated but not admin
          const errorData = await response.json().catch(() => ({}))
          console.error('Access denied details:', errorData)
          
          if (errorData.details) {
            const { userEmail, adminEmails, debug } = errorData.details
            setError(
              `Access denied. Your email "${userEmail}" is not in the admin list.\n\n` +
              `Admin emails configured: ${adminEmails || 'NOT SET'}\n\n` +
              `Debug info:\n` +
              `- Your email (lowercase): ${debug?.userEmailLower || userEmail}\n` +
              `- Admin emails (parsed): ${JSON.stringify(debug?.adminEmailsParsed || [])}\n\n` +
              `Please verify:\n` +
              `1. Your email matches exactly (case-insensitive)\n` +
              `2. ADMIN_EMAILS is set in Vercel environment variables\n` +
              `3. The variable is set for Production environment\n` +
              `4. You've redeployed after setting the variable`
            )
          } else {
            setError('Access denied. Admin access required. Please ensure your email is set in the ADMIN_EMAILS environment variable.')
          }
        } else {
          setError('Failed to fetch metrics')
        }
        return
      }
      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError('Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-300 mb-2">Access Denied</h2>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <div className="flex gap-4">
              <a
                href="/dashboard"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Go to Dashboard
              </a>
              <a
                href="/login"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium dark:text-gray-100"
              >
                Login with Different Account
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400">Analytics Dashboard</h1>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            Back to Dashboard
          </a>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Requesters"
            value={metrics?.total_requesters ?? 0}
            subtitle={`${dateRange} period`}
          />
          <MetricCard
            title="Completion Rate"
            value={metrics?.completion_rate ? `${metrics.completion_rate.toFixed(1)}%` : '0%'}
            subtitle="Started → Completed"
          />
          <MetricCard
            title="Avg Cost/Completion"
            value={metrics?.avg_cost ? `$${metrics.avg_cost.toFixed(4)}` : '$0.0000'}
            subtitle="OpenAI API costs"
          />
          <MetricCard
            title="Daily Active Users"
            value={metrics?.dau ?? 0}
            subtitle="Dashboard visits"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FunnelChart data={metrics?.funnel || []} />
          <GrowthLoopChart data={metrics?.growth_loop} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CostChart data={metrics?.cost_trends || []} />
          <EngagementChart data={metrics?.engagement} />
        </div>
      </div>
    </div>
  )
}


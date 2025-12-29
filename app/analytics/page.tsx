'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import MetricCard from './components/MetricCard'
import FunnelChart from './components/FunnelChart'
import CostChart from './components/CostChart'
import EngagementChart from './components/EngagementChart'
import GrowthLoopChart from './components/GrowthLoopChart'
import DistributionChart from './components/DistributionChart'
import EntropyChart from './components/EntropyChart'
import WordCountChart from './components/WordCountChart'
import ArchetypeTable from './components/ArchetypeTable'

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
  qc?: {
    total_profiles: number
    missing_answer_rate: number
    default_clustering_rate: number
    distributions: Record<string, { bins: number[]; median: number; iqr: number; defaultClustering: number }>
    entropy_saturation: { date: string; entropy: number; saturation: number }[]
    missing_wordcount: {
      missing_rate: { q1: number; q2: number; q3: number; q4: number }
      word_count_bins: Record<string, { '0': number; '1-5': number; '6-15': number; '16-30': number; '31+': number }>
    }
    archetypes: {
      signature: string
      count: number
      percentage: number
      median: { st: number; se: number; root: number; search: number; rel: number; ero: number; con: number }
    }[]
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
            <div className="text-red-700 dark:text-red-300 mb-4 whitespace-pre-line">{error}</div>
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
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            <a
              href="/dashboard"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Back to Dashboard
            </a>
          </div>
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
            title="Total Profiles"
            value={metrics?.qc?.total_profiles ?? metrics?.total_requesters ?? 0}
            subtitle={`${dateRange} period`}
          />
          <MetricCard
            title="Missing Answer Rate"
            value={metrics?.qc?.missing_answer_rate ? `${(metrics.qc.missing_answer_rate * 100).toFixed(1)}%` : '0%'}
            subtitle="QC: Missing answers"
          />
          <MetricCard
            title="Default Clustering"
            value={metrics?.qc?.default_clustering_rate ? `${(metrics.qc.default_clustering_rate * 100).toFixed(1)}%` : '0%'}
            subtitle="% in 45-55 band"
          />
          <MetricCard
            title="Avg Cost/Profile"
            value={metrics?.avg_cost ? `$${metrics.avg_cost.toFixed(4)}` : '$0.0000'}
            subtitle="OpenAI API costs"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FunnelChart data={metrics?.funnel || []} />
          <GrowthLoopChart data={metrics?.growth_loop} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CostChart data={metrics?.cost_trends || []} />
          <EngagementChart data={metrics?.engagement} />
        </div>

        {/* QC Analytics Panels */}
        {metrics?.qc && (
          <>
            {/* Row 1: B1 Distributions + B3 Missing/Word Count */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <DistributionChart distributions={metrics.qc.distributions} />
              <WordCountChart
                missingRate={metrics.qc.missing_wordcount.missing_rate}
                wordCountBins={metrics.qc.missing_wordcount.word_count_bins}
              />
            </div>

            {/* Row 2: B2 Entropy/Saturation */}
            <div className="mb-8">
              <EntropyChart data={metrics.qc.entropy_saturation} />
            </div>

            {/* Row 3: A2 Archetypes */}
            <div className="mb-8">
              <ArchetypeTable archetypes={metrics.qc.archetypes} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}


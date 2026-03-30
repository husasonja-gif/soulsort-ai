'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MetricsData {
  range: { key: string; days: number }
  generated_at: string
  radars: {
    all_time: { user: number; requester: number; total: number }
    in_range: { user: number; requester: number; total: number }
    split: { user_share_pct: number; requester_share_pct: number }
  }
  deep_insights: {
    all_time: { user_with_copy: number; requester_with_copy: number; total_with_copy: number; coverage_pct: number }
    in_range: { user_with_copy: number; requester_with_copy: number; total_with_copy: number; coverage_pct: number }
  }
  quality: {
    v4_axis_completeness: { user_pct: number; requester_pct: number }
  }
  adoption: {
    unique_user_profiles_generated_in_range: number
    unique_links_assessed_in_range: number
  }
  trend: Array<{ date: string; user_radars: number; requester_radars: number; total_radars: number }>
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-purple-300/20 bg-white/10 p-5 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-wide text-purple-200/90">{title}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {subtitle ? <p className="mt-1 text-sm text-purple-100/80">{subtitle}</p> : null}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          window.location.href = '/login?redirect=/analytics'
          return
        } else {
          const payload = await response.json().catch(() => ({}))
          setError(payload?.error || 'Failed to fetch metrics')
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
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-purple-100">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-red-500/30 bg-red-900/20 p-6">
            <h2 className="mb-2 text-xl font-semibold text-red-200">Access Denied</h2>
            <div className="mb-4 whitespace-pre-line text-red-200/90">{error}</div>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-fuchsia-600 hover:to-purple-700"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-purple-300/30 bg-white/10 px-4 py-2 text-sm font-medium text-purple-100 hover:bg-white/20"
              >
                Login with Different Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-purple-300/20 bg-white/10 p-6 backdrop-blur-xl">
            <p className="text-purple-100">No metrics available yet for this range.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-purple-100/80">
              Radar-first metrics (user vs requester) with deep-insights coverage.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-fuchsia-600 hover:to-purple-700"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-purple-100">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="rounded-xl border border-purple-300/25 bg-white/10 px-4 py-2 text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Radars (All-Time)"
            value={metrics.radars.all_time.total}
            subtitle="Primary go-to-market KPI"
          />
          <StatCard
            title="User Radars (All-Time)"
            value={metrics.radars.all_time.user}
            subtitle={`${metrics.radars.split.user_share_pct.toFixed(1)}% of total`}
          />
          <StatCard
            title="Requester Radars (All-Time)"
            value={metrics.radars.all_time.requester}
            subtitle={`${metrics.radars.split.requester_share_pct.toFixed(1)}% of total`}
          />
          <StatCard
            title={`Radars (${metrics.range.days}d)`}
            value={metrics.radars.in_range.total}
            subtitle={`${metrics.radars.in_range.user} user / ${metrics.radars.in_range.requester} requester`}
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Deep Insights Coverage (All-Time)"
            value={`${metrics.deep_insights.all_time.coverage_pct.toFixed(1)}%`}
            subtitle={`${metrics.deep_insights.all_time.total_with_copy} radars with generated copy`}
          />
          <StatCard
            title={`Deep Insights (${metrics.range.days}d)`}
            value={`${metrics.deep_insights.in_range.coverage_pct.toFixed(1)}%`}
            subtitle={`${metrics.deep_insights.in_range.user_with_copy} user / ${metrics.deep_insights.in_range.requester_with_copy} requester`}
          />
          <StatCard
            title="V4 Completeness (User)"
            value={`${metrics.quality.v4_axis_completeness.user_pct.toFixed(1)}%`}
            subtitle="All 7 axes present"
          />
          <StatCard
            title="V4 Completeness (Requester)"
            value={`${metrics.quality.v4_axis_completeness.requester_pct.toFixed(1)}%`}
            subtitle="All 7 axes present"
          />
        </div>

        <div className="mb-8 rounded-2xl border border-purple-300/20 bg-white/10 p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-xl font-semibold text-white">Adoption Snapshot</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-purple-300/20 bg-white/10 p-4">
              <p className="text-sm text-purple-100/80">Unique users generating profile radars ({metrics.range.days}d)</p>
              <p className="mt-1 text-2xl font-bold text-white">{metrics.adoption.unique_user_profiles_generated_in_range}</p>
            </div>
            <div className="rounded-xl border border-purple-300/20 bg-white/10 p-4">
              <p className="text-sm text-purple-100/80">Unique links receiving requester radars ({metrics.range.days}d)</p>
              <p className="mt-1 text-2xl font-bold text-white">{metrics.adoption.unique_links_assessed_in_range}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-300/20 bg-white/10 p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-xl font-semibold text-white">Daily Radar Trend ({metrics.range.days}d)</h2>
          {metrics.trend.length === 0 ? (
            <p className="text-purple-100/80">No radar generation events found in this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-300/20 text-left text-purple-100">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">User Radars</th>
                    <th className="py-2 pr-4">Requester Radars</th>
                    <th className="py-2 pr-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.trend.map((row) => (
                    <tr key={row.date} className="border-b border-purple-300/10 text-purple-50">
                      <td className="py-2 pr-4">{row.date}</td>
                      <td className="py-2 pr-4">{row.user_radars}</td>
                      <td className="py-2 pr-4">{row.requester_radars}</td>
                      <td className="py-2 pr-4 font-semibold">{row.total_radars}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-purple-100/70">
            Legacy analytics panels were removed. This dashboard now uses radar source-of-truth tables only:
            <code className="ml-1">user_radar_profiles</code> and <code className="ml-1">requester_assessments</code>.
          </p>
        </div>
      </div>
    </div>
  )
}


# Analytics Dashboard Structure

This document outlines the Next.js dashboard structure for SoulSort AI analytics.

## Directory Structure

```
app/
  analytics/
    page.tsx                    # Main analytics dashboard (admin-only)
    layout.tsx                  # Analytics layout with navigation
    components/
      FunnelChart.tsx          # Funnel visualization component
      MetricCard.tsx            # Reusable metric display card
      CostChart.tsx             # Cost trends over time
      EngagementChart.tsx        # Engagement metrics visualization
      GrowthLoopChart.tsx        # Growth loop metrics
    api/
      metrics/
        route.ts                # API route for fetching metrics
        funnel/
          route.ts              # Funnel-specific metrics
        cost/
          route.ts              # Cost metrics
        engagement/
          route.ts              # Engagement metrics
```

## Component Structure

### Main Dashboard Page (`app/analytics/page.tsx`)

```typescript
'use client'

import { useState, useEffect } from 'react'
import MetricCard from './components/MetricCard'
import FunnelChart from './components/FunnelChart'
import CostChart from './components/CostChart'
import EngagementChart from './components/EngagementChart'
import GrowthLoopChart from './components/GrowthLoopChart'

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics(dateRange)
  }, [dateRange])

  const fetchMetrics = async (range: string) => {
    // Fetch all metrics
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      
      {/* Date Range Selector */}
      <div className="mb-6">
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total Requesters" value={metrics?.total_requesters} />
        <MetricCard title="Completion Rate" value={`${metrics?.completion_rate}%`} />
        <MetricCard title="Avg Cost/Completion" value={`$${metrics?.avg_cost}`} />
        <MetricCard title="Daily Active Users" value={metrics?.dau} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <FunnelChart data={metrics?.funnel} />
        <GrowthLoopChart data={metrics?.growth_loop} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostChart data={metrics?.cost_trends} />
        <EngagementChart data={metrics?.engagement} />
      </div>
    </div>
  )
}
```

### Metric Card Component

```typescript
// app/analytics/components/MetricCard.tsx
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {title}
      </h3>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value ?? '—'}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
      {trend && (
        <div className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  )
}
```

### Funnel Chart Component

```typescript
// app/analytics/components/FunnelChart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface FunnelChartProps {
  data: {
    stage: string
    count: number
    conversion_rate: number
  }[]
}

export default function FunnelChart({ data }: FunnelChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Requester Funnel</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="stage" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#9333ea" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## API Routes

### Main Metrics Route (`app/analytics/api/metrics/route.ts`)

```typescript
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check admin access (implement your admin check)
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('range') || '30d'

    // Fetch all metrics in parallel
    const [funnel, growth, engagement, cost] = await Promise.all([
      getFunnelMetrics(supabase, dateRange),
      getGrowthMetrics(supabase, dateRange),
      getEngagementMetrics(supabase, dateRange),
      getCostMetrics(supabase, dateRange),
    ])

    return NextResponse.json({
      funnel,
      growth_loop: growth,
      engagement,
      cost_trends: cost,
      total_requesters: growth.total_requesters,
      completion_rate: funnel.overall_completion_rate,
      avg_cost: cost.avg_cost_per_completion,
      dau: engagement.daily_active_users,
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}

async function getFunnelMetrics(supabase: any, range: string) {
  // Execute funnel SQL queries
  const { data, error } = await supabase.rpc('get_funnel_metrics', { date_range: range })
  return data
}

// Similar functions for other metrics...
```

## Async/Cron Jobs

### Recommended Async Computations

1. **Daily Aggregates** (Run daily at midnight)
   - Pre-compute daily metrics (DAU, MAU, completion rates)
   - Store in `daily_metrics` table for fast dashboard loading
   - Reduces query load on main tables

2. **Cost Alerts** (Run hourly)
   - Monitor OpenAI costs
   - Alert if daily cost exceeds threshold
   - Track cost trends

3. **Funnel Drop-off Analysis** (Run daily)
   - Identify common drop-off points
   - Generate insights for product improvements

4. **User Retention Calculation** (Run weekly)
   - Calculate cohort retention rates
   - Identify power users

### Example Cron Job Structure

```typescript
// app/api/cron/daily-metrics/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()
  
  // Compute and store daily aggregates
  await supabase.rpc('compute_daily_metrics', {
    target_date: new Date().toISOString().split('T')[0]
  })

  return NextResponse.json({ success: true })
}
```

## Security Considerations

1. **Admin-Only Access**: Implement role-based access control
2. **RLS Policies**: Ensure analytics tables respect user privacy
3. **Data Anonymization**: Never expose user IDs in aggregate metrics
4. **Rate Limiting**: Protect API routes from abuse

## Future Extensibility

- Add custom date range picker
- Export metrics to CSV/PDF
- Set up alerts for key metrics
- Add cohort analysis
- Implement A/B testing framework
- Add real-time metrics (WebSocket updates)






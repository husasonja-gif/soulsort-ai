import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

// Simple admin check - you can enhance this later
function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  
  // Get admin emails from environment variable
  const adminEmailsStr = process.env.ADMIN_EMAILS || ''
  const adminEmails = adminEmailsStr
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0)
  
  const userEmail = email.toLowerCase().trim()
  
  // Debug logging (remove in production if needed)
  if (process.env.NODE_ENV === 'development') {
    console.log('Admin check:', {
      userEmail,
      adminEmails,
      adminEmailsStr,
      isAdmin: adminEmails.includes(userEmail)
    })
  }
  
  return adminEmails.includes(userEmail)
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    
    // Calculate date range
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch all metrics in parallel
    const [
      funnelData,
      growthData,
      engagementData,
      costData,
      totalRequesters,
      completionRate,
      avgCost,
      dau
    ] = await Promise.all([
      getFunnelMetrics(supabase, days),
      getGrowthMetrics(supabase, days),
      getEngagementMetrics(supabase, days),
      getCostTrends(supabase, days),
      getTotalRequesters(supabase, days),
      getCompletionRate(supabase, days),
      getAvgCost(supabase, days),
      getDAU(supabase)
    ])

    return NextResponse.json({
      total_requesters: totalRequesters,
      completion_rate: completionRate,
      avg_cost: avgCost,
      dau: dau,
      funnel: funnelData,
      growth_loop: growthData,
      engagement: engagementData,
      cost_trends: costData,
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

async function getFunnelMetrics(supabase: any, days: number) {
  const { data, error } = await supabase.rpc('get_funnel_metrics', {
    days_param: days
  })

  if (error) {
    // Fallback to direct query if RPC doesn't exist
    const { data: sessions } = await supabase
      .from('requester_sessions')
      .select('*')
      .gte('started_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (!sessions) return []

    const total = sessions.length
    const consent = sessions.filter((s: any) => s.consent_granted_at).length
    const questions = sessions.filter((s: any) => s.questions_started_at).length
    const completed = sessions.filter((s: any) => s.completed_at).length

    return [
      { stage: 'Started', count: total, conversion_rate: 100 },
      { stage: 'Consent', count: consent, conversion_rate: total > 0 ? (consent / total) * 100 : 0 },
      { stage: 'Questions', count: questions, conversion_rate: consent > 0 ? (questions / consent) * 100 : 0 },
      { stage: 'Completed', count: completed, conversion_rate: total > 0 ? (completed / total) * 100 : 0 },
    ]
  }

  return data || []
}

async function getGrowthMetrics(supabase: any, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // Get shares
  const { data: shares } = await supabase
    .from('share_actions')
    .select('user_id, link_id')
    .gte('created_at', startDate)

  // Get unique requesters
  const { data: requesters } = await supabase
    .from('requester_sessions')
    .select('requester_id, link_id')
    .gte('started_at', startDate)
    .not('requester_id', 'is', null)

  // Get converted users
  const { data: converted } = await supabase
    .from('requester_sessions')
    .select('converted_user_id')
    .gte('started_at', startDate)
    .eq('converted_to_user', true)
    .not('converted_user_id', 'is', null)

  // Get completed radars
  const { data: completed } = await supabase
    .from('requester_sessions')
    .select('requester_id')
    .gte('started_at', startDate)
    .not('completed_at', 'is', null)
    .not('requester_id', 'is', null)

  const uniqueShares = new Set(shares?.map((s: any) => s.user_id) || []).size
  const uniqueRequesters = new Set(requesters?.map((r: any) => r.requester_id) || []).size
  const uniqueSignups = new Set(converted?.map((c: any) => c.converted_user_id) || []).size
  const completedCount = completed?.length || 0

  const conversionRate = uniqueShares > 0 ? (uniqueSignups / uniqueShares) * 100 : 0
  const avgRadars = uniqueRequesters > 0 ? completedCount / uniqueRequesters : 0

  return {
    shares: uniqueShares,
    signups: uniqueSignups,
    conversion_rate: conversionRate,
    avg_radars_per_requester: avgRadars,
  }
}

async function getEngagementMetrics(supabase: any, days: number) {
  // DAU
  const { data: dauData } = await supabase
    .from('dashboard_visits')
    .select('user_id')
    .eq('visit_date', new Date().toISOString().split('T')[0])

  const dau = new Set(dauData?.map((d: any) => d.user_id) || []).size

  // MAU
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: mauData } = await supabase
    .from('dashboard_visits')
    .select('user_id')
    .gte('visit_date', startDate)

  const mau = new Set(mauData?.map((d: any) => d.user_id) || []).size

  // Stickiness
  const stickiness = mau > 0 ? (dau / mau) * 100 : 0

  // Avg completion time
  const { data: sessions } = await supabase
    .from('requester_sessions')
    .select('completion_time_ms')
    .not('completion_time_ms', 'is', null)
    .gte('started_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

  const avgCompletionTime = sessions && sessions.length > 0
    ? sessions.reduce((sum: number, s: any) => sum + (s.completion_time_ms || 0), 0) / sessions.length
    : 0

  return {
    dau,
    mau,
    stickiness,
    avg_completion_time: avgCompletionTime,
  }
}

async function getCostTrends(supabase: any, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: usage } = await supabase
    .from('openai_usage')
    .select('created_at, cost_usd')
    .gte('created_at', startDate)
    .order('created_at', { ascending: true })

  if (!usage || usage.length === 0) {
    return []
  }

  // Group by date
  const dailyCosts: Record<string, { cost: number; calls: number }> = {}
  
  usage.forEach((u: any) => {
    const date = new Date(u.created_at).toISOString().split('T')[0]
    if (!dailyCosts[date]) {
      dailyCosts[date] = { cost: 0, calls: 0 }
    }
    dailyCosts[date].cost += parseFloat(u.cost_usd || 0)
    dailyCosts[date].calls += 1
  })

  return Object.entries(dailyCosts)
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cost: data.cost,
      calls: data.calls,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

async function getTotalRequesters(supabase: any, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  
  const { count } = await supabase
    .from('requester_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('started_at', startDate)

  return count || 0
}

async function getCompletionRate(supabase: any, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  
  const { data: sessions } = await supabase
    .from('requester_sessions')
    .select('completed_at')
    .gte('started_at', startDate)

  if (!sessions || sessions.length === 0) return 0

  const completed = sessions.filter((s: any) => s.completed_at).length
  return (completed / sessions.length) * 100
}

async function getAvgCost(supabase: any, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  
  const { data: usage } = await supabase
    .from('openai_usage')
    .select('cost_usd')
    .eq('endpoint', 'requester_assess')
    .gte('created_at', startDate)

  const { data: completed } = await supabase
    .from('requester_sessions')
    .select('id')
    .not('completed_at', 'is', null)
    .gte('started_at', startDate)

  if (!usage || usage.length === 0 || !completed || completed.length === 0) {
    return 0
  }

  const totalCost = usage.reduce((sum: number, u: any) => sum + parseFloat(u.cost_usd || 0), 0)
  return totalCost / completed.length
}

async function getDAU(supabase: any) {
  const { data } = await supabase
    .from('dashboard_visits')
    .select('user_id')
    .eq('visit_date', new Date().toISOString().split('T')[0])

  return new Set(data?.map((d: any) => d.user_id) || []).size
}


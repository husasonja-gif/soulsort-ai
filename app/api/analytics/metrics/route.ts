import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

// Simple admin check - you can enhance this later
function isAdmin(email: string | undefined): boolean {
  if (!email) {
    console.error('Admin check failed: no email provided')
    return false
  }
  
  // Get admin emails from environment variable
  const adminEmailsStr = process.env.ADMIN_EMAILS || ''
  const adminEmails = adminEmailsStr
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0)
  
  const userEmail = email.toLowerCase().trim()
  
  // Always log for debugging (can be removed later)
  console.log('Admin check:', {
    userEmail,
    adminEmails,
    adminEmailsStr,
    hasAdminEmails: adminEmails.length > 0,
    isAdmin: adminEmails.includes(userEmail),
    envVarExists: !!process.env.ADMIN_EMAILS,
    envVarLength: process.env.ADMIN_EMAILS?.length || 0
  })
  
  const isAdminResult = adminEmails.includes(userEmail)
  
  if (!isAdminResult) {
    console.error('Admin check failed:', {
      userEmail,
      adminEmails,
      adminEmailsStr,
      matchFound: adminEmails.some(e => e === userEmail)
    })
  }
  
  return isAdminResult
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    console.log('Checking admin access for user:', {
      userId: user.id,
      userEmail: user.email,
      adminEmailsEnv: process.env.ADMIN_EMAILS,
      adminEmailsExists: !!process.env.ADMIN_EMAILS
    })
    
    const adminCheck = isAdmin(user.email)
    if (!adminCheck) {
      // Log for debugging
      console.error('Admin access denied:', {
        userEmail: user.email,
        userEmailLower: user.email?.toLowerCase().trim(),
        adminEmails: process.env.ADMIN_EMAILS,
        hasAdminEmails: !!process.env.ADMIN_EMAILS,
        adminEmailsParsed: process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase())
      })
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required',
        details: {
          userEmail: user.email,
          adminEmails: process.env.ADMIN_EMAILS || 'NOT SET',
          debug: {
            userEmailLower: user.email?.toLowerCase().trim(),
            adminEmailsParsed: process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
          }
        }
      }, { status: 403 })
    }
    
    console.log('Admin access granted for:', user.email)

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
      dau,
      qcMetrics,
      feedbackMetrics,
      requesterMetrics,
      costMetrics
    ] = await Promise.all([
      getFunnelMetrics(supabase, days),
      getGrowthMetrics(supabase, days),
      getEngagementMetrics(supabase, days),
      getCostTrends(supabase, days),
      getTotalRequesters(supabase, days),
      getCompletionRate(supabase, days),
      getAvgCost(supabase, days),
      getDAU(supabase),
      getQCMetrics(supabase, days),
      getFeedbackMetrics(supabase, days),
      getRequesterMetrics(supabase, days),
      getCostMetrics(supabase, days)
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
      qc: qcMetrics,
      feedback: feedbackMetrics,
      requester: requesterMetrics,
      cost: costMetrics,
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

async function getQCMetrics(supabase: any, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  
  // Use service role to read traces
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return {
      total_profiles: 0,
      missing_answer_rate: 0,
      default_clustering_rate: 0,
      distributions: {},
      entropy_saturation: [],
      missing_wordcount: {
        missing_rate: { q1: 0, q2: 0, q3: 0, q4: 0 },
        word_count_bins: {
          q1: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
          q2: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
          q3: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
          q4: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
        }
      },
      archetypes: []
    }
  }
  
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )
  
  const { data: traces, error } = await supabaseAdmin
    .from('profile_generation_traces')
    .select('*')
    .gte('created_at', startDate)
    .order('created_at', { ascending: true })
  
  if (error || !traces || traces.length === 0) {
    return {
      total_profiles: 0,
      missing_answer_rate: 0,
      default_clustering_rate: 0,
      distributions: {},
      entropy_saturation: [],
      missing_wordcount: {
        missing_rate: { q1: 0, q2: 0, q3: 0, q4: 0 },
        word_count_bins: {
          q1: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
          q2: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
          q3: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
          q4: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
        }
      },
      archetypes: []
    }
  }
  
  // B1: Distributions - compute 7-dim derived scores and histograms
  const dimScores: Record<string, number[]> = {
    Self_Transcendence: [],
    Self_Enhancement: [],
    Rooting: [],
    Searching: [],
    Relational: [],
    Erotic: [],
    Consent: [],
  }
  
  // B3: Missing + word count
  let totalMissing = 0
  const wordCountBins: Record<string, { '0': number; '1-5': number; '6-15': number; '16-30': number; '31+': number }> = {
    q1: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
    q2: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
    q3: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
    q4: { '0': 0, '1-5': 0, '6-15': 0, '16-30': 0, '31+': 0 },
  }
  
  // B2: Entropy + saturation (daily)
  const dailyStats: Record<string, { std: number[]; saturation: number }> = {}
  
  // A2: Archetype signatures
  const signatureCounts: Record<string, { count: number; traces: any[] }> = {}
  
  traces.forEach((trace: any) => {
    const fv = trace.final_vectors || {}
    const vv = fv.values_vector || []
    const ev = fv.erotic_vector || []
    const rv = fv.relational_vector || []
    const cv = fv.consent_vector || []
    
    // Compute 7-dim derived scores
    const st = (vv[0] || 0.5) * 100
    const se = (vv[1] || 0.5) * 100
    const root = (vv[2] || 0.5) * 100
    const search = (vv[3] || 0.5) * 100
    const rel = (rv.reduce((a: number, b: number) => a + b, 0) / 5) * 100
    const ero = (ev.reduce((a: number, b: number) => a + b, 0) / 5) * 100
    const con = (cv.reduce((a: number, b: number) => a + b, 0) / 4) * 100
    
    dimScores.Self_Transcendence.push(st)
    dimScores.Self_Enhancement.push(se)
    dimScores.Rooting.push(root)
    dimScores.Searching.push(search)
    dimScores.Relational.push(rel)
    dimScores.Erotic.push(ero)
    dimScores.Consent.push(con)
    
    // Missing rate
    const status = trace.extraction_status || {}
    if (status.q1 === 'missing') totalMissing++
    if (status.q2 === 'missing') totalMissing++
    if (status.q3 === 'missing') totalMissing++
    if (status.q4 === 'missing') totalMissing++
    
    // Word count bins
    const wc = trace.answer_word_counts || {}
    ;['q1', 'q2', 'q3', 'q4'].forEach(q => {
      const count = wc[q] || 0
      if (count === 0) wordCountBins[q]['0']++
      else if (count <= 5) wordCountBins[q]['1-5']++
      else if (count <= 15) wordCountBins[q]['6-15']++
      else if (count <= 30) wordCountBins[q]['16-30']++
      else wordCountBins[q]['31+']++
    })
    
    // Daily entropy/saturation
    const date = new Date(trace.created_at).toISOString().split('T')[0]
    if (!dailyStats[date]) {
      dailyStats[date] = { std: [], saturation: 0 }
    }
    const dayScores = [st, se, root, search, rel, ero, con]
    const mean = dayScores.reduce((a, b) => a + b, 0) / dayScores.length
    const variance = dayScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dayScores.length
    dailyStats[date].std.push(Math.sqrt(variance))
    const saturated = dayScores.filter(s => s < 10 || s > 90).length
    dailyStats[date].saturation += saturated / dayScores.length
    
    // Archetype signature
    const bin = (val: number) => val < 33 ? 'L' : val < 67 ? 'M' : 'H'
    const sig = `ST:${bin(st)} SE:${bin(se)} Root:${bin(root)} Search:${bin(search)} Rel:${bin(rel)} Ero:${bin(ero)} Con:${bin(con)}`
    if (!signatureCounts[sig]) {
      signatureCounts[sig] = { count: 0, traces: [] }
    }
    signatureCounts[sig].count++
    signatureCounts[sig].traces.push({ st, se, root, search, rel, ero, con })
  })
  
  // Compute distributions (histograms with 10 bins)
  const distributions: Record<string, { bins: number[]; median: number; iqr: number; defaultClustering: number }> = {}
  Object.keys(dimScores).forEach(dim => {
    const scores = dimScores[dim]
    if (scores.length === 0) {
      distributions[dim] = { bins: Array(10).fill(0), median: 50, iqr: 0, defaultClustering: 0 }
      return
    }
    const bins = Array(10).fill(0)
    scores.forEach(s => {
      const binIdx = Math.min(9, Math.floor(s / 10))
      bins[binIdx]++
    })
    const sorted = [...scores].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const q1 = sorted[Math.floor(sorted.length / 4)]
    const q3 = sorted[Math.floor((sorted.length * 3) / 4)]
    const iqr = q3 - q1
    const defaultClustering = scores.filter(s => s >= 45 && s <= 55).length / scores.length
    distributions[dim] = { bins, median, iqr, defaultClustering }
  })
  
  // B2: Entropy/saturation time series
  const entropySaturation = Object.entries(dailyStats)
    .map(([date, stats]) => {
      const dayTraces = traces.filter(t => new Date(t.created_at).toISOString().split('T')[0] === date)
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        entropy: stats.std.length > 0 ? stats.std.reduce((a, b) => a + b, 0) / stats.std.length : 0,
        saturation: dayTraces.length > 0 ? stats.saturation / dayTraces.length : 0,
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // A2: Top 10 archetypes
  const archetypes = Object.entries(signatureCounts)
    .map(([signature, data]) => {
      const traces = data.traces
      const median = {
        st: traces.map((t: any) => t.st).sort((a: number, b: number) => a - b)[Math.floor(traces.length / 2)],
        se: traces.map((t: any) => t.se).sort((a: number, b: number) => a - b)[Math.floor(traces.length / 2)],
        root: traces.map((t: any) => t.root).sort((a: number, b: number) => a - b)[Math.floor(traces.length / 2)],
        search: traces.map((t: any) => t.search).sort((a: number, b: number) => a - b)[Math.floor(traces.length / 2)],
        rel: traces.map((t: any) => t.rel).sort((a: number, b: number) => a - b)[Math.floor(traces.length / 2)],
        ero: traces.map((t: any) => t.ero).sort((a: number, b: number) => a - b)[Math.floor(traces.length / 2)],
        con: traces.map((t: any) => t.con).sort((a: number, b: number) => a - b)[Math.floor(traces.length / 2)],
      }
      return {
        signature,
        count: data.count,
        percentage: (data.count / traces.length) * 100,
        median,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // Overall default clustering rate
  const allScores = Object.values(dimScores).flat()
  const defaultClusteringRate = allScores.length > 0 
    ? allScores.filter(s => s >= 45 && s <= 55).length / allScores.length 
    : 0
  
  // Calculate avg cost per profile from OpenAI usage
  let avgCostPerProfile = 0
  if (traces.length > 0) {
    const { data: profileUsage } = await supabaseAdmin
      .from('openai_usage')
      .select('cost_usd')
      .eq('endpoint', 'generate_profile')
      .gte('created_at', startDate)
      .eq('success', true)
    
    if (profileUsage && profileUsage.length > 0) {
      const totalCost = profileUsage.reduce((sum: number, u: any) => sum + parseFloat(u.cost_usd || 0), 0)
      avgCostPerProfile = totalCost / traces.length
    }
  }
  
  return {
    total_profiles: traces.length,
    missing_answer_rate: traces.length > 0 ? totalMissing / (traces.length * 4) : 0,
    default_clustering_rate: defaultClusteringRate,
    avg_cost_per_profile: avgCostPerProfile,
    distributions,
    entropy_saturation: entropySaturation,
    missing_wordcount: {
      missing_rate: {
        q1: traces.filter((t: any) => t.extraction_status?.q1 === 'missing').length / traces.length,
        q2: traces.filter((t: any) => t.extraction_status?.q2 === 'missing').length / traces.length,
        q3: traces.filter((t: any) => t.extraction_status?.q3 === 'missing').length / traces.length,
        q4: traces.filter((t: any) => t.extraction_status?.q4 === 'missing').length / traces.length,
      },
      word_count_bins: wordCountBins,
    },
    archetypes,
  }
}

async function getFeedbackMetrics(supabase: any, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  
  const { data: feedbackEvents } = await supabase
    .from('analytics_events')
    .select('event_data')
    .eq('event_type', 'compatibility_feedback')
    .gte('created_at', startDate)
  
  if (!feedbackEvents || feedbackEvents.length === 0) {
    return {
      total: 0,
      positive: 0,
      negative: 0,
      positive_percentage: 0,
      negative_percentage: 0,
    }
  }
  
  const positive = feedbackEvents.filter((e: any) => e.event_data?.feedback === 'positive').length
  const negative = feedbackEvents.filter((e: any) => e.event_data?.feedback === 'negative').length
  const total = feedbackEvents.length
  
  return {
    total,
    positive,
    negative,
    positive_percentage: total > 0 ? (positive / total) * 100 : 0,
    negative_percentage: total > 0 ? (negative / total) * 100 : 0,
  }
}

// Get requester flow metrics (total flows, avg/median requests per user, distribution)
async function getRequesterMetrics(supabase: any, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  
  // Use requester_assessment_events if available, otherwise fallback to requester_sessions
  let completedFlows = 0
  let requestsPerUser: Record<string, number> = {}
  
  // Try requester_assessment_events first (new table)
  // Gracefully handle if table doesn't exist yet (migration not run)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: events, error: eventsError } = await supabaseAdmin
        .from('requester_assessment_events')
        .select('link_id, status')
        .eq('status', 'completed')
        .gte('created_at', startDate)
      
      if (eventsError) {
        // Table might not exist yet - that's OK, fallback to requester_sessions
        if (eventsError.message?.includes('does not exist') || eventsError.code === '42P01') {
          console.warn('requester_assessment_events table does not exist yet. Using requester_sessions fallback.')
        } else {
          console.error('Error querying requester_assessment_events:', eventsError)
        }
      } else if (events && events.length > 0) {
        completedFlows = events.length
        events.forEach((e: any) => {
          requestsPerUser[e.link_id] = (requestsPerUser[e.link_id] || 0) + 1
        })
      }
    } catch (error) {
      // Table might not exist yet - that's OK
      if (error instanceof Error && (error.message.includes('does not exist') || error.message.includes('relation'))) {
        console.warn('requester_assessment_events table does not exist yet. Using requester_sessions fallback.')
      } else {
        console.error('Error querying requester_assessment_events:', error)
      }
    }
  }
  
  // Fallback to requester_sessions if events table is empty
  if (completedFlows === 0) {
    const { data: sessions } = await supabase
      .from('requester_sessions')
      .select('link_id')
      .not('completed_at', 'is', null)
      .gte('started_at', startDate)
    
    if (sessions) {
      completedFlows = sessions.length
      sessions.forEach((s: any) => {
        requestsPerUser[s.link_id] = (requestsPerUser[s.link_id] || 0) + 1
      })
    }
  }
  
  // Calculate mean and median
  const requestCounts = Object.values(requestsPerUser).sort((a, b) => a - b)
  const mean = requestCounts.length > 0
    ? requestCounts.reduce((sum, count) => sum + count, 0) / requestCounts.length
    : 0
  const median = requestCounts.length > 0
    ? requestCounts[Math.floor(requestCounts.length / 2)]
    : 0
  
  // Distribution: 0, 1, 2-3, 4-10, 10+
  const distribution = {
    '0': 0,
    '1': 0,
    '2-3': 0,
    '4-10': 0,
    '10+': 0,
  }
  
  // Get all users with links to calculate 0 requests
  const { data: allLinks } = await supabase
    .from('user_links')
    .select('link_id, user_id')
    .eq('is_active', true)
  
  const allUserLinkIds = new Set(allLinks?.map((l: any) => l.link_id) || [])
  const usersWithRequests = new Set(Object.keys(requestsPerUser))
  distribution['0'] = allUserLinkIds.size - usersWithRequests.size
  
  requestCounts.forEach((count) => {
    if (count === 1) {
      distribution['1']++
    } else if (count >= 2 && count <= 3) {
      distribution['2-3']++
    } else if (count >= 4 && count <= 10) {
      distribution['4-10']++
    } else if (count > 10) {
      distribution['10+']++
    }
  })
  
  return {
    total_flows: completedFlows,
    avg_requests_per_user: mean,
    median_requests_per_user: median,
    distribution,
  }
}

// Get cost metrics (avg cost per profile generation, excluding requester costs)
async function getCostMetrics(supabase: any, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  
  // Get profile generation costs only (exclude requester_assess)
  const { data: profileUsage } = await supabase
    .from('openai_usage')
    .select('cost_usd')
    .eq('endpoint', 'generate_profile')
    .gte('created_at', startDate)
    .eq('success', true)
  
  // Count completed profile generations (from profile_generation_traces or user_radar_profiles)
  const { count: profileCount } = await supabase
    .from('user_radar_profiles')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', startDate)
  
  if (!profileUsage || profileUsage.length === 0 || !profileCount || profileCount === 0) {
    return {
      avg_cost_per_profile: 0,
      total_profile_cost: 0,
      total_profiles: 0,
    }
  }
  
  const totalCost = profileUsage.reduce((sum: number, u: any) => sum + parseFloat(u.cost_usd || 0), 0)
  const avgCost = totalCost / profileCount
  
  return {
    avg_cost_per_profile: avgCost,
    total_profile_cost: totalCost,
    total_profiles: profileCount,
  }
}


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
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startIso = startDate.toISOString()

    // Radar generation (source of truth):
    // - User radars: user_radar_profiles
    // - Requester radars: requester_assessments
    const [
      userRadarsAll,
      requesterRadarsAll,
      userRadarsRange,
      requesterRadarsRange,
      userDeepInsightsAll,
      requesterDeepInsightsAll,
      userDeepInsightsRange,
      requesterDeepInsightsRange,
      userV4Rows,
      requesterV4Rows,
      userTrendRows,
      requesterTrendRows,
      userCreatorRows,
      requesterLinkRows,
    ] = await Promise.all([
      supabase.from('user_radar_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('requester_assessments').select('id', { count: 'exact', head: true }),
      supabase.from('user_radar_profiles').select('id', { count: 'exact', head: true }).gte('created_at', startIso),
      supabase.from('requester_assessments').select('id', { count: 'exact', head: true }).gte('created_at', startIso),
      supabase.from('user_radar_profiles').select('id', { count: 'exact', head: true }).not('deep_insights_copy', 'is', null),
      supabase.from('requester_assessments').select('id', { count: 'exact', head: true }).not('deep_insights_copy', 'is', null),
      supabase
        .from('user_radar_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startIso)
        .not('deep_insights_copy', 'is', null),
      supabase
        .from('requester_assessments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startIso)
        .not('deep_insights_copy', 'is', null),
      supabase
        .from('user_radar_profiles')
        .select('self_transcendence,self_enhancement,rooting,searching,relational,erotic,consent')
        .gte('created_at', startIso),
      supabase
        .from('requester_assessments')
        .select('self_transcendence,self_enhancement,rooting,searching,relational,erotic,consent')
        .gte('created_at', startIso),
      supabase.from('user_radar_profiles').select('created_at').gte('created_at', startIso),
      supabase.from('requester_assessments').select('created_at').gte('created_at', startIso),
      supabase.from('user_radar_profiles').select('user_id').gte('created_at', startIso),
      supabase.from('requester_assessments').select('link_id').gte('created_at', startIso),
    ])

    const userAll = userRadarsAll.count || 0
    const requesterAll = requesterRadarsAll.count || 0
    const userRange = userRadarsRange.count || 0
    const requesterRange = requesterRadarsRange.count || 0
    const totalAll = userAll + requesterAll
    const totalRange = userRange + requesterRange

    const userDeepAll = userDeepInsightsAll.count || 0
    const requesterDeepAll = requesterDeepInsightsAll.count || 0
    const userDeepRange = userDeepInsightsRange.count || 0
    const requesterDeepRange = requesterDeepInsightsRange.count || 0

    const isCompleteV4 = (row: Record<string, number | null | undefined>) =>
      row.self_transcendence != null &&
      row.self_enhancement != null &&
      row.rooting != null &&
      row.searching != null &&
      row.relational != null &&
      row.erotic != null &&
      row.consent != null

    const userV4Total = userV4Rows.data?.length || 0
    const requesterV4Total = requesterV4Rows.data?.length || 0
    const userV4Complete = (userV4Rows.data || []).filter(isCompleteV4).length
    const requesterV4Complete = (requesterV4Rows.data || []).filter(isCompleteV4).length

    const trendMap: Record<string, { date: string; user_radars: number; requester_radars: number; total_radars: number }> = {}
    const ensureDay = (iso: string) => {
      const key = iso.slice(0, 10)
      if (!trendMap[key]) {
        trendMap[key] = { date: key, user_radars: 0, requester_radars: 0, total_radars: 0 }
      }
      return key
    }

    for (const row of userTrendRows.data || []) {
      if (!row.created_at) continue
      const key = ensureDay(row.created_at)
      trendMap[key].user_radars += 1
      trendMap[key].total_radars += 1
    }
    for (const row of requesterTrendRows.data || []) {
      if (!row.created_at) continue
      const key = ensureDay(row.created_at)
      trendMap[key].requester_radars += 1
      trendMap[key].total_radars += 1
    }

    const trend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date))
    const uniqueUsersInRange = new Set((userCreatorRows.data || []).map((r: any) => r.user_id).filter(Boolean)).size
    const uniqueLinksInRange = new Set((requesterLinkRows.data || []).map((r: any) => r.link_id).filter(Boolean)).size

    return NextResponse.json({
      range: { key: range, days },
      generated_at: new Date().toISOString(),
      radars: {
        all_time: {
          user: userAll,
          requester: requesterAll,
          total: totalAll,
        },
        in_range: {
          user: userRange,
          requester: requesterRange,
          total: totalRange,
        },
        split: {
          user_share_pct: totalAll > 0 ? (userAll / totalAll) * 100 : 0,
          requester_share_pct: totalAll > 0 ? (requesterAll / totalAll) * 100 : 0,
        },
      },
      deep_insights: {
        all_time: {
          user_with_copy: userDeepAll,
          requester_with_copy: requesterDeepAll,
          total_with_copy: userDeepAll + requesterDeepAll,
          coverage_pct: totalAll > 0 ? ((userDeepAll + requesterDeepAll) / totalAll) * 100 : 0,
        },
        in_range: {
          user_with_copy: userDeepRange,
          requester_with_copy: requesterDeepRange,
          total_with_copy: userDeepRange + requesterDeepRange,
          coverage_pct: totalRange > 0 ? ((userDeepRange + requesterDeepRange) / totalRange) * 100 : 0,
        },
      },
      quality: {
        v4_axis_completeness: {
          user_pct: userV4Total > 0 ? (userV4Complete / userV4Total) * 100 : 0,
          requester_pct: requesterV4Total > 0 ? (requesterV4Complete / requesterV4Total) * 100 : 0,
        },
      },
      adoption: {
        unique_user_profiles_generated_in_range: uniqueUsersInRange,
        unique_links_assessed_in_range: uniqueLinksInRange,
      },
      trend,
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}


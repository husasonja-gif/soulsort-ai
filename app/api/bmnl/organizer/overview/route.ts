import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    // Check if user is organizer (for now, allow if authenticated - add proper check later)
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is organizer
    const { data: organizer } = await supabase
      .from('bmnl_organizers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!organizer) {
      return NextResponse.json(
        { error: 'Not authorized as organizer' },
        { status: 403 }
      )
    }

    // Use service role for full access
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing' },
        { status: 500 }
      )
    }

    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not set')
      return NextResponse.json(
        { error: 'Server configuration error: NEXT_PUBLIC_SUPABASE_URL is missing' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    // Get all participants
    const { data: allParticipants, error: participantsError } = await supabaseAdmin
      .from('bmnl_participants')
      .select('id, email, status, assessment_completed_at, needs_human_review, created_at, auth_user_id')
      .order('created_at', { ascending: false })

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      return NextResponse.json(
        { error: 'Failed to fetch participants', details: participantsError.message },
        { status: 500 }
      )
    }

    // Log participants for debugging
    console.log('Organizer overview - participants found:', {
      total: allParticipants?.length || 0,
      participants: allParticipants?.map(p => ({
        id: p.id,
        email: p.email,
        status: p.status,
        has_completed_at: !!p.assessment_completed_at,
        needs_review: p.needs_human_review
      }))
    })

    // Get radar profiles for gate experience
    const { data: radarProfiles } = await supabaseAdmin
      .from('bmnl_radar_profiles')
      .select('participant_id, gate_experience')

    const radarMap = new Map(radarProfiles?.map(r => [r.participant_id, r.gate_experience]) || [])

    // Get flagged participants with their flags
    const { data: flags } = await supabaseAdmin
      .from('bmnl_flags')
      .select('*')
      .is('reviewed_at', null)
      .order('created_at', { ascending: false })

    const flaggedMap = new Map<string, any[]>()
    flags?.forEach(flag => {
      if (!flaggedMap.has(flag.participant_id)) {
        flaggedMap.set(flag.participant_id, [])
      }
      flaggedMap.get(flag.participant_id)!.push(flag)
    })

    // Calculate stats
    const completed = allParticipants?.filter(p => p.status === 'completed').length || 0
    const basicGate = radarProfiles?.filter(r => r.gate_experience === 'basic').length || 0
    const needsOrientation = radarProfiles?.filter(r => r.gate_experience === 'needs_orientation').length || 0
    const flagged = flaggedMap.size

    // Add gate experience to participants
    const participantsWithGate = (allParticipants || []).map(p => ({
      ...p,
      gate_experience: radarMap.get(p.id),
    }))

    // Build flagged participants list
    const flaggedParticipants = Array.from(flaggedMap.entries()).map(([participantId, flags]) => {
      const participant = allParticipants?.find(p => p.id === participantId)
      return participant ? { ...participant, flags, gate_experience: radarMap.get(participantId) } : null
    }).filter(Boolean) as any[]

    return NextResponse.json({
      participants: participantsWithGate,
      flagged: flaggedParticipants,
      stats: {
        total: allParticipants?.length || 0,
        completed,
        basic_gate: basicGate,
        needs_orientation: needsOrientation,
        flagged,
      },
    })
  } catch (error) {
    console.error('Error in organizer overview:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to load overview', details: errorMessage },
      { status: 500 }
    )
  }
}





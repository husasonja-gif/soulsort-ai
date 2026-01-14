import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participant_id')

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID required' },
        { status: 400 }
      )
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // Get all participant data (GDPR access right)
    const [participant, radar, answers, signals, flags, consent] = await Promise.all([
      supabaseAdmin.from('bmnl_participants').select('*').eq('id', participantId).single(),
      supabaseAdmin.from('bmnl_radar_profiles').select('*').eq('participant_id', participantId).maybeSingle(),
      supabaseAdmin.from('bmnl_answers').select('*').eq('participant_id', participantId).order('question_number'),
      supabaseAdmin.from('bmnl_signals').select('*').eq('participant_id', participantId).order('question_number'),
      supabaseAdmin.from('bmnl_flags').select('*').eq('participant_id', participantId),
      supabaseAdmin.from('bmnl_consent_log').select('*').eq('participant_id', participantId),
    ])

    return NextResponse.json({
      participant: participant.data,
      radar: radar.data,
      answers: answers.data || [],
      signals: signals.data || [],
      flags: flags.data || [],
      consent_log: consent.data || [],
      exported_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to export data', details: errorMessage },
      { status: 500 }
    )
  }
}


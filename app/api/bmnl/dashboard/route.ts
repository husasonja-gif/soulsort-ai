import { NextResponse } from 'next/server'
import { decryptText } from '@/lib/bmnl-crypto'

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

    // Get radar profile
    const { data: radar, error: radarError } = await supabaseAdmin
      .from('bmnl_radar_profiles')
      .select('*')
      .eq('participant_id', participantId)
      .maybeSingle()

    if (radarError && radarError.code !== 'PGRST116') {
      console.error('Error fetching radar:', radarError)
      return NextResponse.json(
        { error: 'Failed to fetch radar profile', details: radarError.message },
        { status: 500 }
      )
    }

    // Get answers (with encrypted flag)
    const { data: answersData, error: answersError } = await supabaseAdmin
      .from('bmnl_answers')
      .select('question_number, question_text, raw_answer, answered_at, encrypted')
      .eq('participant_id', participantId)
      .order('question_number', { ascending: true })

    if (answersError) {
      console.error('Error fetching answers:', answersError)
      return NextResponse.json(
        { error: 'Failed to fetch answers', details: answersError.message },
        { status: 500 }
      )
    }

    // Decrypt answers for display
    const answers = (answersData || []).map(answer => ({
      question_number: answer.question_number,
      question_text: answer.question_text,
      raw_answer: answer.encrypted ? decryptText(answer.raw_answer) : answer.raw_answer, // Decrypt if encrypted
      answered_at: answer.answered_at,
    }))

    return NextResponse.json({
      radar: radar ? {
        participation: radar.participation,
        consent_literacy: radar.consent_literacy,
        communal_responsibility: radar.communal_responsibility,
        inclusion_awareness: radar.inclusion_awareness,
        self_regulation: radar.self_regulation,
        openness_to_learning: radar.openness_to_learning,
        gate_experience: radar.gate_experience,
      } : null,
      answers: answers,
    })
  } catch (error) {
    console.error('Error in dashboard:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to load dashboard', details: errorMessage },
      { status: 500 }
    )
  }
}



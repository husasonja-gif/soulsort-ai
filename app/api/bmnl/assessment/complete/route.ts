import { NextResponse } from 'next/server'
import { aggregateSignalsToRadar } from '@/lib/bmnl-llm'
import type { ChatMessage } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { participant_id, chat_history } = body

    if (!participant_id) {
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

    // Get all signals for this participant
    const { data: signals, error: signalsError } = await supabaseAdmin
      .from('bmnl_signals')
      .select('*')
      .eq('participant_id', participant_id)
      .order('question_number', { ascending: true })

    if (signalsError) {
      console.error('Error fetching signals:', signalsError)
      return NextResponse.json(
        { error: 'Failed to fetch signals', details: signalsError.message },
        { status: 500 }
      )
    }

    if (!signals || signals.length === 0) {
      return NextResponse.json(
        { error: 'No signals found for participant' },
        { status: 400 }
      )
    }

    // Aggregate signals to radar (code-level, not LLM)
    const radar = aggregateSignalsToRadar(signals as any[])

    // Save radar profile
    const { error: radarError } = await supabaseAdmin
      .from('bmnl_radar_profiles')
      .insert({
        participant_id,
        participation: radar.participation,
        consent_literacy: radar.consent_literacy,
        communal_responsibility: radar.communal_responsibility,
        inclusion_awareness: radar.inclusion_awareness,
        self_regulation: radar.self_regulation,
        openness_to_learning: radar.openness_to_learning,
        gate_experience: radar.gate_experience,
        schema_version: 1,
        model_version: 'v2-bmnl',
        scoring_version: 'v1',
      })

    if (radarError) {
      console.error('Error saving radar profile:', radarError)
      return NextResponse.json(
        { error: 'Failed to save radar profile', details: radarError.message },
        { status: 500 }
      )
    }

    // Update participant status
    const { error: updateError } = await supabaseAdmin
      .from('bmnl_participants')
      .update({
        status: 'completed',
        assessment_completed_at: new Date().toISOString(),
      })
      .eq('id', participant_id)

    if (updateError) {
      console.error('Error updating participant status:', updateError)
      // Don't fail if status update fails
    }

    return NextResponse.json({
      success: true,
      radar,
      gate_experience: radar.gate_experience,
    })
  } catch (error) {
    console.error('Error completing assessment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to complete assessment', details: errorMessage },
      { status: 500 }
    )
  }
}


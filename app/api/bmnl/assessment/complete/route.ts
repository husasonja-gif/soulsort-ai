import { NextResponse } from 'next/server'
import { aggregateSignalsToRadar, QUESTION_AXIS_MAP } from '@/lib/bmnl-llm'
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

    // Normalize signals: ensure mapped_axes is properly formatted and signal_level is valid
    // If mapped_axes is a string (JSONB from DB), parse it
    // If it's missing, reconstruct from QUESTION_AXIS_MAP
    // Also normalize old signal_level values (medium/high) to new 4-level system
    const normalizedSignals = signals.map((signal: any) => {
      let mappedAxes = signal.mapped_axes
      
      // Parse if it's a string
      if (typeof mappedAxes === 'string') {
        try {
          mappedAxes = JSON.parse(mappedAxes)
        } catch (e) {
          console.error('Error parsing mapped_axes:', e)
          mappedAxes = []
        }
      }
      
      // If mapped_axes is missing or invalid, reconstruct from QUESTION_AXIS_MAP
      if (!Array.isArray(mappedAxes) || mappedAxes.length === 0) {
        mappedAxes = QUESTION_AXIS_MAP[signal.question_number] || []
      }
      
      // Ensure each item has axis and weight
      mappedAxes = mappedAxes.map((item: any) => {
        if (typeof item === 'string') {
          // Old format: just axis name, default weight to 1.0
          return { axis: item, weight: 1.0 }
        }
        return item
      })
      
      // Normalize signal_level: convert old 3-level system to new 4-level system
      let normalizedLevel = signal.signal_level
      const levelMapping: Record<string, 'low' | 'emerging' | 'stable' | 'mastering'> = {
        'medium': 'emerging',
        'high': 'stable',
        // Keep valid 4-level values as-is
        'low': 'low',
        'emerging': 'emerging',
        'stable': 'stable',
        'mastering': 'mastering',
      }
      
      if (levelMapping[normalizedLevel]) {
        normalizedLevel = levelMapping[normalizedLevel]
      } else {
        // Unknown level, default to emerging
        console.warn(`Unknown signal_level "${normalizedLevel}" for question ${signal.question_number}, defaulting to "emerging"`)
        normalizedLevel = 'emerging'
      }
      
      return {
        ...signal,
        signal_level: normalizedLevel,
        mapped_axes: mappedAxes,
      }
    })

    // Log signals for debugging
    console.log('Signals before aggregation:', JSON.stringify(normalizedSignals.map(s => ({
      question: s.question_number,
      level: s.signal_level,
      axes: s.mapped_axes
    })), null, 2))

    // Aggregate signals to radar (code-level, not LLM)
    let radar
    try {
      radar = aggregateSignalsToRadar(normalizedSignals as any[])
      console.log('Aggregated radar:', radar)
    } catch (aggregateError) {
      console.error('Error aggregating signals to radar:', aggregateError)
      console.error('Normalized signals:', JSON.stringify(normalizedSignals, null, 2))
      return NextResponse.json(
        { error: 'Failed to aggregate signals', details: aggregateError instanceof Error ? aggregateError.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // Check if radar profile already exists
    const { data: existingRadar } = await supabaseAdmin
      .from('bmnl_radar_profiles')
      .select('id')
      .eq('participant_id', participant_id)
      .maybeSingle()

    let radarError
    if (existingRadar) {
      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from('bmnl_radar_profiles')
        .update({
          participation: radar.participation,
          consent_literacy: radar.consent_literacy,
          communal_responsibility: radar.communal_responsibility,
          inclusion_awareness: radar.inclusion_awareness,
          self_regulation: radar.self_regulation,
          openness_to_learning: radar.openness_to_learning,
          gate_experience: radar.gate_experience,
          schema_version: 2,
          model_version: 'v2-bmnl',
          scoring_version: 'v2',
          updated_at: new Date().toISOString(),
        })
        .eq('participant_id', participant_id)
      radarError = updateError
    } else {
      // Insert new profile
      const { error: insertError } = await supabaseAdmin
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
          schema_version: 2,
          model_version: 'v2-bmnl',
          scoring_version: 'v2',
        })
      radarError = insertError
    }

    if (radarError) {
      console.error('Error saving radar profile:', radarError)
      return NextResponse.json(
        { error: 'Failed to save radar profile', details: radarError.message, code: radarError.code },
        { status: 500 }
      )
    }

    // Compute needs_human_review based on new rules:
    // - Hard flags (phobic/garbage/gaming) -> always needs_review
    // - Defensive count >= 2 -> needs_review
    // - lowCount >= 4 -> needs_review
    const lowCount = Object.values(radar).filter(v => v === 'low').length
    const defensiveCount = normalizedSignals.filter((s: any) => s.is_defensive).length
    const hasPhobic = normalizedSignals.some((s: any) => s.is_phobic)
    const hasGaming = normalizedSignals.some((s: any) => s.is_gaming)
    const hasGarbage = normalizedSignals.some((s: any) => s.is_garbage)
    
    const needsHumanReview = hasPhobic || hasGaming || hasGarbage || defensiveCount >= 2 || lowCount >= 4
    const reviewReason = needsHumanReview
      ? (hasPhobic || hasGaming || hasGarbage
          ? 'Some answers suggest a need for in-person orientation.'
          : defensiveCount >= 2
          ? 'Some answers suggest a need for in-person orientation.'
          : lowCount >= 4
          ? 'Some answers suggest a need for in-person orientation.'
          : null)
      : null

    // Update participant status
    const { data: updatedParticipant, error: updateError } = await supabaseAdmin
      .from('bmnl_participants')
      .update({
        status: 'completed',
        assessment_completed_at: new Date().toISOString(),
        needs_human_review: needsHumanReview,
        review_notes: reviewReason,
      })
      .eq('id', participant_id)
      .select('id, status')
      .single()

    if (updateError) {
      console.error('Error updating participant status:', updateError)
      // Log detailed error for debugging
      console.error('Participant ID:', participant_id)
      console.error('Update error details:', JSON.stringify(updateError, null, 2))
      // Still return success for radar, but log the error
    } else {
      console.log('Successfully updated participant status to completed:', {
        participant_id,
        status: updatedParticipant?.status,
        assessment_completed_at: new Date().toISOString()
      })
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



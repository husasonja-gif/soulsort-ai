// GDPR-safe export endpoint (no IP leakage)
// Returns minimal, user-relevant data only: participant, consent, answers (decrypted), radar, summary_reasons, flags_for_participant
// Does NOT return: signals, llm_notes, mapped_axes, weights, internal IDs (except participant_id)

import { NextResponse } from 'next/server'
import { decryptText } from '@/lib/bmnl-crypto'
import { generateSummaryReasons } from '@/lib/bmnl-summary-reasons'

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

    // Get participant data (limited fields only - no auth_user_id)
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('bmnl_participants')
      .select('id, email, created_at, consent_granted_at, assessment_started_at, assessment_completed_at, auto_delete_at, manually_deleted_at, status, needs_human_review, review_notes, chat_history')
      .eq('id', participantId)
      .single()

    if (participantError) {
      console.error('Error fetching participant:', participantError)
      return NextResponse.json(
        { error: 'Failed to fetch participant data', details: participantError.message },
        { status: 500 }
      )
    }

    // Get radar profile (no internal IDs)
    const { data: radarProfile, error: radarError } = await supabaseAdmin
      .from('bmnl_radar_profiles')
      .select('participation, consent_literacy, communal_responsibility, inclusion_awareness, self_regulation, openness_to_learning, gate_experience, created_at')
      .eq('participant_id', participantId)
      .maybeSingle()

    if (radarError && radarError.code !== 'PGRST116') {
      console.error('Error fetching radar:', radarError)
      return NextResponse.json(
        { error: 'Failed to fetch radar profile', details: radarError.message },
        { status: 500 }
      )
    }

    // Get answers (decrypt raw_answer, no internal IDs)
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

    // Decrypt answers
    const answers = (answersData || []).map(answer => ({
      question_number: answer.question_number,
      question_text: answer.question_text,
      raw_answer: answer.encrypted ? decryptText(answer.raw_answer) : answer.raw_answer, // Decrypt if encrypted
      answered_at: answer.answered_at,
    }))

    // Get consent log (minimal fields)
    const { data: consentData, error: consentError } = await supabaseAdmin
      .from('bmnl_consent_log')
      .select('consent_type, granted, granted_at, revoked_at, consent_text, version')
      .eq('participant_id', participantId)
      .order('granted_at', { ascending: true })

    if (consentError) {
      console.error('Error fetching consent log:', consentError)
      return NextResponse.json(
        { error: 'Failed to fetch consent log', details: consentError.message },
        { status: 500 }
      )
    }

    // Get signals (only for generating summary_reasons - not exported)
    const { data: signalsData } = await supabaseAdmin
      .from('bmnl_signals')
      .select('question_number, signal_level, is_defensive')
      .eq('participant_id', participantId)
      .order('question_number', { ascending: true })

    // Generate deterministic summary_reasons
    const summaryReasons = radarProfile
      ? generateSummaryReasons(
          answers,
          radarProfile,
          (signalsData || []).map(s => ({
            question_number: s.question_number,
            signal_level: s.signal_level as 'low' | 'emerging' | 'stable' | 'mastering',
            is_defensive: s.is_defensive || false,
          }))
        )
      : []

    // Get flags (only user-relevant flags: needs_human_review and reason)
    const { data: participantFull } = await supabaseAdmin
      .from('bmnl_participants')
      .select('needs_human_review, review_notes')
      .eq('id', participantId)
      .single()

    const flagsForParticipant = {
      needs_human_review: participantFull?.needs_human_review || false,
      reason: participantFull?.review_notes || null,
    }

    // Build GDPR-safe export (no signals, llm_notes, mapped_axes, weights, internal IDs)
    const exportData = {
      participant: {
        id: participant.id,
        email: participant.email,
        created_at: participant.created_at,
        consent_granted_at: participant.consent_granted_at,
        assessment_started_at: participant.assessment_started_at,
        assessment_completed_at: participant.assessment_completed_at,
        auto_delete_at: participant.auto_delete_at,
        manually_deleted_at: participant.manually_deleted_at,
        status: participant.status,
        needs_human_review: participant.needs_human_review || false,
        review_notes: participant.review_notes || null,
      },
      consent: (consentData || []).map(c => ({
        type: c.consent_type,
        granted: c.granted,
        granted_at: c.granted_at,
        revoked_at: c.revoked_at,
        consent_text: c.consent_text,
        version: c.version,
      })),
      answers: answers,
      radar: radarProfile ? {
        participation: radarProfile.participation,
        consent_literacy: radarProfile.consent_literacy,
        communal_responsibility: radarProfile.communal_responsibility,
        inclusion_awareness: radarProfile.inclusion_awareness,
        self_regulation: radarProfile.self_regulation,
        openness_to_learning: radarProfile.openness_to_learning,
        gate_experience: radarProfile.gate_experience,
        created_at: radarProfile.created_at,
      } : null,
      summary_reasons: summaryReasons.map(r => ({
        axis: r.axis,
        level: r.level,
        reasons: r.reasons,
      })),
      flags_for_participant: flagsForParticipant,
      chat_history: participant.chat_history || null, // Full conversation context
      exported_at: new Date().toISOString(),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Error exporting data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to export data', details: errorMessage },
      { status: 500 }
    )
  }
}



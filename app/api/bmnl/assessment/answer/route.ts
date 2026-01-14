import { NextResponse } from 'next/server'
import { extractSignalFromAnswer, getBMNLQuestion } from '@/lib/bmnl-llm'
import type { ChatMessage } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { participant_id, question_number, question_text, answer, chat_history } = body

    if (!participant_id || !question_number || !answer) {
      return NextResponse.json(
        { error: 'Participant ID, question number, and answer required' },
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

    // Save raw answer
    const { error: answerError } = await supabaseAdmin
      .from('bmnl_answers')
      .insert({
        participant_id,
        question_number,
        question_text: question_text || getBMNLQuestion(question_number),
        raw_answer: answer,
        is_sensitive: false, // Could be enhanced to detect sensitive content
      })

    if (answerError) {
      console.error('Error saving answer:', answerError)
      return NextResponse.json(
        { error: 'Failed to save answer', details: answerError.message },
        { status: 500 }
      )
    }

    // Extract signal using LLM
    let signal
    try {
      signal = await extractSignalFromAnswer(
        question_number,
        question_text || getBMNLQuestion(question_number),
        answer,
        (chat_history || []) as ChatMessage[]
      )
    } catch (llmError) {
      console.error('Error extracting signal:', llmError)
      // Continue with default signal if LLM fails
      signal = {
        question_number,
        signal_level: 'medium' as const,
        is_garbage: false,
        is_gaming: false,
        is_phobic: false,
        is_defensive: false,
        mapped_axes: [],
      }
    }

    // Save signal
    const { error: signalError } = await supabaseAdmin
      .from('bmnl_signals')
      .insert({
        participant_id,
        question_number: signal.question_number,
        signal_level: signal.signal_level,
        is_garbage: signal.is_garbage,
        is_gaming: signal.is_gaming,
        is_phobic: signal.is_phobic,
        is_defensive: signal.is_defensive,
        mapped_axes: signal.mapped_axes,
        llm_notes: signal.llm_notes || null,
      })

    if (signalError) {
      console.error('Error saving signal:', signalError)
      // Don't fail the request if signal save fails
    }

    // Create flags if needed
    if (signal.is_garbage || signal.is_gaming || signal.is_phobic || signal.is_defensive) {
      const flagType = signal.is_phobic ? 'phobic' :
                       signal.is_gaming ? 'gaming' :
                       signal.is_garbage ? 'garbage' :
                       signal.is_defensive ? 'defensive' : 'other'

      const flagReason = signal.is_phobic ? 'Contains exclusionary language' :
                        signal.is_gaming ? 'Attempts to manipulate system' :
                        signal.is_garbage ? 'Low effort or nonsensical response' :
                        signal.is_defensive ? 'Shows extreme defensiveness' : 'Flagged for review'

      const severity = signal.is_phobic ? 'high' :
                      signal.is_gaming ? 'medium' :
                      signal.is_garbage ? 'low' : 'medium'

      await supabaseAdmin
        .from('bmnl_flags')
        .insert({
          participant_id,
          flag_type: flagType,
          flag_reason: flagReason,
          question_number,
          severity,
        })

      // Mark participant as needing review
      await supabaseAdmin
        .from('bmnl_participants')
        .update({ needs_human_review: true })
        .eq('id', participant_id)
    }

    return NextResponse.json({
      success: true,
      signal,
    })
  } catch (error) {
    console.error('Error in assessment answer:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to process answer', details: errorMessage },
      { status: 500 }
    )
  }
}


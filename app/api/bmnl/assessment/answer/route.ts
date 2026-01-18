import { NextResponse } from 'next/server'
import { extractSignalFromAnswer, getBMNLQuestion, generateCommentary, QUESTION_AXIS_MAP } from '@/lib/bmnl-llm'
import { encryptText, isSensitiveContent } from '@/lib/bmnl-crypto'
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

    // Extract signal first (before encryption) to check for sensitive flags
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
      const mappedAxes = QUESTION_AXIS_MAP[question_number] || []
      signal = {
        question_number,
        signal_level: 'emerging' as const,
        is_garbage: false,
        is_gaming: false,
        is_phobic: false,
        is_defensive: false,
        mapped_axes: mappedAxes,
      }
    }

    // Encrypt answer at rest (always encrypt for GDPR compliance)
    const encryptedAnswer = encryptText(answer)
    const isSensitive = isSensitiveContent(answer, { is_phobic: signal.is_phobic })

    // Save encrypted answer
    const { error: answerError } = await supabaseAdmin
      .from('bmnl_answers')
      .insert({
        participant_id,
        question_number,
        question_text: question_text || getBMNLQuestion(question_number),
        raw_answer: encryptedAnswer, // Encrypted at rest
        is_sensitive: isSensitive,
        encrypted: true,
      })

    if (answerError) {
      console.error('Error saving answer:', answerError)
      // Check if it's a duplicate (unique constraint violation)
      if (answerError.code === '23505' || answerError.message?.includes('duplicate') || answerError.message?.includes('unique')) {
        // Try to update instead
        const encryptedAnswer = encryptText(answer)
        const isSensitive = isSensitiveContent(answer, { is_phobic: signal.is_phobic })
        
        const { error: updateError } = await supabaseAdmin
          .from('bmnl_answers')
          .update({
            question_text: question_text || getBMNLQuestion(question_number),
            raw_answer: encryptedAnswer, // Encrypted at rest
            is_sensitive: isSensitive,
            encrypted: true,
            answered_at: new Date().toISOString(),
          })
          .eq('participant_id', participant_id)
          .eq('question_number', question_number)

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to save answer', details: updateError.message, code: updateError.code },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Failed to save answer', details: answerError.message, code: answerError.code },
          { status: 500 }
        )
      }
    }

    // Signal already extracted above (before encryption)

    // Save signal (mapped_axes is now an array of {axis, weight} objects)
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
        mapped_axes: signal.mapped_axes, // JSONB array of {axis, weight} objects
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

    // Generate commentary (unless it's garbage - skip commentary for garbage responses)
    let commentary: string | null = null
    if (!signal.is_garbage) {
      try {
        commentary = await generateCommentary(
          question_number,
          question_text || getBMNLQuestion(question_number),
          answer,
          (chat_history || []) as ChatMessage[]
        )
      } catch (commentaryError) {
        console.error('Error generating commentary:', commentaryError)
        // Continue without commentary if it fails
      }
    }

    return NextResponse.json({
      success: true,
      signal,
      commentary,
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



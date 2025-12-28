import { NextResponse } from 'next/server'
import { assessRequester } from '@/lib/llm'
import { getUserRadarProfile, createRequesterAssessment } from '@/lib/db'
import { evaluateDealbreakers, applyDealbreakerCaps, type RequesterStructuredFields } from '@/lib/dealbreakerEngine'
import type { ChatMessage } from '@/lib/types'

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', route: '/api/requester/assess' })
}

export async function POST(request: Request) {
  console.log('POST /api/requester/assess called')
  console.log('Request URL:', request.url)
  console.log('Request method:', request.method)
  console.log('Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const body = await request.json()
    const logRaw = process.env.LOG_RAW === 'true'
    if (logRaw) {
      console.log('Request body received:', { linkId: body.linkId, userId: body.userId, chatHistoryLength: body.chatHistory?.length, structuredFields: body.structuredFields })
    } else {
      console.log('Request body received:', { linkId: body.linkId, userId: body.userId, chatHistoryLength: body.chatHistory?.length, hasStructuredFields: !!body.structuredFields })
    }
    const { linkId, userId, chatHistory, skippedQuestions = [], structuredFields = {} } = body

    if (!linkId || !userId) {
      return NextResponse.json(
        { error: 'Link ID and User ID required' },
        { status: 400 }
      )
    }

    // Get user's radar profile and dealbreakers
    console.log('Fetching user radar profile for userId:', userId)
    const userRadarProfile = await getUserRadarProfile(userId)
    console.log('User radar profile result:', userRadarProfile ? 'found' : 'not found')
    if (!userRadarProfile) {
      console.error('User radar profile not found for userId:', userId)
      console.error('This means the user has not completed onboarding or their profile was not created')
      return NextResponse.json(
        { error: 'User profile not found. The user may not have completed onboarding.' },
        { status: 404 }
      )
    }

    // Extract requester responses from chat history with questions and answers paired
    // Note: Q1-Q3 now use simplified questions with quick-reply chips
    const QUESTIONS = [
      'Do you consent to a short convo to check alignment?',
      'What communication style do you prefer?',
      'Is there anything you do NOT want to discuss?',
      'What are three values you try to practice in your relationships?',
      'How do you like to navigate disagreements or misunderstandings?',
      'What helps you feel erotically connected to someone?',
      'How much do you need and seek freedom in your romantic relationships and what does freedom look like to you?',
    ]

    // Use skippedQuestions array from client, or extract from exclusions as fallback
    const skippedSet = new Set(skippedQuestions)
    
    // Extract exclusions from chat history as fallback
    let exclusionsValue = ''
    for (let i = 0; i < chatHistory.length; i++) {
      const msg = chatHistory[i]
      if (msg.role === 'assistant' && msg.content.includes(QUESTIONS[2].substring(0, 30))) {
        const nextMsg = chatHistory[i + 1]
        if (nextMsg && nextMsg.role === 'user') {
          exclusionsValue = nextMsg.content
          break
        }
      }
    }

    // If skippedQuestions not provided, check exclusions for erotic question
    // Check both exclusionsValue (from chat) and structuredFields.exclusions
    const exclusionValue = structuredFields?.exclusions || exclusionsValue
    if (!skippedSet.has(5)) {
      const shouldSkipErotic = exclusionValue && 
        exclusionValue !== 'no_exclusions' && 
        exclusionValue.toLowerCase() !== 'no exclusions' && 
        exclusionValue.toLowerCase() !== 'none' && 
        exclusionValue.toLowerCase() !== 'no' &&
        ['sex', 'sexual', 'erotic', 'intimacy', 'kink', 'kinky'].some(term => 
          exclusionValue.toString().toLowerCase().includes(term)
        )
      if (shouldSkipErotic) {
        skippedSet.add(5)
      }
    }

    // Pair questions with answers from chat history
    // Note: AI commentary may appear between questions and answers
    // For Q1-Q3, use structuredFields if available (from quick replies)
    const chatPairs: Array<{ question: string; answer: string; index: number; skipped?: boolean }> = []
    let questionIndex = 0
    
    for (let i = 0; i < chatHistory.length && questionIndex < QUESTIONS.length; i++) {
      const msg = chatHistory[i]
      if (msg.role === 'assistant') {
        // Check if this assistant message is one of our questions
        const matchingQuestion = QUESTIONS[questionIndex]
        // Check if message contains the question (allowing for partial matches)
        // For simplified Q1-Q3 questions, match on shorter prefixes
        const questionStart = questionIndex < 3 
          ? matchingQuestion.substring(0, 20) // Shorter match for Q1-Q3
          : matchingQuestion.substring(0, 30)
        
        // Skip question if it was marked as skipped
        if (skippedSet.has(questionIndex)) {
          chatPairs.push({
            question: matchingQuestion,
            answer: '[SKIPPED - Topic excluded]',
            index: questionIndex,
            skipped: true,
          })
          questionIndex++
          continue
        }
        
        if (msg.content.includes(questionStart) || msg.content === matchingQuestion) {
          // Look for the corresponding user answer (skip any commentary in between)
          for (let j = i + 1; j < chatHistory.length; j++) {
            const nextMsg = chatHistory[j]
            if (nextMsg.role === 'user') {
              chatPairs.push({
                question: matchingQuestion,
                answer: nextMsg.content,
                index: questionIndex,
              })
              questionIndex++
              break // Found the answer, move to next question
            }
            // If we hit another assistant question before finding an answer, something's wrong
            if (nextMsg.role === 'assistant' && questionIndex + 1 < QUESTIONS.length) {
              const nextQuestion = QUESTIONS[questionIndex + 1]
              // Check if next question is skipped
              if (skippedSet.has(questionIndex + 1)) {
                // Missing answer for current question, but next is skipped
                console.warn(`Missing answer for question ${questionIndex + 1}, but next is skipped`)
                questionIndex++
                break
              }
              if (nextMsg.content.includes(nextQuestion.substring(0, 30))) {
                // Missing answer for current question, skip it
                console.warn(`Missing answer for question ${questionIndex + 1}`)
                questionIndex++
                break
              }
            }
          }
        }
      }
    }

    console.log(`Extracted ${chatPairs.length} question-answer pairs from chat history`)

    // Build requester responses with both questions and answers
    // Use structured fields for Q1-Q3 if available, otherwise fall back to chat pairs
    // For structured fields, map values to display labels
    const consentAnswer = structuredFields?.consent 
      ? (structuredFields.consent === 'yes' ? 'Yes' : 'No')
      : chatPairs.find(p => p.index === 0)?.answer || ''
      
    const communicationStyleAnswer = structuredFields?.communication_style 
      ? structuredFields.communication_style
      : chatPairs.find(p => p.index === 1)?.answer || ''
      
    const exclusionsAnswer = structuredFields?.exclusions
      ? (structuredFields.exclusions === 'no_exclusions' ? 'No exclusions' : structuredFields.exclusions)
      : chatPairs.find(p => p.index === 2)?.answer || ''

    const requesterResponses: Record<string, any> = {
      consent: consentAnswer,
      communication_style: communicationStyleAnswer,
      exclusions: exclusionsAnswer,
      values: chatPairs.find(p => p.index === 3)?.answer || '',
      conflict_navigation: chatPairs.find(p => p.index === 4)?.answer || '',
      erotic_connection: chatPairs.find(p => p.index === 5 && !p.skipped)?.answer || '[SKIPPED - Topic excluded]',
      freedom_needs: chatPairs.find(p => p.index === 6)?.answer || '',
      // Include full question-answer pairs for context (excluding skipped ones)
      // Use structured fields for Q1-Q3 if available
      question_answer_pairs: [
        ...(structuredFields?.consent ? [{
          question: QUESTIONS[0],
          answer: consentAnswer,
        }] : chatPairs.filter(p => p.index === 0).map(p => ({ question: p.question, answer: p.answer }))),
        ...(structuredFields?.communication_style ? [{
          question: QUESTIONS[1],
          answer: communicationStyleAnswer,
        }] : chatPairs.filter(p => p.index === 1).map(p => ({ question: p.question, answer: p.answer }))),
        ...(structuredFields?.exclusions ? [{
          question: QUESTIONS[2],
          answer: exclusionsAnswer,
        }] : chatPairs.filter(p => p.index === 2).map(p => ({ question: p.question, answer: p.answer }))),
        ...chatPairs
          .filter(p => p.index > 2 && !p.skipped)
          .map(p => ({
            question: p.question,
            answer: p.answer,
          })),
      ],
    }

    // Convert structuredFields to RequesterStructuredFields format
    const structuredFieldsFormatted: RequesterStructuredFields = {
      relationship_structure: structuredFields.relationship_structure as 'monogamous' | 'open_to_enm' | 'enm_only' | 'unsure' | undefined,
      kink_openness: structuredFields.kink_openness as 'no' | 'maybe' | 'yes' | undefined,
      status_orientation: structuredFields.status_orientation as 'low' | 'medium' | 'high' | undefined,
    }

    // Assess requester (includes dealbreaker evaluation)
    const assessment = await assessRequester(
      requesterResponses,
      {
        self_transcendence: userRadarProfile.self_transcendence,
        self_enhancement: userRadarProfile.self_enhancement,
        rooting: userRadarProfile.rooting,
        searching: userRadarProfile.searching,
        relational: userRadarProfile.relational,
        erotic: userRadarProfile.erotic,
        consent: userRadarProfile.consent || (userRadarProfile as any).consent_dim, // Support both for migration
      },
      userRadarProfile.dealbreakers,
      structuredFieldsFormatted
    )

    // Save assessment (including dealbreaker hits - private to profile owner)
    const savedAssessment = await createRequesterAssessment(
      linkId,
      userId,
      assessment.radar,
      assessment.compatibilityScore,
      assessment.summary,
      assessment.abuseFlags,
      assessment.dealbreakerHits
    )

    return NextResponse.json({
      score: assessment.compatibilityScore,
      summary: assessment.summary,
      userRadar: {
        self_transcendence: userRadarProfile.self_transcendence,
        self_enhancement: userRadarProfile.self_enhancement,
        rooting: userRadarProfile.rooting,
        searching: userRadarProfile.searching,
        relational: userRadarProfile.relational,
        erotic: userRadarProfile.erotic,
        consent: userRadarProfile.consent || (userRadarProfile as any).consent_dim, // Support both for migration
      },
      requesterRadar: assessment.radar,
      assessmentId: savedAssessment.id,
    })
  } catch (error) {
    console.error('Error assessing requester:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: 'Failed to assess requester',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}





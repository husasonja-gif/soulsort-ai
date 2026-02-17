import { NextResponse } from 'next/server'
import { assessRequester } from '@/lib/llm'
import { getUserRadarProfile, createRequesterAssessment } from '@/lib/db'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { evaluateDealbreakers, applyDealbreakerCaps, type RequesterStructuredFields } from '@/lib/dealbreakerEngine'
import type { ChatMessage } from '@/lib/types'
import { CANONICAL_DATING_QUESTIONS } from '@/lib/datingQuestions'
import { toV4RadarAxes } from '@/lib/radarAxes'
import { buildComparisonDeepInsights } from '@/lib/deepInsights'
import { generateDeepInsightsCopy } from '@/lib/deepInsightsCopy'

/**
 * REQUESTER VECTOR STORAGE AUDIT (Part C):
 * 
 * CURRENT STATE (as of this implementation):
 * - requester_assessments table: Stores requester radar vectors (7 dims) + summary + compatibility score
 *   - This was ALREADY storing requester vectors, but WITHOUT explicit consent
 *   - Privacy concern: vectors were stored regardless of requester consent
 * 
 * NEW IMPLEMENTATION (privacy-first):
 * - requester_assessment_events: Tracks start/completion events with analytics_opt_in flag
 * - requester_assessment_traces: Stores vectors ONLY if analytics_opt_in = true
 * - requester_assessments: Still stores vectors (for compatibility results), but traces are separate for analytics
 * 
 * CONSENT FLOW:
 * - Requester sees consent toggle on intro screen (default OFF)
 * - If OFF: Assessment runs, results shown, but NO trace stored for analytics
 * - If ON: Assessment runs, results shown, AND trace stored in requester_assessment_traces
 * 
 * ANALYTICS GUARDRAILS:
 * - Requester QC metrics only shown if N >= 20 opt-in traces (to prevent re-identification)
 * - Distribution metrics use requester_assessment_events (counts only, no vectors)
 */

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
    const { linkId, userId, chatHistory, skippedQuestions = [], structuredFields = {}, session_token, analytics_opt_in = false, user_lang = 'en' } = body

    if (!linkId || !userId) {
      return NextResponse.json(
        { error: 'Link ID and User ID required' },
        { status: 400 }
      )
    }

    // CRITICAL: Deleted user / link integrity check (Part G)
    // It must be IMPOSSIBLE to compare against a deleted or unpublished profile
    const supabase = await createSupabaseServerClient()
    
    // 1. Verify link exists and is active
    // Use service role key to bypass RLS for link lookup (public links need to be accessible)
    let linkSupabase = supabase
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js')
      linkSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    }
    
    const { data: linkData, error: linkError } = await linkSupabase
      .from('user_links')
      .select('link_id, user_id, is_active')
      .eq('link_id', linkId)
      .maybeSingle()
    
    if (linkError) {
      console.error('Error fetching link:', linkError)
      console.error('Link ID:', linkId, 'User ID:', userId)
      return NextResponse.json(
        { error: 'Error fetching link', details: linkError.message },
        { status: 500 }
      )
    }
    
    if (!linkData) {
      console.error('Link not found:', linkId)
      return NextResponse.json(
        { error: 'Link not found', linkId },
        { status: 404 }
      )
    }
    
    if (!linkData.is_active) {
      console.error('Link is inactive:', linkId)
      return NextResponse.json(
        { error: 'Link is no longer active' },
        { status: 410 } // 410 Gone
      )
    }
    
    if (linkData.user_id !== userId) {
      console.error('Link user mismatch:', { linkUserId: linkData.user_id, providedUserId: userId, linkId })
      return NextResponse.json(
        { error: 'Link user mismatch' },
        { status: 404 }
      )
    }
    
    // 2. Verify user profile exists and is not deleted
    // Use service role key to bypass RLS for profile lookup
    const { data: userProfile, error: profileError } = await linkSupabase
      .from('user_profiles')
      .select('id, onboarding_completed, preferences')
      .eq('id', userId)
      .maybeSingle()
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      console.error('User ID:', userId)
      return NextResponse.json(
        { error: 'Error fetching user profile', details: profileError.message },
        { status: 500 }
      )
    }
    
    if (!userProfile) {
      console.error('User profile not found:', userId)
      return NextResponse.json(
        { error: 'User profile not found', userId },
        { status: 404 }
      )
    }
    
    if (!userProfile.onboarding_completed) {
      console.error('User profile not completed:', userId)
      return NextResponse.json(
        { error: 'User profile not completed' },
        { status: 404 }
      )
    }
    
    // 3. Get user's radar profile and dealbreakers
    if (process.env.NODE_ENV !== 'production') {
      console.log('Fetching user radar profile for userId:', userId)
    }
    const userRadarProfile = await getUserRadarProfile(userId)
    if (!userRadarProfile) {
      return NextResponse.json(
        { error: 'User radar profile not found' },
        { status: 404 }
      )
    }

    // Extract requester responses from chat history with questions and answers paired
    // Requester flow mirrors canonical 9-question free-text flow.
    const QUESTIONS = [...CANONICAL_DATING_QUESTIONS]

    // Canonical 9-question flow: no exclusions/skip logic.
    const skippedSet = new Set<number>()

    // Pair canonical questions with user answers by sequence, independent of UI language.
    // This avoids brittle assistant-text matching and supports translated question rendering.
    const chatPairs: Array<{ question: string; answer: string; index: number; skipped?: boolean }> = []
    const userMessages = chatHistory
      .filter((msg: ChatMessage) => msg.role === 'user')
      .map((msg: ChatMessage) => msg.content)
    for (let questionIndex = 0; questionIndex < QUESTIONS.length; questionIndex++) {
      if (skippedSet.has(questionIndex)) {
        chatPairs.push({
          question: QUESTIONS[questionIndex],
          answer: '[SKIPPED - Topic excluded]',
          index: questionIndex,
          skipped: true,
        })
        continue
      }
      const answer = userMessages[questionIndex]
      if (typeof answer === 'string' && answer.trim().length > 0) {
        chatPairs.push({
          question: QUESTIONS[questionIndex],
          answer: answer.trim(),
          index: questionIndex,
        })
      }
    }

    console.log(`Extracted ${chatPairs.length} question-answer pairs from chat history`)

    const requesterResponses: Record<string, any> = {
      consent: 'N/A',
      communication_style: '',
      exclusions: '',
      response_1: chatPairs.find(p => p.index === 0)?.answer || '',
      response_2: chatPairs.find(p => p.index === 1)?.answer || '',
      response_3: chatPairs.find(p => p.index === 2)?.answer || '',
      response_4: chatPairs.find(p => p.index === 3)?.answer || '',
      response_5: chatPairs.find(p => p.index === 4)?.answer || '',
      response_6: chatPairs.find(p => p.index === 5 && !p.skipped)?.answer || '',
      response_7: chatPairs.find(p => p.index === 6)?.answer || '',
      response_8: chatPairs.find(p => p.index === 7)?.answer || '',
      response_9: chatPairs.find(p => p.index === 8)?.answer || '',
      question_answer_pairs: chatPairs
        .filter(p => !p.skipped)
        .map(p => ({
          question: p.question,
          answer: p.answer,
        })),
    }

    // Convert structuredFields to RequesterStructuredFields format
    const structuredFieldsFormatted: RequesterStructuredFields = {
      relationship_structure: structuredFields.relationship_structure as 'monogamous' | 'open_to_enm' | 'enm_only' | 'unsure' | undefined,
      kink_openness: structuredFields.kink_openness as 'no' | 'maybe' | 'yes' | undefined,
      status_orientation: structuredFields.status_orientation as 'low' | 'medium' | 'high' | undefined,
    }

    // Get requester session ID if available (for tracking)
    // Note: supabase already defined above for integrity checks
    let requesterSessionId: string | null = null
    if (body.session_token) {
      const { data: session } = await supabase
        .from('requester_sessions')
        .select('id')
        .eq('session_token', body.session_token)
        .single()
      requesterSessionId = session?.id || null
    }

    // Assess requester (includes dealbreaker evaluation)
    console.log('Calling assessRequester...')
    const runAssessRequester = async () =>
      assessRequester(
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
        structuredFieldsFormatted,
        null, // userId (requester is anonymous)
        linkId,
        requesterSessionId,
        typeof user_lang === 'string' ? user_lang : 'en'
      )

    let assessment
    try {
      assessment = await runAssessRequester()
      console.log('Assessment completed successfully')
    } catch (assessError) {
      console.error('Error in assessRequester (attempt 1):', assessError)
      try {
        assessment = await runAssessRequester()
        console.log('Assessment completed successfully on retry')
      } catch (retryError) {
        console.error('Error in assessRequester (attempt 2):', retryError)
        console.error('Error stack:', retryError instanceof Error ? retryError.stack : 'No stack')
        console.error('Error message:', retryError instanceof Error ? retryError.message : String(retryError))
        throw retryError
      }
    }

    // Save assessment (including dealbreaker hits - private to profile owner)
    const requesterV4Axes = toV4RadarAxes(assessment.radar)
    const userRadarForComparison = {
      self_transcendence: userRadarProfile.self_transcendence,
      self_enhancement: userRadarProfile.self_enhancement,
      rooting: userRadarProfile.rooting,
      searching: userRadarProfile.searching,
      relational: userRadarProfile.relational,
      erotic: userRadarProfile.erotic,
      consent: userRadarProfile.consent || (userRadarProfile as any).consent_dim,
    }
    const comparisonAreas = buildComparisonDeepInsights(
      assessment.radar,
      userRadarForComparison,
      undefined,
      (userProfile as { preferences?: Record<string, number | undefined> | null })?.preferences ?? undefined,
      undefined,
      userRadarProfile.signal_scores
    ).areas
    const showDeepInsights =
      !assessment.abuseFlags.includes('gaming_detected') &&
      !assessment.abuseFlags.includes('low_engagement')
    const deepInsightsCopy = showDeepInsights
      ? await generateDeepInsightsCopy('requester', comparisonAreas)
      : undefined
    const savedAssessment = await createRequesterAssessment(
      linkId,
      userId,
      assessment.radar,
      assessment.compatibilityScore,
      assessment.summary,
      assessment.abuseFlags,
      assessment.dealbreakerHits,
      requesterV4Axes,
      deepInsightsCopy
    )

    // Store requester trace if analytics_opt_in is true (privacy-first)
    // Note: This is optional and won't fail the request if table doesn't exist yet
    if (analytics_opt_in && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        // Get OpenAI usage ID if available (for cost tracking)
        let openaiUsageId: string | null = null
        if (session_token) {
          try {
            const { data: usageData } = await supabaseAdmin
              .from('openai_usage')
              .select('id')
              .eq('requester_session_id', session_token)
              .eq('endpoint', 'requester_assess')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            openaiUsageId = usageData?.id || null
          } catch (usageError) {
            console.warn('Could not fetch OpenAI usage ID (table may not exist):', usageError)
          }
        }
        
        const { error: traceError } = await supabaseAdmin
          .from('requester_assessment_traces')
          .insert({
            link_id: linkId,
            requester_session_id: session_token || null,
            analytics_opt_in: true,
            radar: {
              self_transcendence: assessment.radar.self_transcendence,
              self_enhancement: assessment.radar.self_enhancement,
              rooting: assessment.radar.rooting,
              searching: assessment.radar.searching,
              relational: assessment.radar.relational,
              erotic: assessment.radar.erotic,
              consent: assessment.radar.consent,
            },
            model_version: 'gpt-4o-mini',
            scoring_version: 'v1',
            schema_version: 1,
            abuse_flags: assessment.abuseFlags,
            low_engagement: assessment.abuseFlags.includes('low_engagement'),
            openai_usage_id: openaiUsageId,
          })
        
        if (traceError) {
          const isMissingOptionalTable =
            traceError.message?.includes('does not exist') ||
            traceError.message?.includes('Could not find the table') ||
            traceError.code === '42P01' ||
            traceError.code === 'PGRST205'
          // Check if it's a "table doesn't exist" error - that's OK, migration not run yet
          if (isMissingOptionalTable) {
            console.warn('requester_assessment_traces table does not exist yet (migration not run). Skipping trace storage.')
          } else {
            console.error('Error storing requester assessment trace:', traceError)
          }
          // Don't fail the request if trace storage fails
        }
      } catch (error) {
        // Table might not exist yet - that's OK
        if (
          error instanceof Error &&
          (
            error.message.includes('does not exist') ||
            error.message.includes('relation') ||
            error.message.includes('Could not find the table')
          )
        ) {
          console.warn('requester_assessment_traces table does not exist yet (migration not run). Skipping trace storage.')
        } else {
          console.error('Error in requester trace storage:', error)
        }
        // Don't fail the request if trace storage fails
      }
    }

    console.log('Requester assessment summary:', {
      score: assessment.compatibilityScore,
      abuseFlags: assessment.abuseFlags,
      dealbreakerHits: assessment.dealbreakerHits.length,
      requesterRadar: assessment.radar,
    })

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
      abuseFlags: assessment.abuseFlags,
      showDeepInsights,
      userPreferences: (userProfile as { preferences?: Record<string, number | undefined> | null })?.preferences ?? null,
      userSignalScores: userRadarProfile.signal_scores ?? null,
      deepInsightsCopy,
      assessmentId: savedAssessment.id,
    })
  } catch (error) {
    console.error('Error assessing requester:', error)
    
    // Extract detailed error information
    let errorMessage = 'Unknown error'
    let errorStack: string | undefined
    let errorName: string | undefined
    let errorCode: string | undefined
    
    if (error instanceof Error) {
      errorMessage = error.message || 'Unknown error'
      errorStack = error.stack
      errorName = error.name
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      // Try to extract from error object
      errorMessage = (error as any).message || (error as any).error || JSON.stringify(error)
      errorCode = (error as any).code
      errorName = (error as any).name
    }
    
    console.error('Error details:', { 
      errorMessage, 
      errorStack, 
      errorName, 
      errorCode,
      errorType: typeof error,
      errorString: String(error)
    })
    
    // Return detailed error for debugging (in non-production, include stack)
    return NextResponse.json(
      { 
        error: 'Failed to assess requester',
        details: errorMessage,
        ...(process.env.NODE_ENV !== 'production' && errorStack ? { stack: errorStack } : {}),
        ...(errorCode ? { code: errorCode } : {}),
        ...(errorName ? { name: errorName } : {}),
      },
      { status: 500 }
    )
  }
}





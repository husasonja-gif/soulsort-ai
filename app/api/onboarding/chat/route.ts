import { NextResponse } from 'next/server'
import { claude, CURRENT_MODEL_VERSION, convertMessagesToClaude } from '@/lib/claudeClient'
import { trackLLMUsage } from '@/lib/trackLLMUsage'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import type { ChatMessage } from '@/lib/types'
import { CANONICAL_DATING_QUESTIONS } from '@/lib/datingQuestions'

const questionCommentaries = CANONICAL_DATING_QUESTIONS.map((question, index) => ({
  question: `[[Q${index + 1}]] ${question}`,
  systemPrompt: `You're providing brief, casual commentary during a SoulSort onboarding conversation.

The user just answered: "${question}"

Provide one brief, chill reflection (1 sentence max) that:
- Acknowledges what they shared in natural language
- Sounds like texting a thoughtful friend, not a therapist
- Avoids clinical/diagnostic language and avoids over-praise
- Never asks a follow-up question

Examples of tone: "That tracks", "Makes sense", "I hear you", "Got it"`,
}))

export async function POST(request: Request) {
  try {
    if (!process.env.CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      )
    }

    const { questionIndex, question, answer, chatHistory, dealbreakers, preferences } = await request.json()

    if (typeof questionIndex !== 'number' || questionIndex < 0 || questionIndex >= questionCommentaries.length) {
      return NextResponse.json(
        { error: 'Invalid question index' },
        { status: 400 }
      )
    }

    const commentaryConfig = questionCommentaries[questionIndex]

    const enhancedSystemPrompt = `${commentaryConfig.systemPrompt}

CRITICAL: You MUST ONLY provide commentary/reflection. You MUST NEVER ask questions, generate questions, or continue the conversation with new questions. Your ONLY role is to provide brief reflections on the user's answer.`

    const claudeMessages = convertMessagesToClaude([
      { role: 'system', content: enhancedSystemPrompt },
      { role: 'user', content: `Question: "${question}"\n\nTheir answer: "${answer}"` },
    ])

    const startTime = Date.now()
    const response = await claude.messages.create({
      model: CURRENT_MODEL_VERSION,
      max_tokens: 100,
      temperature: 0.8,
      ...claudeMessages,
    })
    const responseTime = Date.now() - startTime

    // Track Claude usage
    if (response.usage) {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      await trackLLMUsage({
        userId: user?.id || null,
        endpoint: 'onboarding_chat',
        model: CURRENT_MODEL_VERSION,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
        responseTimeMs: responseTime,
        success: true,
      })
    }

    let commentary = response.content[0].type === 'text' ? response.content[0].text : ''

    // Validate: Ensure commentary is not a question
    if (commentary) {
      // If it ends with a question mark, it's likely a question - reject it
      if (commentary.endsWith('?')) {
        console.warn('Commentary appears to be a question, rejecting:', commentary)
        commentary = ''
      }
      
      // Check for common question patterns
      const questionPatterns = [
        /^what\s+/i,
        /^how\s+/i,
        /^why\s+/i,
        /^when\s+/i,
        /^where\s+/i,
        /^who\s+/i,
        /^can you/i,
        /^could you/i,
        /^would you/i,
        /^do you/i,
        /^are you/i,
        /^is there/i,
      ]
      
      if (questionPatterns.some(pattern => pattern.test(commentary))) {
        console.warn('Commentary matches question pattern, rejecting:', commentary)
        commentary = ''
      }
    }

    // Fallback if commentary was rejected
    if (!commentary || commentary.trim().length < 10) {
      commentary = 'Thank you for sharing that.'
    }

    return NextResponse.json({
      commentary,
      isComplete: false,
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to generate commentary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}





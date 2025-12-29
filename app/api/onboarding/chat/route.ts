import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import type { ChatMessage } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Pre-prompted responses for each question
const questionCommentaries = [
  {
    question: 'What are three values you try to practice in your relationships?',
    systemPrompt: `You're providing brief, casual commentary during a vibe-check conversation.

The user just answered: "What are three values you try to practice in your relationships?"

Provide a brief, chill reflection (1 sentence max) that:
- Acknowledges what they said in a casual, friendly way
- Sounds like you're texting a friend, not a therapist
- Avoids therapy-speak or formal language
- Use natural, conversational language

Examples of good tone: "Cool, those make sense together" or "Nice, I can see how those connect" or "That tracks"
Avoid: "I appreciate your insight" or "That demonstrates healthy communication"`,
  },
  {
    question: 'How do you like to navigate disagreements or misunderstandings?',
    systemPrompt: `You're providing brief, casual commentary during a vibe-check conversation.

The user just answered: "How do you like to navigate disagreements or misunderstandings?"

Provide a brief, chill reflection (1 sentence max) that:
- Acknowledges their approach casually
- Sounds like you're texting a friend, not a therapist
- Avoids therapy-speak or formal language
- Use natural, conversational language

Examples of good tone: "That sounds like a solid approach" or "Makes sense" or "I hear you"
Avoid: "I appreciate your communication style" or "That demonstrates healthy conflict resolution"`,
  },
  {
    question: 'What helps you feel erotically connected to someone?',
    systemPrompt: `You're providing brief, casual commentary during a vibe-check conversation.

The user just answered: "What helps you feel erotically connected to someone?"

Provide a brief, chill reflection (1 sentence max) that:
- Acknowledges what they said in a casual, non-judgmental way
- Sounds like you're texting a friend, not a therapist
- Avoids therapy-speak or clinical language
- Is sex-positive and inclusive but casual

Examples of good tone: "Got it" or "That makes sense" or "Cool"
Avoid: "I appreciate your openness" or "That demonstrates healthy intimacy"`,
  },
  {
    question: 'How much do you need and seek freedom in your romantic relationships and what does freedom look like to you?',
    systemPrompt: `You're providing brief, casual commentary during a vibe-check conversation.

The user just answered: "How much do you need and seek freedom in your romantic relationships and what does freedom look like to you?"

Provide a brief, chill reflection (1 sentence max) that:
- Acknowledges their answer casually
- Sounds like you're texting a friend, not a therapist
- Avoids therapy-speak or formal language
- Use natural, conversational language

Examples of good tone: "That tracks" or "Makes sense" or "I hear you"
Avoid: "I appreciate your self-awareness" or "That demonstrates healthy boundary-setting"`,
  },
]

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
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

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: enhancedSystemPrompt },
      { role: 'user', content: `Question: "${question}"\n\nTheir answer: "${answer}"` },
    ]

    const startTime = Date.now()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.8,
      max_tokens: 100,
    })
    const responseTime = Date.now() - startTime

    // Track OpenAI usage
    if (response.usage) {
      const { trackOpenAIUsage } = await import('@/lib/trackOpenAIUsage')
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      await trackOpenAIUsage({
        userId: user?.id || null,
        endpoint: 'onboarding_chat',
        model: 'gpt-4o-mini',
        usage: response.usage,
        responseTimeMs: responseTime,
        success: true,
      })
    }

    let commentary = response.choices[0].message.content || ''

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





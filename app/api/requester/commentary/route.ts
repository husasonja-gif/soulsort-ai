import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ChatMessage } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(request: Request) {
  try {
    const { questionIndex, question, answer, chatHistory, communicationStyle } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Determine tone based on communication style
    let toneInstruction = ''
    switch (communicationStyle?.toLowerCase()) {
      case 'direct':
        toneInstruction = 'Be direct and straightforward. No fluff.'
        break
      case 'playful':
        toneInstruction = 'Be light, playful, and engaging. Use warmth and humor when appropriate.'
        break
      case 'reflective':
        toneInstruction = 'Be thoughtful and contemplative. Invite deeper reflection.'
        break
      case 'short-answer':
      case 'short answer':
        toneInstruction = 'Be brief and concise. Keep it to the essentials.'
        break
      default:
        toneInstruction = 'Be calm and neutral.'
    }

    const systemPrompt = `You're providing brief, casual commentary during a vibe-check conversation.

CRITICAL: You MUST ONLY provide commentary/reflection. You MUST NEVER ask questions, generate questions, or continue the conversation with new questions. Your ONLY role is to provide brief reflections on the user's answer.

Your role: Offer short, chill reflections that feel like a friend acknowledging what they said—not a therapist or teacher.

Rules:

- Respond with at most one sentence.
- Sound natural and conversational, like you're texting a friend.
- Avoid therapy-speak, clinical language, or formal phrasing.
- Don't over-explain or sound like you're teaching.
- Don't praise answers uncritically.
- Don't shame, scold, or moralize.
- Don't validate controlling, demeaning, or dismissive language.
- NEVER ask questions. NEVER generate questions. ONLY provide commentary or say nothing.

Tone:

- Chill, day-to-day conversational.
- Human and emotionally aware, but not clinical.
- Curious rather than approving.
- Neutral when answers are healthy; gently reflective when they're not.
- Use casual language—think "cool", "makes sense", "I hear you", not "I appreciate your insight" or "That demonstrates".

When answers show concerning patterns (controlling, dismissive, etc.):

- Don't label them.
- Reflect the impact rather than the intent.
- Keep it brief and casual.

If no reflection is needed: Say nothing.

Communication style: ${toneInstruction}`

    const userPrompt = `Question: ${question}

Answer: ${answer}

Provide a brief reflection if needed. If the answer is healthy and thoughtful, you may say nothing or provide minimal acknowledgment.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-4).map((m: ChatMessage) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 100,
    })

    let commentary = response.choices[0].message.content?.trim() || ''

    // Validate: Remove any question marks and check if it looks like a question
    if (commentary) {
      // If it ends with a question mark, it's likely a question - reject it
      if (commentary.endsWith('?')) {
        console.warn('Commentary appears to be a question, rejecting:', commentary)
        return NextResponse.json({ commentary: null })
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
        return NextResponse.json({ commentary: null })
      }
    }

    // Return empty if no meaningful commentary
    if (!commentary || commentary.length < 10) {
      return NextResponse.json({ commentary: null })
    }

    return NextResponse.json({ commentary })
  } catch (error) {
    console.error('Error generating commentary:', error)
    return NextResponse.json(
      { error: 'Failed to generate commentary' },
      { status: 500 }
    )
  }
}


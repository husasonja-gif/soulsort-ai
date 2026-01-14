// LLM integration for SoulSort v2: Burning Man Netherlands
// Signal extraction only - no numeric scores

import OpenAI from 'openai'
import { trackOpenAIUsage } from './trackOpenAIUsage'
import type { ChatMessage } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const CURRENT_MODEL_VERSION = 'gpt-4o'
const CURRENT_SCORING_VERSION = 'v2-bmnl'

export interface BMNLSignal {
  question_number: number
  signal_level: 'low' | 'medium' | 'high'
  is_garbage: boolean
  is_gaming: boolean
  is_phobic: boolean
  is_defensive: boolean
  mapped_axes: string[] // Which of the 6 axes this question maps to
  llm_notes?: string
}

export interface BMNLSignalOutput {
  signals: BMNLSignal[]
  flags: {
    needs_human_review: boolean
    review_reason?: string
  }
}

// Question to axis mapping
const QUESTION_AXIS_MAP: Record<number, string[]> = {
  1: ['participation', 'openness_to_learning'], // Why join, what understand
  2: ['participation', 'openness_to_learning'], // Principles easiest/challenging
  3: ['participation'], // Previous events
  4: ['self_regulation', 'consent_literacy'], // Response to intensity/overstimulation
  5: ['consent_literacy', 'inclusion_awareness'], // Boundaries when unsure
  6: ['openness_to_learning', 'self_regulation'], // Response to challenge
  7: ['openness_to_learning', 'communal_responsibility'], // Learning from impact
  8: ['inclusion_awareness', 'openness_to_learning'], // Feelings about expectations
  9: ['communal_responsibility', 'participation'], // Volunteer commitment
  10: ['communal_responsibility', 'participation'], // Gifting
  11: ['inclusion_awareness', 'communal_responsibility'], // What hope others bring
}

// BM NL Questions (exact as specified)
const BMNL_QUESTIONS = [
  'Why do you want to join this event, and what do you understand about what it is?',
  'Which Burning Man principle feels easiest for you to live by — and which one feels most challenging?',
  'Have you attended Burning Man–inspired events before? If so, which ones?',
  'Burning Man environments can be intense. How do you respond when you\'re tired, overstimulated, or out of your comfort zone in a group?',
  'Not all boundaries are explicit here. How do you act when you\'re unsure what\'s welcome or appropriate?',
  'If someone gently challenges your behavior during the event, how do you respond?',
  'How do you respond when you learn something you did affected someone negatively (even unintentionally)?',
  'How do you feel about there being expectations or standards of behaviour?',
  'Will you commit to one or two volunteer shifts during the event?',
  'What would you like to gift to the burn (time, skills, care, creativity)?',
  'What do you hope others will bring or offer — to you or to the community?',
]

export function getBMNLQuestion(questionNumber: number): string {
  return BMNL_QUESTIONS[questionNumber - 1] || ''
}

/**
 * Extract signals from a single answer
 */
export async function extractSignalFromAnswer(
  questionNumber: number,
  questionText: string,
  answer: string,
  chatHistory: ChatMessage[]
): Promise<BMNLSignal> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const mappedAxes = QUESTION_AXIS_MAP[questionNumber] || []

  const systemPrompt = `You are a signal extraction assistant for Burning Man Netherlands cultural onboarding.

Your job is to analyze a participant's answer and extract behavioral/psychological signals.

CRITICAL RULES:
- Return ONLY valid JSON. No prose.
- Do not judge morality or values - extract signals about understanding, effort, and behavior
- There are no "correct" answers - uncertainty is acceptable
- Low effort or bullshitting should be flagged
- Phobic/exclusionary language must be flagged
- Defensive responses should be flagged

SIGNAL LEVELS:
- "low": Answer shows minimal engagement, understanding, or reflection
- "medium": Answer shows some engagement and understanding
- "high": Answer shows strong engagement, reflection, and understanding

FLAGS:
- is_garbage: Response is "test", random letters, copy-paste nonsense, or prompt-engineering
- is_gaming: Attempts to manipulate or game the system
- is_phobic: Contains explicit homophobia, transphobia, fatphobia, or other exclusionary language
- is_defensive: Shows extreme defensiveness or refusal to engage

OUTPUT FORMAT:
{
  "signal_level": "low" | "medium" | "high",
  "is_garbage": boolean,
  "is_gaming": boolean,
  "is_phobic": boolean,
  "is_defensive": boolean,
  "llm_notes": "brief note for human review (optional)"
}`

  const userPrompt = `Question ${questionNumber}: ${questionText}

Answer: ${answer}

Previous context:
${chatHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

Extract signals for this answer.`

  try {
    const completion = await openai.chat.completions.create({
      model: CURRENT_MODEL_VERSION,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    // Validate and ensure defaults
    const signal: BMNLSignal = {
      question_number: questionNumber,
      signal_level: ['low', 'medium', 'high'].includes(result.signal_level) 
        ? result.signal_level 
        : 'medium',
      is_garbage: Boolean(result.is_garbage),
      is_gaming: Boolean(result.is_gaming),
      is_phobic: Boolean(result.is_phobic),
      is_defensive: Boolean(result.is_defensive),
      mapped_axes: mappedAxes,
      llm_notes: result.llm_notes || undefined,
    }

    // Track usage
    const startTime = Date.now()
    await trackOpenAIUsage({
      userId: null,
      endpoint: 'bmnl_signal_extraction',
      model: CURRENT_MODEL_VERSION,
      usage: {
        prompt_tokens: completion.usage?.prompt_tokens || 0,
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0,
      },
      responseTimeMs: Date.now() - startTime,
      success: true,
    })

    return signal
  } catch (error) {
    console.error('Error extracting signal:', error)
    
    // Default to medium signal if extraction fails
    return {
      question_number: questionNumber,
      signal_level: 'medium',
      is_garbage: false,
      is_gaming: false,
      is_phobic: false,
      is_defensive: false,
      mapped_axes: mappedAxes,
    }
  }
}

/**
 * Aggregate signals into radar profile (code-level, not LLM)
 */
export function aggregateSignalsToRadar(signals: BMNLSignal[]): {
  participation: 'low' | 'medium' | 'high'
  consent_literacy: 'low' | 'medium' | 'high'
  communal_responsibility: 'low' | 'medium' | 'high'
  inclusion_awareness: 'low' | 'medium' | 'high'
  self_regulation: 'low' | 'medium' | 'high'
  openness_to_learning: 'low' | 'medium' | 'high'
  gate_experience: 'basic' | 'needs_orientation'
} {
  const axisScores: Record<string, number[]> = {
    participation: [],
    consent_literacy: [],
    communal_responsibility: [],
    inclusion_awareness: [],
    self_regulation: [],
    openness_to_learning: [],
  }

  // Collect signal levels for each axis
  signals.forEach(signal => {
    const levelValue = signal.signal_level === 'high' ? 3 : signal.signal_level === 'medium' ? 2 : 1
    
    signal.mapped_axes.forEach(axis => {
      if (axisScores[axis]) {
        axisScores[axis].push(levelValue)
      }
    })
  })

  // Aggregate: if any flag is true, cap at medium
  const hasFlags = signals.some(s => s.is_garbage || s.is_gaming || s.is_phobic || s.is_defensive)

  // Convert to low/medium/high
  const aggregate = (scores: number[]): 'low' | 'medium' | 'high' => {
    if (scores.length === 0) return 'medium'
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    if (hasFlags && avg > 2) return 'medium' // Cap if flags present
    if (avg >= 2.5) return 'high'
    if (avg >= 1.5) return 'medium'
    return 'low'
  }

  const radar = {
    participation: aggregate(axisScores.participation),
    consent_literacy: aggregate(axisScores.consent_literacy),
    communal_responsibility: aggregate(axisScores.communal_responsibility),
    inclusion_awareness: aggregate(axisScores.inclusion_awareness),
    self_regulation: aggregate(axisScores.self_regulation),
    openness_to_learning: aggregate(axisScores.openness_to_learning),
  }

  // Determine gate experience
  const highCount = Object.values(radar).filter(v => v === 'high').length
  const lowCount = Object.values(radar).filter(v => v === 'low').length
  const hasPhobic = signals.some(s => s.is_phobic)
  const hasDefensive = signals.some(s => s.is_defensive)

  const gate_experience: 'basic' | 'needs_orientation' = 
    (lowCount >= 3 || hasPhobic || hasDefensive) ? 'needs_orientation' : 'basic'

  return {
    ...radar,
    gate_experience,
  }
}


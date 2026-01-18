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
  signal_level: 'low' | 'emerging' | 'stable' | 'mastering'
  is_garbage: boolean
  is_gaming: boolean
  is_phobic: boolean
  is_defensive: boolean
  mapped_axes: Array<{ axis: string; weight: number }> // Axis name and weight (1.0 for primary, 0.5 for secondary)
  llm_notes?: string
}

export interface BMNLSignalOutput {
  signals: BMNLSignal[]
  flags: {
    needs_human_review: boolean
    review_reason?: string
  }
}

// Question to axis mapping with weights (EXACT as per table - NO EXCEPTIONS)
// Primary axis = weight 1.0, Secondary axis = weight 0.5
export const QUESTION_AXIS_MAP: Record<number, Array<{ axis: string; weight: number }>> = {
  1: [
    { axis: 'openness_to_learning', weight: 0.5 },
    { axis: 'participation', weight: 0.5 }
  ], // Q1: Openness to learning, Participation (both equal)
  2: [
    { axis: 'openness_to_learning', weight: 0.5 },
    { axis: 'participation', weight: 0.5 }
  ], // Q2: Openness to learning, Participation (both equal)
  3: [
    { axis: 'openness_to_learning', weight: 0.5 },
    { axis: 'self_regulation', weight: 0.5 }
  ], // Q3: Openness to learning, Self-regulation (both equal)
  4: [
    { axis: 'self_regulation', weight: 1.0 }, // Primary
    { axis: 'inclusion_awareness', weight: 0.5 }
  ], // Q4: Self-regulation (primary), Inclusion awareness
  5: [
    { axis: 'consent_literacy', weight: 1.0 }, // Primary
    { axis: 'inclusion_awareness', weight: 0.5 }
  ], // Q5: Consent literacy (primary), Inclusion awareness
  6: [
    { axis: 'openness_to_learning', weight: 1.0 }, // Primary
    { axis: 'self_regulation', weight: 0.5 }
  ], // Q6: Openness to learning (primary), Self-regulation
  7: [
    { axis: 'inclusion_awareness', weight: 1.0 }, // Primary
    { axis: 'consent_literacy', weight: 0.5 },
    { axis: 'self_regulation', weight: 0.5 }
  ], // Q7: Inclusion awareness (primary), Consent literacy, Self-regulation
  8: [
    { axis: 'communal_responsibility', weight: 0.5 },
    { axis: 'openness_to_learning', weight: 0.5 }
  ], // Q8: Communal responsibility, Openness to learning (both equal)
  9: [
    { axis: 'participation', weight: 1.0 }, // Primary
    { axis: 'communal_responsibility', weight: 0.5 }
  ], // Q9: Participation (primary), Communal responsibility
  10: [
    { axis: 'participation', weight: 0.5 },
    { axis: 'communal_responsibility', weight: 0.5 }
  ], // Q10: Participation, Communal responsibility (both equal)
  11: [
    { axis: 'communal_responsibility', weight: 1.0 }, // Primary
    { axis: 'openness_to_learning', weight: 0.5 }
  ], // Q11: Communal responsibility (primary), Openness to learning
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
  
  // Ensure mappedAxes is in the correct format
  if (mappedAxes.length === 0) {
    console.warn(`No axis mapping found for question ${questionNumber}`)
  }

  const systemPrompt = `You are a signal extraction assistant for Burning Man Netherlands cultural onboarding.

Your job is to analyze a participant's answer and extract behavioral/psychological signals.

CRITICAL RULES:
- Return ONLY valid JSON. No prose.
- Do not judge morality or values - extract signals about understanding, effort, and behavior
- There are no "correct" answers - uncertainty is acceptable, but should be reflected in signal level
- Low effort or bullshitting should be flagged
- Phobic/exclusionary language must be flagged
- Defensive responses should be flagged
- IMPORTANT: Differentiate signal levels based on depth, reflection, and engagement shown in the answer
- **CRITICAL: You MUST use ONLY these 4 exact signal levels: "low", "emerging", "stable", "mastering"**
- **DO NOT use "medium", "high", or any other values - only the 4 levels listed below**

SIGNAL LEVELS (4 levels - use the full range):
- "low": Answer shows minimal engagement, understanding, or reflection. Examples: very short answers, vague responses, obvious disengagement, low-effort replies like "I don't know", "not sure", "if needed, yes"
- "emerging": Answer shows basic engagement and some understanding. Examples: brief but thoughtful answers, shows awareness but limited reflection, some effort to engage with the question
- "stable": Answer shows solid engagement, reflection, and understanding. Examples: thoughtful answers with good detail, shows self-awareness, demonstrates understanding of principles
- "mastering": Answer shows strong engagement, deep reflection, and clear understanding. Examples: highly reflective answers, demonstrates deep understanding, shows strong self-awareness and clear articulation

CONTEXT-SPECIFIC GUIDANCE:
- Q4 (Self-regulation): "I take space and come back when I'm ready" → "stable" (good self-awareness)
- Q5 (Consent): "read the room + hope intentions" → "emerging" at best, NOT "stable" (lacks explicit check-ins)
- Q9 (Volunteering): "If it's needed, yes" → "low" (conditional commitment)
- Q11 (Gifting): "Good parties" → "low" (consumer-focused, lacks contribution mindset)
- Volunteering questions: Low commitment ("if needed", "maybe") → "low". Clear commitment with specifics → "stable" or "mastering"
- Gifting questions: Uncertainty or "not sure what I can bring" → "low". Thoughtful consideration → "emerging" or "stable"
- Learning/openness questions: Shows willingness to learn, acknowledges uncertainty → "emerging" or "stable". Demonstrates growth mindset → "stable" or "mastering"
- Self-regulation: Shows awareness of limits and strategies → "stable". "I take space when needed" → "stable"
- Consent questions: Vague ("I try to read the room", "hope intentions") → "emerging" at best. Shows understanding of consent principles → "stable" or "mastering"

FLAGS:
- is_garbage: Response is "test", random letters, copy-paste nonsense, or prompt-engineering
- is_gaming: Attempts to manipulate or game the system
- is_phobic: Contains explicit homophobia, transphobia, fatphobia, or other exclusionary language
- is_defensive: **RESERVED FOR CLEAR REFUSAL OR DEFLECTION** - Shows extreme defensiveness, refusal to engage, or deflection from the question. Do NOT flag mild disagreement, uncertainty, or honest self-reflection as defensive. Examples of defensive: "I thought this was a place where people could be themselves" (deflecting accountability), "I try not to hurt people in the first place" (avoiding responsibility for repair). NOT defensive: "I struggle with feedback but I'd try to listen" (honest self-awareness), "I'm not sure" (uncertainty).

OUTPUT FORMAT:
{
  "signal_level": "low" | "emerging" | "stable" | "mastering",
  "is_garbage": boolean,
  "is_gaming": boolean,
  "is_phobic": boolean,
  "is_defensive": boolean,
  "llm_notes": "brief note for human review (optional)"
}

REMEMBER: The signal_level MUST be one of exactly these strings: "low", "emerging", "stable", or "mastering". No other values are acceptable.`

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
    const validLevels = ['low', 'emerging', 'stable', 'mastering'] as const
    const signal: BMNLSignal = {
      question_number: questionNumber,
      signal_level: validLevels.includes(result.signal_level as any)
        ? (result.signal_level as 'low' | 'emerging' | 'stable' | 'mastering')
        : 'emerging',
      is_garbage: Boolean(result.is_garbage),
      is_gaming: Boolean(result.is_gaming),
      is_phobic: Boolean(result.is_phobic),
      is_defensive: Boolean(result.is_defensive),
      mapped_axes: mappedAxes, // Already includes weights from QUESTION_AXIS_MAP
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
    
      // Default to emerging signal if extraction fails
      return {
        question_number: questionNumber,
        signal_level: 'emerging' as const,
        is_garbage: false,
        is_gaming: false,
        is_phobic: false,
        is_defensive: false,
        mapped_axes: mappedAxes,
      }
  }
}

/**
 * Aggregate signals into radar profile using mean+max hybrid model
 * Uses 4 levels: low, emerging, stable, mastering
 * 
 * Aggregation Model (Option 1 - Mean+Max Hybrid):
 * - For each axis: hybridScore = 0.75 * weightedMean + 0.25 * maxValue
 * - This avoids one vague answer pulling everything down and rewards at least one strong demonstration
 * - Preserves "integrators" while avoiding flattening variance
 */
export function aggregateSignalsToRadar(signals: BMNLSignal[]): {
  participation: 'low' | 'emerging' | 'stable' | 'mastering'
  consent_literacy: 'low' | 'emerging' | 'stable' | 'mastering'
  communal_responsibility: 'low' | 'emerging' | 'stable' | 'mastering'
  inclusion_awareness: 'low' | 'emerging' | 'stable' | 'mastering'
  self_regulation: 'low' | 'emerging' | 'stable' | 'mastering'
  openness_to_learning: 'low' | 'emerging' | 'stable' | 'mastering'
  gate_experience: 'basic' | 'needs_orientation'
} {
  // Check for hard fail flags: gaming/garbage -> all axes low, phobic -> max "emerging"
  const hasGaming = signals.some(s => s.is_gaming)
  const hasGarbage = signals.some(s => s.is_garbage)
  const hasPhobic = signals.some(s => s.is_phobic)
  
  if (hasGaming || hasGarbage) {
    // Hard fail: all axes to low, gate needs_orientation
    return {
      participation: 'low',
      consent_literacy: 'low',
      communal_responsibility: 'low',
      inclusion_awareness: 'low',
      self_regulation: 'low',
      openness_to_learning: 'low',
      gate_experience: 'needs_orientation',
    }
  }

  // Map signal levels to numeric values (4 levels)
  // Also handle old 3-level system for backwards compatibility
  const levelToValue: Record<string, number> = {
    'low': 1,
    'emerging': 2,
    'stable': 3,
    'mastering': 4,
    // Backwards compatibility: map old 3-level system to 4-level
    'medium': 2, // Map old "medium" to "emerging"
    'high': 3,   // Map old "high" to "stable"
  }

  // Collect per-question values and weights for each axis
  // Structure: { axis: [{ value, weight, question_number }] }
  const axisContributions: Record<string, Array<{ value: number; weight: number; question_number: number }>> = {
    participation: [],
    consent_literacy: [],
    communal_responsibility: [],
    inclusion_awareness: [],
    self_regulation: [],
    openness_to_learning: [],
  }

  // Collect contributing question values for each axis
  signals.forEach(signal => {
    let levelValue = levelToValue[signal.signal_level]
    
    // Fallback: if signal level is invalid, default to "emerging" (2)
    if (!levelValue || isNaN(levelValue)) {
      console.warn('Invalid signal level:', signal.signal_level, 'for question', signal.question_number, '- defaulting to "emerging"')
      levelValue = 2 // Default to "emerging"
    }
    
    // Use mapped_axes with weights (primary = 1.0, secondary = 0.5)
    signal.mapped_axes.forEach(({ axis, weight }) => {
      if (axisContributions[axis]) {
        axisContributions[axis].push({
          value: levelValue, // Unweighted value per question
          weight: weight,
          question_number: signal.question_number,
        })
      }
    })
  })

  // Debug: log collected contributions
  if (process.env.NODE_ENV !== 'production') {
    console.log('Axis contributions collected:', Object.entries(axisContributions).map(([axis, contribs]) => ({
      axis,
      count: contribs.length,
      contributions: contribs.map(c => ({ q: c.question_number, v: c.value, w: c.weight })),
    })))
  }

  // Aggregate using mean+max hybrid: 0.75 * weightedMean + 0.25 * maxValue
  const aggregate = (contribs: Array<{ value: number; weight: number; question_number: number }>, axisName: string): 'low' | 'emerging' | 'stable' | 'mastering' => {
    if (contribs.length === 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`No contributions for axis: ${axisName}`)
      }
      return 'emerging'
    }

    // Calculate weighted mean: sum(value * weight) / sum(weight)
    const sumWeighted = contribs.reduce((sum, c) => sum + (c.value * c.weight), 0)
    const sumWeights = contribs.reduce((sum, c) => sum + c.weight, 0)
    
    if (sumWeights === 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`No weights for axis: ${axisName}`)
      }
      return 'emerging'
    }
    
    const weightedMean = sumWeighted / sumWeights
    
    // Calculate max value (ignore weights for max)
    const maxValue = Math.max(...contribs.map(c => c.value))
    
    // Hybrid score: 0.75 * weightedMean + 0.25 * maxValue
    const hybridScore = 0.75 * weightedMean + 0.25 * maxValue
    
    // Debug logging
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Axis ${axisName}: weightedMean=${weightedMean.toFixed(2)}, maxValue=${maxValue}, hybridScore=${hybridScore.toFixed(2)}`)
    }
    
    // Map hybrid score to 4 levels
    // hybridScore ranges from 1.0 (low) to 4.0 (mastering)
    // Thresholds: 
    // - low: < 1.75 (strictly below emerging)
    // - emerging: 1.75 - 2.75
    // - stable: 2.75 - 3.5
    // - mastering: >= 3.5
    if (hybridScore >= 3.5) return 'mastering'
    if (hybridScore >= 2.75) return 'stable'
    if (hybridScore >= 1.75) return 'emerging'
    return 'low'
  }

  // Compute radar using mean+max hybrid
  let radar = {
    participation: aggregate(axisContributions.participation, 'participation'),
    consent_literacy: aggregate(axisContributions.consent_literacy, 'consent_literacy'),
    communal_responsibility: aggregate(axisContributions.communal_responsibility, 'communal_responsibility'),
    inclusion_awareness: aggregate(axisContributions.inclusion_awareness, 'inclusion_awareness'),
    self_regulation: aggregate(axisContributions.self_regulation, 'self_regulation'),
    openness_to_learning: aggregate(axisContributions.openness_to_learning, 'openness_to_learning'),
  }

  // Apply phobic cap: if phobic, cap all axes at "emerging"
  if (hasPhobic) {
    radar = {
      participation: radar.participation === 'low' ? 'low' : 'emerging',
      consent_literacy: radar.consent_literacy === 'low' ? 'low' : 'emerging',
      communal_responsibility: radar.communal_responsibility === 'low' ? 'low' : 'emerging',
      inclusion_awareness: radar.inclusion_awareness === 'low' ? 'low' : 'emerging',
      self_regulation: radar.self_regulation === 'low' ? 'low' : 'emerging',
      openness_to_learning: radar.openness_to_learning === 'low' ? 'low' : 'emerging',
    }
  }

  // Determine gate experience with stricter logic
  // Hard flags: phobic/garbage/gaming -> always needs_orientation (already handled above)
  const lowCount = Object.values(radar).filter(v => v === 'low').length
  const defensiveCount = signals.filter(s => s.is_defensive).length
  
  // Gate logic:
  // - Hard flags (phobic/garbage/gaming) -> always needs_orientation (already set above)
  // - Defensive alone: 1 = soft (no orientation), 2+ = review but not necessarily orientation
  // - Defensive + consent_literacy low -> needs_orientation
  // - lowCount >= 4 OR (lowCount >= 3 AND (consent_literacy low OR communal_responsibility low)) -> needs_orientation
  let gate_experience: 'basic' | 'needs_orientation' = 'basic'
  
  if (hasPhobic || hasGaming || hasGarbage) {
    gate_experience = 'needs_orientation' // Hard flags already handled
  } else if (defensiveCount >= 2 && radar.consent_literacy === 'low') {
    gate_experience = 'needs_orientation' // Defensive + consent literacy low
  } else if (lowCount >= 4) {
    gate_experience = 'needs_orientation' // Stricter: 4+ low axes
  } else if (lowCount >= 3 && (radar.consent_literacy === 'low' || radar.communal_responsibility === 'low')) {
    gate_experience = 'needs_orientation' // 3+ low with critical axes low
  } else {
    gate_experience = 'basic' // Default: not bad enough for orientation
  }

  return {
    ...radar,
    gate_experience,
  }
}

/**
 * Generate interleaved commentary on participant's answer
 * Provides cultural guidance and reflection
 */
export async function generateCommentary(
  questionNumber: number,
  questionText: string,
  answer: string,
  chatHistory: ChatMessage[]
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  // Question-specific steering prompts based on the table
  const questionSteering: Record<number, string> = {
    1: `This event is less about consuming an experience and more about contributing to it. If you're new, that's fine — what matters is curiosity and willingness to participate.`,
    2: `Naming a principle is a good start. What we're really assessing is how you translate it into behavior — especially when things get messy or inconvenient.`,
    3: `Experience can help, but it's not required. Every event has its own culture — showing up curious tends to land better than assuming you already know the norms.`,
    4: `This space asks people to notice their limits early. Taking space, resting, hydrating, eating — that's not 'weak,' it's self-governance. Silent spiraling often becomes other people's problem.`,
    5: `When norms are unclear, checking in is always safer than assuming. Curiosity + restraint builds trust faster than confidence.`,
    6: `Being challenged isn't a moral failure — it's often a repair moment. Listening first usually creates more safety than defending intent.`,
    7: `Impact matters here, even when harm wasn't intended. The fastest repair is usually: acknowledge, apologize if needed, adjust behavior, move on.`,
    8: `Autonomy and standards coexist here. Shared guidelines exist to protect everyone's experience — engaging with them is part of participating, not a limitation of freedom.`,
    9: `Volunteering isn't optional here — it's how the event functions. We need everyone to commit to shifts. Sign up early to spread the load fairly. Unsexy shifts like toilets are genuinely appreciated and help you meet people fast. This is a need-to-have, not a nice-to-have.`,
    10: `Decommodification only works if people actually gift. There's real joy in seeing others enjoy what you give. Gifting doesn't need to be impressive — small, consistent offerings matter — but it does need to happen. What you bring creates the magic.`,
    11: `It's natural to have hopes, but this space works best when expectations are paired with contribution. The more people give, the richer the atmosphere becomes.`,
  }

  const systemPrompt = `You are a cultural onboarding assistant for Burning Man Netherlands. Your role is to provide brief, direct commentary that:
- Acknowledges what the participant shared
- Proactively steers them toward cultural expectations using the provided steering guidance
- For questions 9 and 10 (volunteering and gifting), be more challenging and direct — these are non-negotiable aspects of participation
- Reflects on their understanding of Burning Man principles
- Is warm, direct, and practical (not preachy or judgmental)
- Keeps responses to 1-2 sentences maximum

Tone: Supportive but direct, practical, like a friendly gate greeter. For volunteering and gifting questions, be more assertive — these aren't optional.

If their answer shows strong understanding, acknowledge it briefly. If it shows gaps or hesitancy (especially on volunteering/gifting), use the steering guidance to challenge them more directly.`

  const steeringGuidance = questionSteering[questionNumber] || 'Thank you for sharing that. Let\'s continue.'

  const userPrompt = `Question ${questionNumber}: ${questionText}

Participant's answer: ${answer}

Steering guidance for this question: ${steeringGuidance}

Previous conversation context:
${chatHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n\n')}

Provide brief commentary (1-2 sentences) that acknowledges their answer and uses the steering guidance to gently guide cultural understanding if needed. Adapt the steering guidance to their specific answer - don't just repeat it verbatim.`

  try {
    const completion = await openai.chat.completions.create({
      model: CURRENT_MODEL_VERSION,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    })

    const commentary = completion.choices[0].message.content?.trim() || ''
    
    // Track usage
    await trackOpenAIUsage({
      userId: null,
      endpoint: 'bmnl_commentary',
      model: CURRENT_MODEL_VERSION,
      usage: {
        prompt_tokens: completion.usage?.prompt_tokens || 0,
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0,
      },
      responseTimeMs: 0,
      success: true,
    })

    return commentary
  } catch (error) {
    console.error('Error generating commentary:', error)
    // Return a default supportive message if LLM fails
    return 'Thank you for sharing that. Let\'s continue.'
  }
}


// LLM integration utilities for SoulSort AI
import OpenAI from 'openai'
import { trackOpenAIUsage } from './trackOpenAIUsage'
import type { ChatMessage, RadarDimensions } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const CURRENT_MODEL_VERSION = 'gpt-4o'
const CURRENT_SCORING_VERSION = 'v3'
const CURRENT_SCHEMA_VERSION = 3

export { CURRENT_MODEL_VERSION, CURRENT_SCORING_VERSION, CURRENT_SCHEMA_VERSION }

export interface CanonicalVectors {
  values_vector: number[] // 5 elements
  erotic_vector: number[] // 5 elements
  relational_vector: number[] // 5 elements
  consent_vector: number[] // 4 elements
}

export interface RadarChart {
  Self_Transcendence: number
  Self_Enhancement: number
  Rooting: number
  Searching: number
  Relational: number
  Erotic: number
  Consent: number
}

export interface UserProfileOutput {
  values_delta: number[] // 5 deltas [-0.2, +0.2]
  erotic_delta: number[] // 5 deltas [-0.2, +0.2]
  relational_delta: number[] // 5 deltas [-0.2, +0.2]
  consent_delta: number[] // 4 deltas [-0.2, +0.2]
  flags: {
    low_evidence: boolean
    gaming_detected: boolean
  }
}

/**
 * Generate user radar profile from survey responses and chat history
 */
export async function generateUserRadarProfile(
  surveyResponses: Record<string, any>,
  chatHistory: ChatMessage[],
  userId?: string | null,
  linkId?: string | null
): Promise<CanonicalVectors & { chart: RadarChart; dealbreakers: string[] }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    // Extract dealbreakers and preferences from survey data
    const dealbreakers = Array.isArray(surveyResponses.dealbreakers) 
      ? surveyResponses.dealbreakers 
      : []
    const preferences = surveyResponses.preferences || {}

    // Compute priors deterministically from sliders
    const pace = preferences.pace || 50
    const connectionChemistry = preferences.connection_chemistry || 50
    const kink = preferences.vanilla_kinky || 50
    const monogamy = preferences.open_monogamous || 50
    
    // BOUNDARIES SCALE V2: Unified computation for backward compatibility
    // Old users: boundaries (0-100) represents difficulty (0=easy, 100=hard)
    // New users: boundaries_ease (0-100) represents ease (0=hard, 100=easy)
    // We compute a unified boundariesEase (0-100, where higher = easier) for consistent priors
    const boundariesScaleVersion = preferences.boundaries_scale_version || 1
    let boundariesEase: number
    if (boundariesScaleVersion === 2 && preferences.boundaries_ease !== undefined) {
      // New scale: boundaries_ease is already ease (0=hard, 100=easy)
      boundariesEase = preferences.boundaries_ease
    } else {
      // Old scale: boundaries represents difficulty, invert to get ease
      const oldBoundaries = preferences.boundaries || 50
      boundariesEase = 100 - oldBoundaries
    }

    // Baseline = deterministic sliders ONLY
    // Everything not directly represented by a slider starts at 0.0
    // Chat evidence must earn movement
    const basePriors = {
      // VALUES_VECTOR (5) - all start at 0.0 (no sliders)
      self_transcendence: 0.0,
      self_enhancement: 0.0,
      rooting: 0.0,
      searching: 0.0,
      stability_orientation: 0.0,

      // EROTIC_VECTOR (5)
      erotic_pace: pace / 100.0, // slider
      desire_intensity: 0.0, // no slider
      fantasy_openness: kink / 100.0, // slider
      erotic_attunement: 0.0, // no slider (removed connection-first nudge)
      boundary_directness: boundariesEase / 100.0, // slider

      // RELATIONAL_VECTOR (5)
      enm_openness: (100 - monogamy) / 100.0, // slider
      exclusivity_comfort: monogamy / 100.0, // slider
      freedom_orientation: 0.0, // no slider
      attraction_depth_preference: (100 - connectionChemistry) / 100.0, // slider
      communication_style: 0.0, // no slider

      // CONSENT_VECTOR (4)
      consent_awareness: 0.0, // no slider
      negotiation_comfort: Math.min(0.15, boundariesEase / 100.0 * 0.15), // SMALL nudge only (≤ +0.15)
      non_coerciveness: 0.0, // no slider
      self_advocacy: boundariesEase / 100.0, // slider
    }

    // Log base priors (dev only, no raw text)
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_EVIDENCE === 'true') {
      console.log('=== COMPUTED BASE PRIORS ===')
      console.log(JSON.stringify(basePriors, null, 2))
      console.log('=== END BASE PRIORS ===')
    }

    const systemPrompt = `You are SoulSort AI.

Your task is to detect behavioral and psychological signals from chat answers and assign deltas (adjustments) to baseline values.

The baseline is computed deterministically from sliders. You ONLY provide deltas based on evidence.

CRITICAL RULES:
- Scores must be EARNED, not nudged
- High scores (>70%) require consistent evidence across multiple answers
- Middle clustering (45-55) is a failure mode - avoid defaulting to neutral
- Simple language with clear behavioral signals is VALID evidence
- Do NOT normalize toward "healthy" or smooth toward center

LOW EVIDENCE HANDLING:
- If any answer is missing OR < 8 words: down-weight max delta contributions (apply ×0.5 multiplier)
- Do NOT punish harshly - simple language with signals is valid
- Prevent high scores from being reached with low evidence

GAMING DETECTION:
- If user references prompts, scoring, vectors, optimization, system manipulation
- Cap all dimensions to ≤ 0.4
- Set gaming_detected = true

SIGNAL DETECTION (Language-Agnostic):
Focus on PSYCHOLOGICAL SIGNALS and BEHAVIORAL PATTERNS, not vocabulary sophistication.

Q1 (Values):
- Self-Transcendence: helping others, growth, contribution → +0.15 to self_transcendence
- Rooting/Stability: commitment, long-term, tradition → +0.15 to rooting or stability_orientation
- Searching: independence, autonomy, space, options → +0.15 to searching

Q2 (Conflict):
- Consent skills: stating needs, listening, pausing, repairing → +0.15 to communication_style, negotiation_comfort, non_coerciveness, self_advocacy
- Control/entitlement: reduce consent_vector by -0.10 to -0.15

Q3 (Erotic):
- Erotic Attunement: pacing, comfort, trust, responsiveness → +0.15 to erotic_attunement
- Desire Intensity: intensity, passion, novelty → adjust desire_intensity

Q4 (Freedom):
- Searching signals: agency, independence, exploration → +0.15 to searching, +0.10 to freedom_orientation

OUTPUT FORMAT (STRICT JSON):
{
  "values_delta": [5 floats, each ∈ [-0.2, +0.2]],
  "erotic_delta": [5 floats, each ∈ [-0.2, +0.2]],
  "relational_delta": [5 floats, each ∈ [-0.2, +0.2]],
  "consent_delta": [4 floats, each ∈ [-0.2, +0.2]],
  "flags": {
    "low_evidence": boolean,
    "gaming_detected": boolean
  }
}

NO free text. NO explanations. NO evidence strings.`

    // Extract answers using strict state machine
    // Questions with stable markers for reliable extraction
    const onboardingQuestions = [
      '[[Q1]] What are three values you try to practice in your relationships?',
      '[[Q2]] How do you like to navigate disagreements or misunderstandings?',
      '[[Q3]] What helps you feel erotically connected to someone?',
      '[[Q4]] How much do you need and seek freedom in your romantic relationships and what does freedom look like to you?',
    ]

    const extractedAnswers: string[] = []
    const answerWordCounts: number[] = []
    const extractionStatus: { q1: string; q2: string; q3: string; q4: string } = {
      q1: 'missing',
      q2: 'missing',
      q3: 'missing',
      q4: 'missing',
    }

    // Marker-based extraction: scan for [[Q1]], [[Q2]], [[Q3]], [[Q4]] markers
    for (let i = 0; i < chatHistory.length; i++) {
      const msg = chatHistory[i]
      
      if (msg.role === 'assistant' && msg.content) {
        // Check for markers
        for (let qIdx = 0; qIdx < 4; qIdx++) {
          const marker = `[[Q${qIdx + 1}]]`
          if (msg.content.includes(marker)) {
            // Found marker, look for next user message as answer
            let foundAnswer = false
            for (let j = i + 1; j < chatHistory.length; j++) {
              const nextMsg = chatHistory[j]
              if (nextMsg.role === 'user' && nextMsg.content) {
                extractedAnswers[qIdx] = nextMsg.content
                // Compute word count (split by whitespace, filter empty)
                const words = nextMsg.content.trim().split(/\s+/).filter(w => w.length > 0)
                answerWordCounts[qIdx] = words.length
                extractionStatus[`q${qIdx + 1}` as keyof typeof extractionStatus] = 'found'
                foundAnswer = true
                break
              }
              // If we hit another marker before finding answer, mark as missing
              if (nextMsg.role === 'assistant' && nextMsg.content) {
                for (let k = 0; k < 4; k++) {
                  if (nextMsg.content.includes(`[[Q${k + 1}]]`)) {
                    break
                  }
                }
              }
            }
            if (!foundAnswer) {
              extractedAnswers[qIdx] = 'Not answered'
              answerWordCounts[qIdx] = 0
            }
            break // Found this marker, move on
          }
        }
      }
    }

    // Ensure we have 4 answers (fill with placeholders if needed)
    for (let i = 0; i < 4; i++) {
      if (!extractedAnswers[i]) {
        extractedAnswers[i] = 'Not answered'
        answerWordCounts[i] = 0
      }
    }

    // Log extracted answers (word counts only, no raw text for privacy)
    const enableDebugEvidence = process.env.DEBUG_EVIDENCE === 'true' && process.env.NODE_ENV !== 'production'
    if (enableDebugEvidence) {
      console.log('=== EXTRACTED ONBOARDING ANSWERS (DEV ONLY) ===')
      extractedAnswers.forEach((ans, idx) => {
        const wordCount = answerWordCounts[idx] || 0
        const status = extractionStatus[`q${idx + 1}` as keyof typeof extractionStatus]
        console.log(`Q${idx + 1}: status=${status}, word_count=${wordCount}, answer="${ans}"`)
      })
      console.log('=== END EXTRACTED ANSWERS ===')
    } else {
      // Production: only log word counts and status
      if (process.env.NODE_ENV !== 'production') {
        console.log('=== EXTRACTED ONBOARDING ANSWERS ===')
        extractedAnswers.forEach((ans, idx) => {
          const wordCount = answerWordCounts[idx] || 0
          const status = extractionStatus[`q${idx + 1}` as keyof typeof extractionStatus]
          console.log(`Q${idx + 1}: status=${status}, word_count=${wordCount}`)
        })
        console.log('=== END EXTRACTED ANSWERS ===')
      }
    }

    // Build user prompt - MUST include actual answers for LLM to work
    // Privacy: Raw text is sent to OpenAI (required for processing) but NOT stored in database
    let userPrompt = `BASE PRIORS (computed from sliders):
${JSON.stringify(basePriors, null, 2)}

Dealbreakers: ${dealbreakers.length > 0 ? dealbreakers.length + ' selected' : 'None'}

CHAT QUESTIONS AND ANSWERS:`
    
    // Always include actual answers in prompt (required for LLM to generate deltas)
    // Privacy note: Answers are sent to OpenAI API but NOT stored in database
    extractedAnswers.forEach((ans, idx) => {
      userPrompt += `\n\nQ${idx + 1}: ${onboardingQuestions[idx].replace(`[[Q${idx + 1}]] `, '')}\nA: ${ans}`
    })
    
    userPrompt += `\n\nProvide deltas to adjust the base priors based on chat evidence. Return ONLY the JSON format specified.`

    // Log prompt only in dev with DEBUG_EVIDENCE flag (privacy-safe logging)
    // Note: Prompt always includes answers (required for LLM), but we only log in dev
    if (enableDebugEvidence) {
      const promptForLogging = userPrompt.replace(/sk-[a-zA-Z0-9]+/g, 'sk-REDACTED')
      console.log('=== PROMPT SENT TO OPENAI (DEV ONLY) ===')
      console.log(promptForLogging)
      console.log('=== END PROMPT ===')
    } else if (process.env.NODE_ENV !== 'production') {
      // In non-prod, log word counts only (privacy-safe)
      console.log('=== PROMPT SENT TO OPENAI (word counts only) ===')
      extractedAnswers.forEach((ans, idx) => {
        const wordCount = answerWordCounts[idx] || 0
        const status = extractionStatus[`q${idx + 1}` as keyof typeof extractionStatus]
        console.log(`Q${idx + 1}: status=${status}, word_count=${wordCount}`)
      })
      console.log('=== END PROMPT ===')
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Calling OpenAI API for radar generation...')
    }
    const startTime = Date.now()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use GPT-4o for profile generation
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.25, // 0.2-0.3 range for deterministic output
      response_format: { type: 'json_object' },
    })
    const responseTime = Date.now() - startTime

    // Track OpenAI usage
    if (response.usage) {
      await trackOpenAIUsage({
        userId: userId || null,
        linkId: linkId || null,
        endpoint: 'generate_profile',
        model: 'gpt-4o',
        usage: response.usage,
        responseTimeMs: responseTime,
        success: true,
      })
    }

    console.log('OpenAI response received')
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content returned from OpenAI')
    }

    console.log('Parsing JSON response...')
    let result: UserProfileOutput
    try {
      result = JSON.parse(content)
      console.log('Parsed result:', result)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Content that failed to parse:', content.substring(0, 500))
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Validate and fix deltas with fallbacks
    const ensureArray = (arr: any, length: number, defaultValue: number = 0.0): number[] => {
      if (!Array.isArray(arr)) {
        console.warn(`Delta is not an array, using default: ${defaultValue} repeated ${length} times`)
        return Array(length).fill(defaultValue)
      }
      if (arr.length !== length) {
        console.warn(`Delta array has length ${arr.length}, expected ${length}. Padding or truncating.`)
        const fixed = [...arr]
        while (fixed.length < length) {
          fixed.push(defaultValue)
        }
        return fixed.slice(0, length)
      }
      // Ensure all elements are numbers
      return arr.map((val: any) => {
        const num = Number(val)
        return isNaN(num) ? defaultValue : num
      })
    }

    const values_delta_raw = ensureArray(result.values_delta, 5, 0.0)
    const erotic_delta_raw = ensureArray(result.erotic_delta, 5, 0.0)
    const relational_delta_raw = ensureArray(result.relational_delta, 5, 0.0)
    const consent_delta_raw = ensureArray(result.consent_delta, 4, 0.0)

    // Clamp deltas to [-0.2, +0.2]
    const clampDelta = (delta: number) => Math.max(-0.2, Math.min(0.2, Number(delta) || 0.0))
    const clampDeltaVector = (vec: number[]) => vec.map(clampDelta)
    
    let values_delta = clampDeltaVector(values_delta_raw)
    let erotic_delta = clampDeltaVector(erotic_delta_raw)
    let relational_delta = clampDeltaVector(relational_delta_raw)
    let consent_delta = clampDeltaVector(consent_delta_raw)
    
    // Low evidence handling: down-weight max delta contributions (×0.5)
    const isLowEvidence = answerWordCounts.some((count, idx) => 
      extractedAnswers[idx] === 'Not answered' || count < 8
    )
    
    if (isLowEvidence) {
      // Down-weight all deltas by 0.5 to prevent high scores with low evidence
      values_delta = values_delta.map(d => d * 0.5)
      erotic_delta = erotic_delta.map(d => d * 0.5)
      relational_delta = relational_delta.map(d => d * 0.5)
      consent_delta = consent_delta.map(d => d * 0.5)
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Low evidence detected: down-weighting deltas by ×0.5')
      }
    }

    // Extract flags from new schema (or fallback to old evidence format)
    let lowEvidenceFlag = false
    let gamingDetectedFlag = false
    
    if (result.flags) {
      lowEvidenceFlag = result.flags.low_evidence || false
      gamingDetectedFlag = result.flags.gaming_detected || false
    } else if ((result as any).evidence) {
      // Fallback for old format
      gamingDetectedFlag = (result as any).evidence.gaming_detected || false
    }
    
    // Deterministic gaming detection: scan chat history for gaming keywords
    const gamingKeywords = ['prompt', 'system', 'optimize', 'score', 'vector', 'scoring', 'output', 'manipulate']
    const allChatText = chatHistory.map(m => m.content).join(' ').toLowerCase()
    const hasGamingKeywords = gamingKeywords.some(keyword => allChatText.includes(keyword))
    if (hasGamingKeywords) {
      gamingDetectedFlag = true
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Gaming detected via deterministic string scan')
      }
    }
    
    // Log deltas (no evidence strings in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== DELTAS FROM LLM ===')
      console.log('values_delta:', values_delta)
      console.log('erotic_delta:', erotic_delta)
      console.log('relational_delta:', relational_delta)
      console.log('consent_delta:', consent_delta)
      console.log('flags:', { low_evidence: lowEvidenceFlag, gaming_detected: gamingDetectedFlag })
      if (enableDebugEvidence && (result as any).evidence) {
        console.log('=== EVIDENCE TRIGGERS (DEV ONLY) ===')
        console.log('Q1 triggers:', (result as any).evidence.q1_triggers || [])
        console.log('Q2 triggers:', (result as any).evidence.q2_triggers || [])
        console.log('Q3 triggers:', (result as any).evidence.q3_triggers || [])
        console.log('Q7 triggers:', (result as any).evidence.q7_triggers || [])
        console.log('=== END EVIDENCE TRIGGERS ===')
      }
      console.log('=== END DELTAS ===')
    }

    // Apply deltas to base priors
    const applyDeltas = (base: number[], deltas: number[]) => {
      return base.map((prior, idx) => {
        const adjusted = prior + (deltas[idx] || 0)
        return Math.max(0.0, Math.min(1.0, adjusted))
      })
    }

    // Apply deltas to baseline (no smoothing, no nudges)
    let values_vector = applyDeltas([
      basePriors.self_transcendence,
      basePriors.self_enhancement,
      basePriors.rooting,
      basePriors.searching,
      basePriors.stability_orientation,
    ], values_delta)

    let erotic_vector = applyDeltas([
      basePriors.erotic_pace,
      basePriors.desire_intensity,
      basePriors.fantasy_openness,
      basePriors.erotic_attunement,
      basePriors.boundary_directness,
    ], erotic_delta)

    let relational_vector = applyDeltas([
      basePriors.enm_openness,
      basePriors.exclusivity_comfort,
      basePriors.freedom_orientation,
      basePriors.attraction_depth_preference,
      basePriors.communication_style,
    ], relational_delta)

    let consent_vector = applyDeltas([
      basePriors.consent_awareness,
      basePriors.negotiation_comfort,
      basePriors.non_coerciveness,
      basePriors.self_advocacy,
    ], consent_delta)

    // Gaming detection: cap all dimensions to ≤ 0.4 if gaming detected
    if (gamingDetectedFlag) {
      values_vector = values_vector.map(v => Math.min(v, 0.4))
      erotic_vector = erotic_vector.map(v => Math.min(v, 0.4))
      relational_vector = relational_vector.map(v => Math.min(v, 0.4))
      consent_vector = consent_vector.map(v => Math.min(v, 0.4))
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Gaming detected: capping all dimensions to ≤ 0.4')
      }
    }

    // Log final vectors (dev only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== FINAL VECTORS (baseline + deltas) ===')
      console.log('values_vector:', values_vector)
      console.log('erotic_vector:', erotic_vector)
      console.log('relational_vector:', relational_vector)
      console.log('consent_vector:', consent_vector)
      console.log('flags:', { low_evidence: isLowEvidence, gaming_detected: gamingDetectedFlag })
      console.log('=== END FINAL VECTORS ===')
    }

    // Compute radar chart deterministically from vectors (ignore any chart field in LLM response)
    // Formula: average the vector components and scale to 0-100
    const radarChart: RadarChart = {
      Self_Transcendence: Math.round(values_vector[0] * 100),
      Self_Enhancement: Math.round(values_vector[1] * 100),
      Rooting: Math.round(values_vector[2] * 100),
      Searching: Math.round(values_vector[3] * 100),
      Relational: Math.round((relational_vector.reduce((a, b) => a + b, 0) / 5) * 100),
      Erotic: Math.round((erotic_vector.reduce((a, b) => a + b, 0) / 5) * 100),
      Consent: Math.round((consent_vector.reduce((a, b) => a + b, 0) / 4) * 100),
    }
    
    // Log radar chart (dev only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== COMPUTED RADAR CHART FROM VECTORS ===')
      console.log(JSON.stringify(radarChart, null, 2))
      console.log('=== END RADAR CHART ===')
    }

    // Write trace to database (async, don't block return)
    // Privacy-safe: only numeric vectors, flags, word counts - NO raw text
    try {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        )
        
        const traceData = {
          user_id: userId || null,
          link_id: linkId || null,
          model_version: CURRENT_MODEL_VERSION,
          scoring_version: CURRENT_SCORING_VERSION,
          schema_version: CURRENT_SCHEMA_VERSION,
          pace: preferences.pace || null,
          connection_chemistry: preferences.connection_chemistry || null,
          vanilla_kinky: preferences.vanilla_kinky || null,
          open_monogamous: preferences.open_monogamous || null,
          boundaries_raw: boundariesScaleVersion === 1 ? (preferences.boundaries || null) : null, // old field if present
          boundaries_ease: boundariesScaleVersion === 2 ? (preferences.boundaries_ease || null) : null, // new field if present
          boundaries_scale_version: boundariesScaleVersion,
          boundaries_ease_unified: Math.round(boundariesEase), // computed unified value
          base_priors: basePriors,
          deltas: {
            values_delta: values_delta,
            erotic_delta: erotic_delta,
            relational_delta: relational_delta,
            consent_delta: consent_delta,
            gaming_detected: gamingDetectedFlag,
            low_evidence: isLowEvidence,
          },
          final_vectors: {
            values_vector,
            erotic_vector,
            relational_vector,
            consent_vector,
          },
          extraction_status: extractionStatus,
          answer_word_counts: {
            q1: answerWordCounts[0] || 0,
            q2: answerWordCounts[1] || 0,
            q3: answerWordCounts[2] || 0,
            q4: answerWordCounts[3] || 0,
          },
          low_evidence: isLowEvidence,
        }
        
        const { error: traceError } = await supabaseAdmin
          .from('profile_generation_traces')
          .insert(traceData)
        
        if (traceError) {
          console.error('Error writing profile generation trace:', traceError)
          // Don't throw - trace writing is non-blocking
        }
      }
    } catch (traceError) {
      console.error('Error setting up trace writing:', traceError)
      // Don't throw - trace writing is non-blocking
    }

    return {
      values_vector,
      erotic_vector,
      relational_vector,
      consent_vector,
      chart: radarChart,
      dealbreakers
    }
  } catch (error) {
    console.error('Error in generateUserRadarProfile:', error)
    
    // Extract detailed error information
    let errorMessage = 'Unknown error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error message:', errorMessage)
      console.error('Error stack:', error.stack)
    } else if (error && typeof error === 'object') {
      // Handle OpenAI API errors or other structured errors
      const err = error as any
      if (err.response) {
        errorMessage = `OpenAI API error: ${JSON.stringify(err.response.data || err.response.statusText || err.response.status)}`
      } else if (err.message) {
        errorMessage = err.message
      } else if (err.error) {
        errorMessage = typeof err.error === 'string' ? err.error : JSON.stringify(err.error)
      } else {
        errorMessage = JSON.stringify(error)
      }
      console.error('Structured error:', errorMessage)
    } else {
      errorMessage = String(error)
    }
    
    // Create a new error with the extracted message
    const enhancedError = new Error(errorMessage)
    if (error instanceof Error && error.stack) {
      enhancedError.stack = error.stack
    }
    throw enhancedError
  }
}

/**
 * Deterministic garbage detection (code-level, not LLM-dependent)
 * Detects gibberish, repeated words, nonsensical text, etc.
 */
function detectGarbageResponses(formattedResponses: string): boolean {
  const responses = formattedResponses.toLowerCase()
  
  // Patterns that indicate garbage:
  // 1. Repeated single words (e.g., "test test test", "yes yes yes")
  const repeatedWordPattern = /\b(\w+)\s+\1\s+\1/i
  if (repeatedWordPattern.test(responses)) {
    return true
  }
  
  // 2. Common gibberish patterns (asdf, qwerty, random letters/numbers)
  const gibberishPatterns = [
    /^[asdf]+$/i,           // "asdf", "asdfasdf"
    /^[qwerty]+$/i,         // "qwerty", "qwertyuiop"
    /^[zxcv]+$/i,           // "zxcv"
    /^[1234567890]+$/i,     // "123", "12345"
    /^[abc]+$/i,            // "abc", "abcabc"
    /^[xyz]+$/i,            // "xyz"
    /^[hjkl]+$/i,           // "hjkl"
    /^[nm]+$/i,             // "nm", "nnnn"
  ]
  
  // Check each answer line for gibberish
  const answerLines = responses.split(/\n/).filter(line => line.includes('a:') || line.includes('answer:'))
  for (const line of answerLines) {
    const answerMatch = line.match(/a:\s*(.+)|answer:\s*(.+)/i)
    if (answerMatch) {
      const answer = (answerMatch[1] || answerMatch[2] || '').trim()
      // Check if answer is just gibberish
      for (const pattern of gibberishPatterns) {
        if (pattern.test(answer)) {
          return true
        }
      }
      
      // Check for repeated single character (e.g., "aaa", "xxx")
      if (answer.length >= 3 && /^([a-z0-9])\1{2,}$/i.test(answer)) {
        return true
      }
    }
  }
  
  // 3. Extremely short answers to substantive questions (Q4-Q7)
  // Count total words across all substantive answers
  const substantiveAnswers = answerLines.slice(3) // Skip Q1-Q3 (consent, style, exclusions)
  const totalWords = substantiveAnswers
    .map(line => {
      const match = line.match(/a:\s*(.+)|answer:\s*(.+)/i)
      return match ? (match[1] || match[2] || '').trim().split(/\s+/).length : 0
    })
    .reduce((sum, count) => sum + count, 0)
  
  // If all substantive answers combined have < 5 words, likely garbage
  if (substantiveAnswers.length > 0 && totalWords < 5) {
    return true
  }
  
  // 4. Check for random character sequences (no vowels, no real words)
  const noVowelsPattern = /^[bcdfghjklmnpqrstvwxyz]{5,}$/i
  for (const line of answerLines) {
    const answerMatch = line.match(/a:\s*(.+)|answer:\s*(.+)/i)
    if (answerMatch) {
      const answer = (answerMatch[1] || answerMatch[2] || '').trim()
      // If answer is 5+ chars with no vowels, likely garbage
      if (answer.length >= 5 && noVowelsPattern.test(answer)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Generate requester assessment from their responses
 */
export async function assessRequester(
  requesterResponses: Record<string, any>,
  userRadarProfile: RadarDimensions,
  userDealbreakers: string[],
  structuredFields?: Record<string, any>,
  userId?: string | null,
  linkId?: string | null,
  requesterSessionId?: string | null
): Promise<{
  radar: RadarDimensions
  compatibilityScore: number
  summary: string
  abuseFlags: string[]
  dealbreakerHits: Array<{ ruleId: string; label: string; reason: string; evidence: Array<{ field: string; value: string | number }>; capScoreTo: number }>
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const systemPrompt = `You are a compatibility assessment AI for SoulSort.

Compare the requester's responses against the user's radar profile.

User's radar dimensions:
${JSON.stringify(userRadarProfile)}

CRITICAL: GARBAGE RESPONSE DETECTION
Before assessing compatibility, check if responses are garbage/non-serious:
- Single repeated words (e.g., "test", "test", "test" or "yes", "yes", "yes")
- Nonsensical or random text (e.g., "asdf", "qwerty", "123", "abc")
- Extremely short answers (< 3 words) to substantive questions (Q4-Q7)
- Copy-paste spam or gibberish
- Answers that show no engagement with the question content

If garbage responses are detected:
- Set ALL radar dimensions to 15-25 (low engagement, no real signals)
- Set compatibility score to MAX 25 (never higher)
- Write summary noting limited information available
- Add "low_engagement" to abuseFlags

CRITICAL LANGUAGE RULES (for summary only):
- The summary will be shown to the requester (the person who took the assessment)
- Always refer to the requester as "you" or "your"
- Always refer to the user (the person whose link they used) as "they", "them", or "their"
- NEVER mention dealbreakers explicitly - this reduces psychological safety
- NEVER use profiling language like "stubborn", "rigid", "controlling", etc.
- Use descriptive, neutral language that describes patterns and differences without judgment
- Focus on alignment and differences in values, communication styles, and relationship needs
- Keep it positive and constructive - this should feel like helpful insight, not criticism
- The summary is SEPARATE from the score - write it descriptively regardless of score
- Radar values must reflect behavioral signals, not confidence or charm
- If controlling/ownership/entitlement language appears: cap consent <= 35, reduce relational and erotic by 10–25 points depending on severity
- If the requester avoids consent/boundaries questions: reduce consent

Generate:
1. Requester's radar profile (7 dimensions, 0-100) - based on their responses, OR 15-25 if garbage detected
2. Compatibility score (0-100) - calculated STRICTLY from radar dimension alignment, OR MAX 25 if garbage detected
3. A thoughtful summary (2-3 sentences) written from the requester's perspective using "you" for them and "they/them" for the other person. Describe compatibility patterns descriptively without mentioning dealbreakers or using judgmental language. The summary is independent of the score.
4. Abuse detection flags (empty array if none, or ["low_engagement"] if garbage detected, or ["flag1", "flag2"] if concerning patterns detected)

Return ONLY valid JSON:
{
  "radar": {
    "self_transcendence": <0-100>,
    "self_enhancement": <0-100>,
    "rooting": <0-100>,
    "searching": <0-100>,
    "relational": <0-100>,
    "erotic": <0-100>,
    "consent": <0-100>
  },
  "compatibilityScore": <0-100>,
  "summary": "string",
  "abuseFlags": []
}`

  // Format requester responses with questions and answers for context
  const requesterQuestions = [
    'Do you consent to a short convo to check alignment?',
    'What communication style do you prefer? Direct, Playful, Reflective, or Short-answer?',
    'Is there anything you do NOT want to discuss?',
    'What are three values you try to practice in your relationships?',
    'How do you like to navigate disagreements or misunderstandings?',
    'What helps you feel erotically connected to someone?',
    'How much do you need and seek freedom in your romantic relationships and what does freedom look like to you?',
  ]

  // Use question-answer pairs if available, otherwise fall back to individual fields
  // GDPR: Only log raw answers if LOG_RAW=true (dev only)
  const logRaw = process.env.LOG_RAW === 'true'
  let formattedResponses = ''
  if (requesterResponses.question_answer_pairs && Array.isArray(requesterResponses.question_answer_pairs)) {
    formattedResponses = requesterResponses.question_answer_pairs
      .map((pair: { question: string; answer: string }, idx: number) => 
        `Q${idx + 1}: ${pair.question}\n   A: ${pair.answer}`
      )
      .join('\n\n')
    if (logRaw && process.env.NODE_ENV !== 'production') {
      console.log('=== FORMATTED RESPONSES (LOG_RAW enabled) ===')
      console.log(formattedResponses)
      console.log('=== END FORMATTED RESPONSES ===')
    }
  } else {
    // Fallback format
    formattedResponses = `
Q1 (Consent): ${requesterResponses.consent || 'N/A'}
Q2 (Communication style): ${requesterResponses.communication_style || requesterResponses.communicationStyle || 'N/A'}
Q3 (Exclusions): ${requesterResponses.exclusions || 'N/A'}
Q4 (Values): ${requesterResponses.values || requesterResponses.response_3 || 'N/A'}
Q5 (Conflict navigation): ${requesterResponses.conflict_navigation || requesterResponses.response_4 || 'N/A'}
Q6 (Erotic connection): ${requesterResponses.erotic_connection || requesterResponses.response_5 || 'N/A'}
Q7 (Freedom needs): ${requesterResponses.freedom_needs || requesterResponses.response_6 || 'N/A'}`
    if (logRaw && process.env.NODE_ENV !== 'production') {
      console.log('=== FORMATTED RESPONSES (LOG_RAW enabled, fallback format) ===')
      console.log(formattedResponses)
      console.log('=== END FORMATTED RESPONSES ===')
    }
  }

  const userPrompt = `Requester's responses (questions and answers paired):

${formattedResponses}

Assess compatibility based on these responses.`

  try {
    if (!logRaw) {
      console.log('Calling OpenAI for requester assessment... (raw answers not logged, set LOG_RAW=true to enable)')
    } else {
      console.log('Calling OpenAI for requester assessment...')
    }
    const startTime = Date.now()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })
    const responseTime = Date.now() - startTime

    // Track OpenAI usage
    if (response.usage) {
      await trackOpenAIUsage({
        userId: userId || null,
        linkId: linkId || null,
        requesterSessionId: requesterSessionId || null,
        endpoint: 'requester_assess',
        model: 'gpt-4o-mini',
        usage: response.usage,
        responseTimeMs: responseTime,
        success: true,
      })
    }

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content returned from OpenAI')
    }

    if (!logRaw) {
      console.log('OpenAI response received, parsing JSON... (raw response not logged, set LOG_RAW=true to enable)')
    } else {
      console.log('OpenAI response received, parsing JSON...')
    }
    let result: any
    try {
      result = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      if (logRaw) {
        console.error('Content that failed to parse:', content.substring(0, 500))
      }
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    if (logRaw && process.env.NODE_ENV !== 'production') {
      console.log('Parsed result:', result)
    } else {
      console.log('Parsed result (summary/score only):', { summaryLength: result.summary?.length, compatibilityScore: result.compatibilityScore, hasRadar: !!result.radar, hasAbuseFlags: !!result.abuseFlags })
    }
    
    // Validate and extract requester radar with robust fallbacks
    const safeNumber = (val: any, defaultValue: number = 50): number => {
      const num = Number(val)
      if (isNaN(num) || !isFinite(num)) {
        return defaultValue
      }
      return Math.max(0, Math.min(100, num))
    }
    
    // Ensure result.radar is an object
    const radarData = result.radar && typeof result.radar === 'object' && !Array.isArray(result.radar)
      ? result.radar
      : {}
    
    // Extract and validate requester radar (read "consent" from LLM output, not "consent_dim")
    const requesterRadarBeforeCaps: RadarDimensions = {
      self_transcendence: safeNumber(radarData.self_transcendence, 50),
      self_enhancement: safeNumber(radarData.self_enhancement, 50),
      rooting: safeNumber(radarData.rooting, 50),
      searching: safeNumber(radarData.searching, 50),
      relational: safeNumber(radarData.relational, 50),
      erotic: safeNumber(radarData.erotic, 50),
      consent: safeNumber(radarData.consent || radarData.consent_dim, 50), // Support both for migration
    }
    
    // Validate summary
    const summary = typeof result.summary === 'string' && result.summary.trim().length > 0
      ? result.summary.trim()
      : 'Assessment completed.'
    
    // Validate compatibility score - check if LLM provided a valid score
    const llmScoreRaw = result.compatibilityScore
    const hasValidLlmScore = typeof llmScoreRaw === 'number' && 
                             !isNaN(llmScoreRaw) && 
                             isFinite(llmScoreRaw) && 
                             llmScoreRaw >= 0 && 
                             llmScoreRaw <= 100 &&
                             llmScoreRaw !== 50 // 50 is the default, so likely invalid

    if (process.env.NODE_ENV !== 'production') {
      console.log('=== REQUESTER RADAR BEFORE SAFETY CAPS ===')
      console.log(JSON.stringify(requesterRadarBeforeCaps, null, 2))
    }

    // Deterministic safety caps: scan for coercive/ownership/hierarchy language
    const coercivePatterns = [
      /\bmy\s+(woman|man|girl|boy|partner|wife|husband)\b/i,
      /\bknow\s+(her|his|their)\s+place\b/i,
      /\bnon-negotiable\b/i,
      /\bdisrespect.*angry\b/i,
      /\bobedient\b/i,
      /\bsubmit\b/i,
      /\ballow\b.*\b(her|him|them)\b/i,
      /\bpermission\b/i,
      /\bbelongs\s+to\s+me\b/i,
      /\b(her|his|their)\s+(job|duty|role)\s+is\b/i,
      /\b(should|must|has to)\s+(obey|listen|respect)\b/i,
    ]

    let abuseFlags: string[] = Array.isArray(result.abuseFlags) ? result.abuseFlags : []
    const detectedTriggers: string[] = []
    let hasCoerciveLanguage = false

    // Scan formattedResponses for coercive patterns
    const responseText = formattedResponses.toLowerCase()
    for (const pattern of coercivePatterns) {
      if (pattern.test(responseText)) {
        hasCoerciveLanguage = true
        detectedTriggers.push(pattern.toString())
        break // Found at least one pattern
      }
    }

    // Apply safety caps if coercive language detected
    let requesterRadar = { ...requesterRadarBeforeCaps }
    if (hasCoerciveLanguage) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('=== COERCIVE LANGUAGE DETECTED ===')
        console.log('Triggers:', detectedTriggers)
      }

      // Determine severity (simple heuristic: count of patterns or specific high-severity patterns)
      const highSeverityPatterns = [
        /\bmy\s+(woman|man)\b/i,
        /\bknow\s+(her|his|their)\s+place\b/i,
        /\bbelongs\s+to\s+me\b/i,
      ]
      const hasHighSeverity = highSeverityPatterns.some(p => p.test(responseText))
      const severity = hasHighSeverity ? 'high' : 'medium'

      // Apply caps
      requesterRadar.consent = Math.min(requesterRadar.consent, 35)
      requesterRadar.relational = Math.max(0, requesterRadar.relational - (severity === 'high' ? 20 : 15))
      requesterRadar.erotic = Math.max(0, requesterRadar.erotic - (severity === 'high' ? 15 : 10))

      abuseFlags.push(severity === 'high' ? 'ownership_language' : 'coercive_control_language')

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Severity: ${severity}`)
        console.log('Applied caps:')
        console.log(`  consent: capped at ${requesterRadar.consent}`)
        console.log(`  relational: reduced by ${severity === 'high' ? 20 : 15} to ${requesterRadar.relational}`)
        console.log(`  erotic: reduced by ${severity === 'high' ? 15 : 10} to ${requesterRadar.erotic}`)
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('=== REQUESTER RADAR AFTER SAFETY CAPS ===')
      console.log(JSON.stringify(requesterRadar, null, 2))
      console.log('Abuse flags:', abuseFlags)
    }

    // Compute compatibility score using RMS (Root Mean Square) for less forgiving scoring
    // Formula: RMS = sqrt(mean(diff^2)), then score = 100 - (RMS * factor)
    const dimensions: (keyof RadarDimensions)[] = [
      'self_transcendence',
      'self_enhancement',
      'rooting',
      'searching',
      'relational',
      'erotic',
      'consent',
    ]

    const differences = dimensions.map(dim => 
      Math.abs(requesterRadar[dim] - userRadarProfile[dim])
    )

    // Use RMS (Root Mean Square) for more conservative scoring
    const squaredDifferences = differences.map(diff => diff * diff)
    const meanSquaredDifference = squaredDifferences.reduce((sum, sq) => sum + sq, 0) / dimensions.length
    const rmsDifference = Math.sqrt(meanSquaredDifference)
    
    // Factor of 1.3 for RMS (more conservative than 0.8 for mean)
    let compatibilityScore = Math.round(Math.max(0, Math.min(100, 100 - (rmsDifference * 1.3))))
    
    // CRITICAL: Deterministic garbage detection (code-level enforcement)
    // Check for gibberish/non-serious responses BEFORE using LLM score
    const isGarbage = detectGarbageResponses(formattedResponses)
    
    if (isGarbage) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('=== GARBAGE RESPONSES DETECTED (CODE-LEVEL) ===')
        console.warn('Capping score at 25 and radar at 15-25')
      }
      
      // Force cap: score MAX 25, radar 15-25
      compatibilityScore = Math.min(compatibilityScore, 25)
      
      // Cap all radar dimensions to 15-25 range
      requesterRadar = {
        self_transcendence: Math.max(15, Math.min(25, requesterRadar.self_transcendence)),
        self_enhancement: Math.max(15, Math.min(25, requesterRadar.self_enhancement)),
        rooting: Math.max(15, Math.min(25, requesterRadar.rooting)),
        searching: Math.max(15, Math.min(25, requesterRadar.searching)),
        relational: Math.max(15, Math.min(25, requesterRadar.relational)),
        erotic: Math.max(15, Math.min(25, requesterRadar.erotic)),
        consent: Math.max(15, Math.min(25, requesterRadar.consent)),
      }
      
      // Add low_engagement flag if not already present
      if (!abuseFlags.includes('low_engagement')) {
        abuseFlags.push('low_engagement')
      }
    }

    // Apply safety gates
    if (requesterRadar.consent < 40) {
      compatibilityScore = Math.min(compatibilityScore, 55)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Gate applied: consent < 40, capped score at ${compatibilityScore}`)
      }
    }

    if (abuseFlags.length > 0) {
      compatibilityScore = Math.max(0, Math.min(compatibilityScore, 60))
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Gate applied: abuse flags present, capped score at ${compatibilityScore}`)
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('=== COMPATIBILITY SCORE CALCULATION ===')
      console.log('Differences:', differences)
      console.log('RMS difference:', rmsDifference.toFixed(2))
      console.log('Score before gates:', Math.round(100 - (rmsDifference * 1.3)))
      console.log('Final compatibility score:', compatibilityScore)
      console.log('=== END SCORE CALCULATION ===')
    }
    
    // Apply dealbreaker caps after safety caps
    const { evaluateDealbreakers, applyDealbreakerCaps } = await import('./dealbreakerEngine')
    
    const dealbreakerInput = {
      requesterRadar,
      userRadar: userRadarProfile,
      requesterStructuredFields: structuredFields || {},
      userDealbreakers,
      abuseFlags,
      formattedResponses,
    }
    
    const dealbreakerHits = evaluateDealbreakers(dealbreakerInput)
    let scoreAfterDealbreakers = applyDealbreakerCaps(compatibilityScore, dealbreakerHits)
    
    // CRITICAL: Re-apply garbage cap AFTER dealbreakers (final enforcement)
    if (isGarbage) {
      scoreAfterDealbreakers = Math.min(scoreAfterDealbreakers, 25)
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== DEALBREAKER EVALUATION ===')
      console.log(`Dealbreaker hits: ${dealbreakerHits.length}`)
      if (dealbreakerHits.length > 0) {
        console.log('Hits:', dealbreakerHits.map(h => ({ label: h.label, reason: h.reason, capScoreTo: h.capScoreTo })))
      }
      console.log(`Score after safety caps: ${compatibilityScore}`)
      console.log(`Score after dealbreakers: ${scoreAfterDealbreakers}`)
      if (isGarbage) {
        console.log(`Garbage detected - final score capped at: ${scoreAfterDealbreakers}`)
      }
      console.log('=== END DEALBREAKER EVALUATION ===')
    }
    
    // Use calculated score (which already applies gates and dealbreakers)
    // The LLM score is ignored in favor of our deterministic calculation
    const finalScore = scoreAfterDealbreakers
    
    return {
      radar: requesterRadar,
      compatibilityScore: finalScore,
      summary: summary,
      abuseFlags,
      dealbreakerHits, // Include for storage (private to profile owner)
    }
  } catch (error) {
    console.error('Error in assessRequester:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      // Re-throw with enhanced message if it's a generic error
      if (!error.message || error.message === 'Unknown error') {
        const enhancedError = new Error(`assessRequester failed: ${error.name || 'Error'} - ${error.stack || 'No stack trace'}`)
        enhancedError.stack = error.stack
        throw enhancedError
      }
    } else {
      console.error('Non-Error object thrown:', typeof error, error)
      // Wrap non-Error objects
      throw new Error(`assessRequester failed: ${String(error)}`)
    }
    throw error
  }
}

/**
 * Generate next chat message in onboarding flow
 */
export async function generateOnboardingChatMessage(
  chatHistory: ChatMessage[],
  surveyProgress: Record<string, any>
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const systemPrompt = `You are a warm, supportive AI helping someone create their SoulSort profile through conversation.

Your goal is to understand their values, boundaries, and relationship preferences through natural dialogue.
Ask thoughtful questions, model healthy communication, and be affirming of diverse identities and experiences.

Keep responses concise (1-2 sentences) and conversational.`

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  try {
    const startTime = Date.now()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.8,
      max_tokens: 150,
    })
    const responseTime = Date.now() - startTime

    // Track OpenAI usage (optional - for onboarding chat)
    if (response.usage) {
      await trackOpenAIUsage({
        userId: null, // Onboarding chat doesn't have userId yet
        linkId: null,
        endpoint: 'onboarding_chat_message',
        model: 'gpt-4o-mini',
        usage: response.usage,
        responseTimeMs: responseTime,
        success: true,
      }).catch(err => console.error('Error tracking OpenAI usage:', err))
    }

    return response.choices[0].message.content || 'Tell me more about what you\'re looking for.'
  } catch (error) {
    console.error('Error in generateOnboardingChatMessage:', error)
    throw error
  }
}

/**
 * Generate next question in requester assessment flow
 */
export async function generateRequesterQuestion(
  chatHistory: ChatMessage[],
  questionsAsked: number,
  maxQuestions: number = 8
): Promise<string> {
  if (questionsAsked >= maxQuestions) {
    return 'Thank you for sharing! I have enough information to assess compatibility. Generating your results...'
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const systemPrompt = `You are conducting a compatibility assessment. Ask thoughtful questions that help understand values, boundaries, and relationship style.

You've asked ${questionsAsked} questions so far. Ask one more question that feels natural in the conversation flow.
Keep it conversational and supportive.`

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  try {
    const startTime = Date.now()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.8,
      max_tokens: 100,
    })
    const responseTime = Date.now() - startTime

    // Track OpenAI usage (optional - for requester commentary)
    if (response.usage) {
      await trackOpenAIUsage({
        userId: null,
        linkId: null,
        endpoint: 'requester_commentary',
        model: 'gpt-4o-mini',
        usage: response.usage,
        responseTimeMs: responseTime,
        success: true,
      }).catch(err => console.error('Error tracking OpenAI usage:', err))
    }

    return response.choices[0].message.content || 'What matters most to you in a relationship?'
  } catch (error) {
    console.error('Error in generateRequesterQuestion:', error)
    throw error
  }
}


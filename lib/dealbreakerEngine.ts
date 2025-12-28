/**
 * Dealbreaker Engine v1
 * 
 * Deterministic, typed rules framework for evaluating compatibility dealbreakers.
 * Designed to scale to premium custom dealbreakers in the future.
 */

import type { RadarDimensions } from './types'

export type DealbreakerRuleType = 'SAFETY' | 'PREFERENCE' | 'COMMUNICATION'
export type DealbreakerSeverity = 'HARD' | 'SOFT'

export interface DealbreakerEvidence {
  field: string
  value: string | number
}

export interface DealbreakerRuleHit {
  ruleId: string
  label: string
  reason: string
  evidence: DealbreakerEvidence[]
  capScoreTo: number
}

export interface DealbreakerRuleDefinition {
  id: string
  label: string
  type: DealbreakerRuleType
  severity: DealbreakerSeverity
  capScoreTo?: number
  evaluate: (input: DealbreakerRuleInput) => DealbreakerRuleHit | null
}

export interface DealbreakerRuleInput {
  requesterRadar: RadarDimensions
  userRadar: RadarDimensions
  requesterStructuredFields: RequesterStructuredFields
  userDealbreakers: string[]
  abuseFlags: string[]
  formattedResponses: string
}

export interface RequesterStructuredFields {
  relationship_structure?: 'monogamous' | 'open_to_enm' | 'enm_only' | 'unsure'
  kink_openness?: 'no' | 'maybe' | 'yes'
  status_orientation?: 'low' | 'medium' | 'high'
  [key: string]: any
}

/**
 * V1 Dealbreaker Rules Registry
 */
const V1_DEALBREAKER_RULES: DealbreakerRuleDefinition[] = [
  // Rule 1: Consent misalignment (SAFETY, HARD)
  {
    id: 'consent_misalignment',
    label: 'Consent misalignment',
    type: 'SAFETY',
    severity: 'HARD',
    capScoreTo: 45,
    evaluate: (input) => {
      const { requesterRadar, abuseFlags, userDealbreakers } = input
      
      if (!userDealbreakers.includes('Consent misalignment')) {
        return null
      }

      const consentLow = requesterRadar.consent < 40
      const hasOwnershipLanguage = abuseFlags.includes('ownership_language') || abuseFlags.includes('coercive_control_language')

      if (consentLow || hasOwnershipLanguage) {
        return {
          ruleId: 'consent_misalignment',
          label: 'Consent misalignment',
          reason: consentLow 
            ? `Requester consent dimension is ${requesterRadar.consent} (below threshold of 40)`
            : 'Ownership or coercive language detected',
          evidence: [
            { field: 'consent', value: requesterRadar.consent },
            ...(hasOwnershipLanguage ? [{ field: 'abuseFlags', value: abuseFlags.join(', ') }] : [])
          ],
          capScoreTo: 45,
        }
      }

      return null
    },
  },

  // Rule 2: Monogamy mismatch (PREFERENCE, HARD)
  {
    id: 'monogamy_mismatch',
    label: 'Monogamy mismatch',
    type: 'PREFERENCE',
    severity: 'HARD',
    capScoreTo: 50,
    evaluate: (input) => {
      const { requesterStructuredFields, userRadar, userDealbreakers } = input
      
      if (!userDealbreakers.includes('Monogamy mismatch')) {
        return null
      }

      // Derive user preference from userRadar.exclusivity_comfort
      // High exclusivity_comfort (>60) = prefers monogamy
      // Low exclusivity_comfort (<40) = prefers ENM
      // Middle (40-60) = flexible/open
      const userPrefersMonogamy = userRadar.relational > 60 // Approximate: high relational often correlates with monogamy preference
      const userPrefersENM = userRadar.relational < 40

      const requesterStructure = requesterStructuredFields.relationship_structure

      if (!requesterStructure) {
        return null // Cannot evaluate without structured field
      }

      const isMismatch = 
        (userPrefersMonogamy && (requesterStructure === 'enm_only')) ||
        (userPrefersENM && (requesterStructure === 'monogamous'))

      if (isMismatch) {
        return {
          ruleId: 'monogamy_mismatch',
          label: 'Monogamy mismatch',
          reason: `User prefers ${userPrefersMonogamy ? 'monogamy' : 'ENM'} but requester is ${requesterStructure}`,
          evidence: [
            { field: 'user_relational', value: userRadar.relational },
            { field: 'requester_relationship_structure', value: requesterStructure },
          ],
          capScoreTo: 50,
        }
      }

      return null
    },
  },

  // Rule 3: Kink incompatibility (PREFERENCE, HARD)
  {
    id: 'kink_incompatibility',
    label: 'Kink incompatibility',
    type: 'PREFERENCE',
    severity: 'HARD',
    capScoreTo: 55,
    evaluate: (input) => {
      const { requesterStructuredFields, userRadar, userDealbreakers } = input
      
      if (!userDealbreakers.includes('Kink incompatibility')) {
        return null
      }

      // Derive user kink openness from userRadar.erotic (high = more open to kink)
      const userKinkOpennessHigh = userRadar.erotic > 65

      const requesterKinkOpenness = requesterStructuredFields.kink_openness

      if (!requesterKinkOpenness) {
        return null // Cannot evaluate without structured field
      }

      if (userKinkOpennessHigh && requesterKinkOpenness === 'no') {
        return {
          ruleId: 'kink_incompatibility',
          label: 'Kink incompatibility',
          reason: 'User has high kink openness but requester is not open to kink',
          evidence: [
            { field: 'user_erotic', value: userRadar.erotic },
            { field: 'requester_kink_openness', value: requesterKinkOpenness },
          ],
          capScoreTo: 55,
        }
      }

      return null
    },
  },

  // Rule 4: Communication avoidance (COMMUNICATION, SOFT)
  {
    id: 'communication_avoidance',
    label: 'Communication avoidance',
    type: 'COMMUNICATION',
    severity: 'SOFT',
    capScoreTo: 65,
    evaluate: (input) => {
      const { formattedResponses, userDealbreakers } = input
      
      if (!userDealbreakers.includes('Communication avoidance')) {
        return null
      }

      const responseText = formattedResponses.toLowerCase()
      
      // Look for explicit patterns indicating avoidance
      const avoidancePatterns = [
        /\b(avoid|avoiding|don't talk|won't discuss|refuse to talk|shut down|stonewall|silent treatment|ghost|disappear)\b/i,
        /\b(rather not|don't want to|hate talking about|don't like discussing)\b/i,
        /\b(run away|walk away|leave when|exit when)\b.*\b(conflict|disagreement|argument|fight)\b/i,
      ]

      const hasAvoidance = avoidancePatterns.some(pattern => pattern.test(responseText))

      if (hasAvoidance) {
        return {
          ruleId: 'communication_avoidance',
          label: 'Communication avoidance',
          reason: 'Communication avoidance patterns detected in responses',
          evidence: [
            { field: 'detected_pattern', value: 'communication_avoidance' },
          ],
          capScoreTo: 65,
        }
      }

      return null
    },
  },

  // Rule 5: Frequent explosive conflict (COMMUNICATION, HARD or SOFT)
  {
    id: 'frequent_explosive_conflict',
    label: 'Frequent explosive conflict',
    type: 'COMMUNICATION',
    severity: 'HARD', // Can be SOFT if less explicit, but default HARD for safety
    capScoreTo: 55,
    evaluate: (input) => {
      const { formattedResponses, userDealbreakers } = input
      
      if (!userDealbreakers.includes('Frequent explosive conflict')) {
        return null
      }

      const responseText = formattedResponses.toLowerCase()
      
      // Look for explicit self-reports of escalation/explosiveness (do NOT infer mental health)
      const explosivePatterns = [
        /\b(explosive|explode|blow up|lose it|freak out|go ballistic|rage|scream|yell|shout)\b.*\b(conflict|disagreement|argument|fight|when|during)\b/i,
        /\b(escalate|escalation|get heated|get angry|get mad)\b.*\b(quickly|fast|always|often|frequently)\b/i,
        /\b(lose control|losing control|can't control|lash out)\b/i,
        /\b(tend to|often|frequently|usually|always)\s+(explode|blow up|freak out|rage|scream)\b/i,
      ]

      const hasExplosiveConflict = explosivePatterns.some(pattern => pattern.test(responseText))

      if (hasExplosiveConflict) {
        return {
          ruleId: 'frequent_explosive_conflict',
          label: 'Frequent explosive conflict',
          reason: 'Explicit self-report of explosive conflict patterns detected',
          evidence: [
            { field: 'detected_pattern', value: 'explosive_conflict' },
          ],
          capScoreTo: 55,
        }
      }

      return null
    },
  },

  // Rule 6: Lack of self-awareness (COMMUNICATION, SOFT)
  {
    id: 'lack_of_self_awareness',
    label: 'Lack of self-awareness',
    type: 'COMMUNICATION',
    severity: 'SOFT',
    capScoreTo: 60,
    evaluate: (input) => {
      const { formattedResponses, userDealbreakers } = input
      
      if (!userDealbreakers.includes('Lack of self-awareness')) {
        return null
      }

      const responseText = formattedResponses.toLowerCase()
      
      // Look for patterns indicating lack of self-awareness
      // Conservative: only flag explicit patterns, not inferred
      const lackAwarenessPatterns = [
        /\b(always|never)\s+(their fault|their problem|they|them)\s+(fault|problem|wrong)\b/i,
        /\b(never|don't|can't)\s+(see|understand|realize|recognize)\s+(my|how I|what I)\b/i,
        /\b(blame|blaming)\s+(others|them|everyone|people)\s+(always|never|for everything)\b/i,
        /\b(no idea|don't know|can't tell|unaware)\s+(why|how|what)\s+(they|others|people)\b/i,
      ]

      const hasLackAwareness = lackAwarenessPatterns.some(pattern => pattern.test(responseText))

      if (hasLackAwareness) {
        return {
          ruleId: 'lack_of_self_awareness',
          label: 'Lack of self-awareness',
          reason: 'Patterns indicating lack of self-awareness detected',
          evidence: [
            { field: 'detected_pattern', value: 'lack_of_self_awareness' },
          ],
          capScoreTo: 60,
        }
      }

      return null
    },
  },

  // Rule 7: Deceptive/manipulative language (SAFETY, SOFT/HARD)
  {
    id: 'deceptive_manipulative_language',
    label: 'Deceptive/manipulative language',
    type: 'SAFETY',
    severity: 'HARD',
    capScoreTo: 55,
    evaluate: (input) => {
      const { formattedResponses, userDealbreakers } = input
      
      if (!userDealbreakers.includes('Deceptive/manipulative language')) {
        return null
      }

      const responseText = formattedResponses.toLowerCase()
      
      // Conservative list: only explicit keywords
      const manipulativeKeywords = [
        /\blie to\b/i,
        /\bmanipulate\b/i,
        /\bgaslight\b/i,
        /\bplay games\b/i,
        /\b(deceive|deception|deceptive)\b/i,
        /\b(manipulation|manipulating)\b/i,
      ]

      const hasManipulativeLanguage = manipulativeKeywords.some(pattern => pattern.test(responseText))

      if (hasManipulativeLanguage) {
        return {
          ruleId: 'deceptive_manipulative_language',
          label: 'Deceptive/manipulative language',
          reason: 'Explicit manipulative or deceptive language detected',
          evidence: [
            { field: 'detected_keywords', value: 'manipulative_language' },
          ],
          capScoreTo: 55,
        }
      }

      return null
    },
  },

  // Rule 8: Status-oriented dating (PREFERENCE, SOFT)
  {
    id: 'status_oriented_dating',
    label: 'Status-oriented dating',
    type: 'PREFERENCE',
    severity: 'SOFT',
    capScoreTo: 65,
    evaluate: (input) => {
      const { requesterStructuredFields, userDealbreakers } = input
      
      if (!userDealbreakers.includes('Status-oriented dating')) {
        return null
      }

      const statusOrientation = requesterStructuredFields.status_orientation

      if (!statusOrientation) {
        return null // Cannot evaluate without structured field
      }

      if (statusOrientation === 'high') {
        return {
          ruleId: 'status_oriented_dating',
          label: 'Status-oriented dating',
          reason: 'Requester indicated high importance of status/success in partner selection',
          evidence: [
            { field: 'requester_status_orientation', value: statusOrientation },
          ],
          capScoreTo: 65,
        }
      }

      return null
    },
  },
]

/**
 * Evaluate all dealbreaker rules and return hits
 */
export function evaluateDealbreakers(
  input: DealbreakerRuleInput
): DealbreakerRuleHit[] {
  const hits: DealbreakerRuleHit[] = []

  for (const rule of V1_DEALBREAKER_RULES) {
    // Only evaluate rules for dealbreakers the user has selected
    if (!input.userDealbreakers.includes(rule.label)) {
      continue
    }

    const hit = rule.evaluate(input)
    if (hit) {
      hits.push(hit)
    }
  }

  return hits
}

/**
 * Apply dealbreaker caps to compatibility score
 */
export function applyDealbreakerCaps(
  baseScore: number,
  dealbreakerHits: DealbreakerRuleHit[]
): number {
  if (dealbreakerHits.length === 0) {
    return baseScore
  }

  // Find the minimum cap (most restrictive)
  const minCap = Math.min(...dealbreakerHits.map(hit => hit.capScoreTo))

  return Math.min(baseScore, minCap)
}


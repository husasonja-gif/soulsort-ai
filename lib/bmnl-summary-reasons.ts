// Deterministic summary reasons engine (no LLM, pattern-based)
// Generates per-axis reasons based on answer patterns and radar levels

export interface Answer {
  question_number: number
  question_text: string
  raw_answer: string
}

export interface Signal {
  question_number: number
  signal_level: 'low' | 'emerging' | 'stable' | 'mastering'
  is_defensive?: boolean
}

export interface RadarProfile {
  participation: 'low' | 'emerging' | 'stable' | 'mastering'
  consent_literacy: 'low' | 'emerging' | 'stable' | 'mastering'
  communal_responsibility: 'low' | 'emerging' | 'stable' | 'mastering'
  inclusion_awareness: 'low' | 'emerging' | 'stable' | 'mastering'
  self_regulation: 'low' | 'emerging' | 'stable' | 'mastering'
  openness_to_learning: 'low' | 'emerging' | 'stable' | 'mastering'
}

export interface SummaryReason {
  axis: string
  level: 'low' | 'emerging' | 'stable' | 'mastering'
  reasons: string[]
}

/**
 * Generate deterministic summary reasons for each axis
 * Pattern-based, no LLM, based on answer content and radar levels
 */
export function generateSummaryReasons(
  answers: Answer[],
  radar: RadarProfile,
  signals?: Signal[]
): SummaryReason[] {
  const reasons: SummaryReason[] = []

  // Helper: check if answer contains pattern (case-insensitive)
  const hasPattern = (answerText: string, patterns: string[]): boolean => {
    const lower = answerText.toLowerCase()
    return patterns.some(pattern => lower.includes(pattern))
  }

  // Helper: get answer for question
  const getAnswer = (questionNumber: number): string => {
    const answer = answers.find(a => a.question_number === questionNumber)
    return answer?.raw_answer || ''
  }

  // Participation reasons
  const participationReasons: string[] = []
  if (radar.participation === 'low' || radar.participation === 'emerging') {
    const q9 = getAnswer(9)
    const q10 = getAnswer(10)
    const q11 = getAnswer(11)
    
    if (hasPattern(q9, ['if needed', 'if it\'s needed', 'maybe', 'possibly', 'perhaps'])) {
      participationReasons.push('Volunteering commitment is conditional rather than proactive')
    }
    if (hasPattern(q10, ['not sure', 'don\'t know', 'uncertain', 'unsure', 'haven\'t thought'])) {
      participationReasons.push('Gifting intentions are vague or uncertain')
    }
    if (hasPattern(q11, ['good parties', 'fun', 'entertainment', 'have a good time', 'enjoy'])) {
      participationReasons.push('Focus is on consumption rather than contribution')
    }
    if (q9 && !hasPattern(q9, ['yes', 'yes,', 'commit', 'volunteer', 'help', 'shift'])) {
      participationReasons.push('Volunteer commitment lacks clarity or enthusiasm')
    }
  }
  if (participationReasons.length === 0 && radar.participation !== 'low' && radar.participation !== 'emerging') {
    participationReasons.push('Shows proactive commitment to volunteering and gifting')
  }
  reasons.push({
    axis: 'participation',
    level: radar.participation,
    reasons: participationReasons.slice(0, 3), // Max 3 reasons
  })

  // Consent literacy reasons
  const consentReasons: string[] = []
  if (radar.consent_literacy === 'low' || radar.consent_literacy === 'emerging') {
    const q5 = getAnswer(5)
    
    if (hasPattern(q5, ['read the room', 'hope', 'assume', 'intuition', 'vibes'])) {
      consentReasons.push('Relies on assumptions and nonverbal cues rather than explicit check-ins')
    }
    if (!hasPattern(q5, ['ask', 'check', 'verify', 'consent', 'permission', 'clarify', 'confirm'])) {
      consentReasons.push('Missing explicit language about asking for permission or checking boundaries')
    }
    if (hasPattern(q5, ['hope', 'hope that', 'trust', 'assume good'])) {
      consentReasons.push('Places responsibility on others to communicate boundaries rather than actively seeking clarity')
    }
  }
  if (consentReasons.length === 0 && radar.consent_literacy !== 'low' && radar.consent_literacy !== 'emerging') {
    consentReasons.push('Demonstrates awareness of checking boundaries and seeking explicit consent')
  }
  reasons.push({
    axis: 'consent_literacy',
    level: radar.consent_literacy,
    reasons: consentReasons.slice(0, 3),
  })

  // Communal responsibility reasons
  const communalReasons: string[] = []
  if (radar.communal_responsibility === 'low' || radar.communal_responsibility === 'emerging') {
    const q8 = getAnswer(8)
    const q10 = getAnswer(10)
    const q11 = getAnswer(11)
    
    if (hasPattern(q8, ['themselves', 'be themselves', 'freedom', 'no rules', 'no expectations'])) {
      communalReasons.push('Frames participation as individual expression without communal accountability')
    }
    if (hasPattern(q11, ['good parties', 'fun', 'entertainment']) && !hasPattern(q10, ['help', 'contribute', 'gift', 'care'])) {
      communalReasons.push('Expectations center on receiving rather than contributing to community well-being')
    }
    if (!hasPattern(q10 + ' ' + q11, ['share', 'contribute', 'gift', 'care', 'help', 'support', 'community'])) {
      communalReasons.push('Limited language about shared ownership and collective care')
    }
  }
  if (communalReasons.length === 0 && radar.communal_responsibility !== 'low' && radar.communal_responsibility !== 'emerging') {
    communalReasons.push('Shows understanding of shared responsibility and community accountability')
  }
  reasons.push({
    axis: 'communal_responsibility',
    level: radar.communal_responsibility,
    reasons: communalReasons.slice(0, 3),
  })

  // Inclusion awareness reasons
  const inclusionReasons: string[] = []
  if (radar.inclusion_awareness === 'low' || radar.inclusion_awareness === 'emerging') {
    const q7 = getAnswer(7)
    const signalQ7 = signals?.find(s => s.question_number === 7)
    
    if (hasPattern(q7, ['try not to hurt', 'avoid', 'don\'t want to', 'hope not'])) {
      inclusionReasons.push('Focuses on prevention rather than response and repair when harm occurs')
    }
    if (signalQ7?.is_defensive || !hasPattern(q7, ['apologize', 'repair', 'address', 'acknowledge', 'learn', 'listen'])) {
      inclusionReasons.push('Limited language about acknowledging impact and taking responsibility for unintentional harm')
    }
    if (!hasPattern(q7, ['impact', 'affect', 'hurt', 'harm', 'negative']) && !hasPattern(q7, ['listen', 'understand', 'repair'])) {
      inclusionReasons.push('Shows resistance to acknowledging or responding to negative impact on others')
    }
  }
  if (inclusionReasons.length === 0 && radar.inclusion_awareness !== 'low' && radar.inclusion_awareness !== 'emerging') {
    inclusionReasons.push('Demonstrates awareness of impact and commitment to repair and inclusion')
  }
  reasons.push({
    axis: 'inclusion_awareness',
    level: radar.inclusion_awareness,
    reasons: inclusionReasons.slice(0, 3),
  })

  // Self-regulation reasons
  const selfRegulationReasons: string[] = []
  if (radar.self_regulation === 'low' || radar.self_regulation === 'emerging') {
    const q4 = getAnswer(4)
    
    if (!hasPattern(q4, ['space', 'take space', 'step back', 'pause', 'rest', 'boundaries', 'limits'])) {
      selfRegulationReasons.push('Limited articulation of strategies for managing intensity and personal boundaries')
    }
    if (!hasPattern(q4, ['ready', 'return', 'come back', 'reengage', 'regroup'])) {
      selfRegulationReasons.push('Missing language about re-engagement after taking space')
    }
  } else {
    // Q4 "take space and come back" is acceptable and should produce emerging/stable reasons
    const q4 = getAnswer(4)
    if (hasPattern(q4, ['take space', 'come back', 'when ready'])) {
      selfRegulationReasons.push('Shows awareness of personal limits and strategies for self-regulation')
    }
  }
  if (selfRegulationReasons.length === 0 && radar.self_regulation !== 'low') {
    selfRegulationReasons.push('Demonstrates self-awareness and resilience strategies')
  }
  reasons.push({
    axis: 'self_regulation',
    level: radar.self_regulation,
    reasons: selfRegulationReasons.slice(0, 3),
  })

  // Openness to learning reasons
  const opennessReasons: string[] = []
  if (radar.openness_to_learning === 'low' || radar.openness_to_learning === 'emerging') {
    const q6 = getAnswer(6)
    
    if (hasPattern(q6, ['struggle', 'difficulty', 'not much experience', 'unfamiliar', 'hard'])) {
      // Naming challenges is positive, but if combined with no growth language, it's still emerging
      if (!hasPattern(q6, ['would try', 'listen', 'learn', 'open', 'willing', 'curious'])) {
        opennessReasons.push('Acknowledges gaps but lacks clear articulation of willingness to learn')
      } else {
        opennessReasons.push('Shows self-awareness of learning needs, which is a positive starting point')
      }
    }
    if (!hasPattern(q6, ['listen', 'learn', 'feedback', 'input', 'perspective', 'understand'])) {
      opennessReasons.push('Limited language about receiving and integrating feedback')
    }
  }
  if (opennessReasons.length === 0 && radar.openness_to_learning !== 'low' && radar.openness_to_learning !== 'emerging') {
    opennessReasons.push('Demonstrates curiosity, humility, and receptivity to feedback')
  }
  reasons.push({
    axis: 'openness_to_learning',
    level: radar.openness_to_learning,
    reasons: opennessReasons.slice(0, 3),
  })

  return reasons
}





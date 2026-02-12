import type { CanonicalSignalScores, RadarDimensions } from './types'

type PreferencesLike = Record<string, number | undefined> | null | undefined

export interface DeepInsightArea {
  id: string
  title: string
  icon: string
  leftLabel: string
  rightLabel: string
  youValue: number
  themValue?: number
  zoneStart?: number
  zoneEnd?: number
  themZoneStart?: number
  themZoneEnd?: number
  descriptor: string
  insight: string
  secondary?: {
    leftLabel: string
    rightLabel: string
    youValue: number
    themValue?: number
    zoneStart?: number
    zoneEnd?: number
    themZoneStart?: number
    themZoneEnd?: number
    descriptor: string
  }
}

export interface DeepInsightSummary {
  flow: string[]
  friction: string[]
  creativeEdges: string[]
}

const clamp = (v: number): number => Math.max(0, Math.min(100, Math.round(v)))
const mean = (values: number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length

type SignalScoresLike = Partial<CanonicalSignalScores> | null | undefined

function getPref(preferences: PreferencesLike, key: string, fallback: number): number {
  const value = preferences?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function deriveFallbackPreferences(radar: RadarDimensions): Record<string, number> {
  const novelty = clamp(50 + (radar.searching - radar.rooting) * 0.45)
  const eroticPace = clamp(50 + (radar.self_enhancement - radar.rooting) * 0.35)
  const vanillaKinky = clamp(50 + (radar.erotic - radar.rooting) * 0.4)
  const openMonogamous = clamp(50 + (radar.rooting - radar.searching) * 0.45)
  const boundariesEase = clamp(radar.consent * 0.6 + radar.relational * 0.4)

  return {
    erotic_pace: eroticPace,
    novelty_depth_preference: novelty,
    vanilla_kinky: vanillaKinky,
    open_monogamous: openMonogamous,
    boundaries_ease: boundariesEase,
  }
}

function effectivePreferences(radar: RadarDimensions, preferences?: PreferencesLike): Record<string, number> {
  const fallback = deriveFallbackPreferences(radar)
  return {
    erotic_pace: getPref(preferences, 'erotic_pace', getPref(preferences, 'pace', fallback.erotic_pace)),
    novelty_depth_preference: getPref(
      preferences,
      'novelty_depth_preference',
      getPref(preferences, 'connection_chemistry', fallback.novelty_depth_preference)
    ),
    vanilla_kinky: getPref(preferences, 'vanilla_kinky', fallback.vanilla_kinky),
    open_monogamous: getPref(preferences, 'open_monogamous', fallback.open_monogamous),
    boundaries_ease: getPref(preferences, 'boundaries_ease', fallback.boundaries_ease),
  }
}

function descriptorFromDelta(delta: number): string {
  if (Math.abs(delta) <= 10) return 'aligned'
  if (Math.abs(delta) <= 22) return 'slight tension'
  return 'tension zone'
}

function axisDescriptor(value: number, low: string, high: string): string {
  if (value <= 35) return `leans ${low.toLowerCase()}`
  if (value >= 65) return `leans ${high.toLowerCase()}`
  return 'balanced'
}

function varianceBand(values: number[]): { value: number; zoneStart: number; zoneEnd: number } {
  const score = clamp(mean(values))
  const variance = mean(values.map((value) => Math.pow(value - score, 2)))
  const stdDev = Math.sqrt(variance)
  // Low variance => tight band (aligned). High variance => wider band (tension).
  const halfWidth = Math.max(2, Math.min(30, stdDev * 1.5 + 2))
  return {
    value: score,
    zoneStart: clamp(score - halfWidth),
    zoneEnd: clamp(score + halfWidth),
  }
}

function signalOrFallback(
  signals: SignalScoresLike,
  key: keyof CanonicalSignalScores,
  fallback: number
): number {
  const value = signals?.[key]
  if (typeof value === 'number' && Number.isFinite(value)) {
    // signal scores are stored as 0..1
    return clamp(value * 100)
  }
  return clamp(fallback)
}

function areaValuesFromRadar(radar: RadarDimensions, preferences?: PreferencesLike) {
  const p = effectivePreferences(radar, preferences)

  const pacingRhythmComponents = [p.erotic_pace, p.novelty_depth_preference, radar.self_enhancement]
  const autonomyClosenessComponents = [p.open_monogamous, radar.relational, 100 - radar.searching]
  const conflictStyleComponents = [radar.relational, radar.consent, radar.self_enhancement]
  const voicingListeningComponents = [p.boundaries_ease, radar.consent, radar.relational]
  const eroticExpressionComponents = [p.vanilla_kinky, p.novelty_depth_preference, radar.erotic]
  const emotionalRegulationComponents = [radar.relational, radar.consent, 100 - radar.self_enhancement]
  const valuesAdventureComponents = [radar.searching, 100 - radar.rooting]
  const valuesImpactComponents = [radar.self_transcendence, radar.self_enhancement]

  return {
    pacingRhythmComponents,
    autonomyClosenessComponents,
    conflictStyleComponents,
    voicingListeningComponents,
    eroticExpressionComponents,
    emotionalRegulationComponents,
    valuesAdventureComponents,
    valuesImpactComponents,
  }
}

export function buildUserDeepInsights(
  radar: RadarDimensions,
  preferences?: PreferencesLike,
  signalScores?: SignalScoresLike
): DeepInsightArea[] {
  const fallback = areaValuesFromRadar(radar, preferences)

  const pacingRhythm = varianceBand([
    signalOrFallback(signalScores, 'desire_regulation', fallback.pacingRhythmComponents[0]),
    signalOrFallback(signalScores, 'desire_intensity', fallback.pacingRhythmComponents[1]),
    signalOrFallback(signalScores, 'novelty_depth_preference', fallback.pacingRhythmComponents[2]),
  ])
  const voicingListening = varianceBand([
    signalOrFallback(signalScores, 'communication_style', fallback.voicingListeningComponents[0]),
    signalOrFallback(signalScores, 'self_advocacy', fallback.voicingListeningComponents[1]),
    signalOrFallback(signalScores, 'negotiation_comfort', fallback.voicingListeningComponents[2]),
  ])
  const conflictStyle = varianceBand([
    signalOrFallback(signalScores, 'conflict_navigation', fallback.conflictStyleComponents[0]),
    signalOrFallback(signalScores, 'repair_motivation', fallback.conflictStyleComponents[1]),
    signalOrFallback(signalScores, 'self_regulation_awareness', fallback.conflictStyleComponents[2]),
  ])
  const autonomyCloseness = varianceBand([
    signalOrFallback(signalScores, 'freedom_orientation', fallback.autonomyClosenessComponents[0]),
    signalOrFallback(signalScores, 'enm_openness', fallback.autonomyClosenessComponents[1]),
    100 - signalOrFallback(signalScores, 'exclusivity_comfort', 100 - fallback.autonomyClosenessComponents[2]),
  ])
  const eroticExpression = varianceBand([
    signalOrFallback(signalScores, 'erotic_attunement', fallback.eroticExpressionComponents[0]),
    signalOrFallback(signalScores, 'fantasy_openness', fallback.eroticExpressionComponents[1]),
    signalOrFallback(signalScores, 'attraction_depth_preference', fallback.eroticExpressionComponents[2]),
  ])
  const emotionalRegulation = varianceBand([
    signalOrFallback(signalScores, 'self_regulation_awareness', fallback.emotionalRegulationComponents[0]),
    signalOrFallback(signalScores, 'stability_orientation', fallback.emotionalRegulationComponents[1]),
    signalOrFallback(signalScores, 'communication_style', fallback.emotionalRegulationComponents[2]),
  ])
  const valuesAdventure = varianceBand([
    signalOrFallback(signalScores, 'searching', fallback.valuesAdventureComponents[0]),
    100 - signalOrFallback(signalScores, 'rooting', 100 - fallback.valuesAdventureComponents[1]),
  ])
  const valuesImpact = varianceBand([
    signalOrFallback(signalScores, 'self_transcendence', fallback.valuesImpactComponents[0]),
    signalOrFallback(signalScores, 'self_enhancement', fallback.valuesImpactComponents[1]),
  ])

  return [
    {
      id: 'pacing-rhythm',
      title: 'Pacing & Rhythm',
      icon: '🔥',
      leftLabel: 'Slow burn',
      rightLabel: 'Fast ignition',
      youValue: pacingRhythm.value,
      zoneStart: pacingRhythm.zoneStart,
      zoneEnd: pacingRhythm.zoneEnd,
      descriptor: axisDescriptor(pacingRhythm.value, 'Slow burn', 'Fast ignition'),
      insight:
        'Conversation tip: ask, "What pace feels good for you right now?" and agree one next step that feels safe for both.',
    },
    {
      id: 'voicing-listening',
      title: 'Voicing & Listening',
      icon: '🗣️',
      leftLabel: 'Subtle cues',
      rightLabel: 'Direct asks',
      youValue: voicingListening.value,
      zoneStart: voicingListening.zoneStart,
      zoneEnd: voicingListening.zoneEnd,
      descriptor: axisDescriptor(voicingListening.value, 'Subtle cues', 'Direct asks'),
      insight:
        'Conversation tip: use one direct ask and one check-back ("Did I hear you right?") in the same conversation.',
    },
    {
      id: 'conflict-style',
      title: 'Conflict Style',
      icon: '⚡',
      leftLabel: 'Withdraw',
      rightLabel: 'Pursue',
      youValue: conflictStyle.value,
      zoneStart: conflictStyle.zoneStart,
      zoneEnd: conflictStyle.zoneEnd,
      descriptor: axisDescriptor(conflictStyle.value, 'Withdraw', 'Pursue'),
      insight:
        'Conversation tip: set a repair rule in advance: pause, cool down, and name a specific time to continue.',
    },
    {
      id: 'autonomy-closeness',
      title: 'Autonomy & Closeness',
      icon: '🫶',
      leftLabel: 'Need space',
      rightLabel: 'Need closeness',
      youValue: autonomyCloseness.value,
      zoneStart: autonomyCloseness.zoneStart,
      zoneEnd: autonomyCloseness.zoneEnd,
      descriptor: axisDescriptor(autonomyCloseness.value, 'Need space', 'Need closeness'),
      insight:
        'Conversation tip: share your refill pattern (alone time vs together time) before tension starts.',
    },
    {
      id: 'erotic-expression',
      title: 'Erotic Expression',
      icon: '🌙',
      leftLabel: 'Familiar',
      rightLabel: 'Exploratory',
      youValue: eroticExpression.value,
      zoneStart: eroticExpression.zoneStart,
      zoneEnd: eroticExpression.zoneEnd,
      descriptor: axisDescriptor(eroticExpression.value, 'Familiar', 'Exploratory'),
      insight:
        'Conversation tip: alternate comfort and novelty intentionally, instead of waiting for mismatch to appear.',
    },
    {
      id: 'emotional-regulation',
      title: 'Emotional Regulation',
      icon: '🌊',
      leftLabel: 'Self-soothe',
      rightLabel: 'Co-regulate',
      youValue: emotionalRegulation.value,
      zoneStart: emotionalRegulation.zoneStart,
      zoneEnd: emotionalRegulation.zoneEnd,
      descriptor: axisDescriptor(emotionalRegulation.value, 'Self-soothe', 'Co-regulate'),
      insight:
        'Conversation tip: when activated, state your process clearly: "I need X minutes and I will come back."',
    },
    {
      id: 'values-alignment',
      title: 'Values Alignment',
      icon: '🧭',
      leftLabel: 'Stability',
      rightLabel: 'Adventure',
      youValue: valuesAdventure.value,
      zoneStart: valuesAdventure.zoneStart,
      zoneEnd: valuesAdventure.zoneEnd,
      descriptor: axisDescriptor(valuesAdventure.value, 'Stability', 'Adventure'),
      secondary: {
        leftLabel: 'Meaning through roots',
        rightLabel: 'Meaning through impact',
        youValue: valuesImpact.value,
        zoneStart: valuesImpact.zoneStart,
        zoneEnd: valuesImpact.zoneEnd,
        descriptor: axisDescriptor(valuesImpact.value, 'roots', 'impact'),
      },
      insight:
        'Conversation tip: compare direction, not just chemistry: "What are we building in the next 3-6 months?"',
    },
  ]
}

export function buildComparisonDeepInsights(
  youRadar: RadarDimensions,
  themRadar: RadarDimensions,
  youPreferences?: PreferencesLike,
  themPreferences?: PreferencesLike,
  youSignals?: SignalScoresLike,
  themSignals?: SignalScoresLike
): { areas: DeepInsightArea[]; summary: DeepInsightSummary } {
  const yAreas = buildUserDeepInsights(youRadar, youPreferences, youSignals)
  const tAreas = buildUserDeepInsights(themRadar, themPreferences, themSignals)
  const areaById = (areas: DeepInsightArea[], id: string): DeepInsightArea =>
    areas.find((area) => area.id === id) || areas[0]

  const areas: DeepInsightArea[] = [
    {
      id: 'pacing-rhythm',
      title: 'How You Both Desire',
      icon: '🔥',
      leftLabel: 'Slow pace',
      rightLabel: 'High intensity',
      youValue: areaById(yAreas, 'pacing-rhythm').youValue,
      themValue: areaById(tAreas, 'pacing-rhythm').youValue,
      zoneStart: areaById(yAreas, 'pacing-rhythm').zoneStart,
      zoneEnd: areaById(yAreas, 'pacing-rhythm').zoneEnd,
      themZoneStart: areaById(tAreas, 'pacing-rhythm').zoneStart,
      themZoneEnd: areaById(tAreas, 'pacing-rhythm').zoneEnd,
      descriptor: descriptorFromDelta(areaById(yAreas, 'pacing-rhythm').youValue - areaById(tAreas, 'pacing-rhythm').youValue),
      insight:
        'Try this: agree a pace check-in question you both use when things speed up or stall.',
    },
    {
      id: 'voicing-listening',
      title: 'Voicing & Listening',
      icon: '🗣️',
      leftLabel: 'Subtle cues',
      rightLabel: 'Direct asks',
      youValue: areaById(yAreas, 'voicing-listening').youValue,
      themValue: areaById(tAreas, 'voicing-listening').youValue,
      zoneStart: areaById(yAreas, 'voicing-listening').zoneStart,
      zoneEnd: areaById(yAreas, 'voicing-listening').zoneEnd,
      themZoneStart: areaById(tAreas, 'voicing-listening').zoneStart,
      themZoneEnd: areaById(tAreas, 'voicing-listening').zoneEnd,
      descriptor: descriptorFromDelta(areaById(yAreas, 'voicing-listening').youValue - areaById(tAreas, 'voicing-listening').youValue),
      insight:
        'Try this: one person makes a direct ask, the other mirrors it back in one sentence before responding.',
    },
    {
      id: 'conflict-style',
      title: 'Conflict Style',
      icon: '⚡',
      leftLabel: 'Withdraw',
      rightLabel: 'Pursue',
      youValue: areaById(yAreas, 'conflict-style').youValue,
      themValue: areaById(tAreas, 'conflict-style').youValue,
      zoneStart: areaById(yAreas, 'conflict-style').zoneStart,
      zoneEnd: areaById(yAreas, 'conflict-style').zoneEnd,
      themZoneStart: areaById(tAreas, 'conflict-style').zoneStart,
      themZoneEnd: areaById(tAreas, 'conflict-style').zoneEnd,
      descriptor: descriptorFromDelta(areaById(yAreas, 'conflict-style').youValue - areaById(tAreas, 'conflict-style').youValue),
      insight:
        'Try this: set a same-day repair window after conflict, even if the full topic is handled later.',
    },
    {
      id: 'autonomy-closeness',
      title: 'Autonomy & Closeness',
      icon: '🫶',
      leftLabel: 'Need space',
      rightLabel: 'Need closeness',
      youValue: areaById(yAreas, 'autonomy-closeness').youValue,
      themValue: areaById(tAreas, 'autonomy-closeness').youValue,
      zoneStart: areaById(yAreas, 'autonomy-closeness').zoneStart,
      zoneEnd: areaById(yAreas, 'autonomy-closeness').zoneEnd,
      themZoneStart: areaById(tAreas, 'autonomy-closeness').zoneStart,
      themZoneEnd: areaById(tAreas, 'autonomy-closeness').zoneEnd,
      descriptor: descriptorFromDelta(areaById(yAreas, 'autonomy-closeness').youValue - areaById(tAreas, 'autonomy-closeness').youValue),
      insight:
        'Try this: name one thing that helps each person reconnect after space or overwhelm.',
    },
    {
      id: 'erotic-expression',
      title: 'Erotic Expression',
      icon: '🌙',
      leftLabel: 'Familiar',
      rightLabel: 'Exploratory',
      youValue: areaById(yAreas, 'erotic-expression').youValue,
      themValue: areaById(tAreas, 'erotic-expression').youValue,
      zoneStart: areaById(yAreas, 'erotic-expression').zoneStart,
      zoneEnd: areaById(yAreas, 'erotic-expression').zoneEnd,
      themZoneStart: areaById(tAreas, 'erotic-expression').zoneStart,
      themZoneEnd: areaById(tAreas, 'erotic-expression').zoneEnd,
      descriptor: descriptorFromDelta(areaById(yAreas, 'erotic-expression').youValue - areaById(tAreas, 'erotic-expression').youValue),
      insight:
        'Try this: plan one familiar and one exploratory moment so both people feel seen.',
    },
    {
      id: 'emotional-regulation',
      title: 'Emotional Regulation',
      icon: '🌊',
      leftLabel: 'Self-soothe',
      rightLabel: 'Co-regulate',
      youValue: areaById(yAreas, 'emotional-regulation').youValue,
      themValue: areaById(tAreas, 'emotional-regulation').youValue,
      zoneStart: areaById(yAreas, 'emotional-regulation').zoneStart,
      zoneEnd: areaById(yAreas, 'emotional-regulation').zoneEnd,
      themZoneStart: areaById(tAreas, 'emotional-regulation').zoneStart,
      themZoneEnd: areaById(tAreas, 'emotional-regulation').zoneEnd,
      descriptor: descriptorFromDelta(areaById(yAreas, 'emotional-regulation').youValue - areaById(tAreas, 'emotional-regulation').youValue),
      insight:
        'Try this: use a return promise ("I will come back at __") whenever either person takes space.',
    },
    {
      id: 'values-alignment',
      title: 'Values Alignment',
      icon: '🧭',
      leftLabel: 'Stability',
      rightLabel: 'Adventure',
      youValue: areaById(yAreas, 'values-alignment').youValue,
      themValue: areaById(tAreas, 'values-alignment').youValue,
      zoneStart: areaById(yAreas, 'values-alignment').zoneStart,
      zoneEnd: areaById(yAreas, 'values-alignment').zoneEnd,
      themZoneStart: areaById(tAreas, 'values-alignment').zoneStart,
      themZoneEnd: areaById(tAreas, 'values-alignment').zoneEnd,
      descriptor: descriptorFromDelta(areaById(yAreas, 'values-alignment').youValue - areaById(tAreas, 'values-alignment').youValue),
      secondary: {
        leftLabel: 'Meaning through roots',
        rightLabel: 'Meaning through impact',
        youValue: areaById(yAreas, 'values-alignment').secondary?.youValue || areaById(yAreas, 'values-alignment').youValue,
        themValue: areaById(tAreas, 'values-alignment').secondary?.youValue || areaById(tAreas, 'values-alignment').youValue,
        zoneStart: areaById(yAreas, 'values-alignment').secondary?.zoneStart,
        zoneEnd: areaById(yAreas, 'values-alignment').secondary?.zoneEnd,
        themZoneStart: areaById(tAreas, 'values-alignment').secondary?.zoneStart,
        themZoneEnd: areaById(tAreas, 'values-alignment').secondary?.zoneEnd,
        descriptor: descriptorFromDelta(
          (areaById(yAreas, 'values-alignment').secondary?.youValue || areaById(yAreas, 'values-alignment').youValue) -
            (areaById(tAreas, 'values-alignment').secondary?.youValue || areaById(tAreas, 'values-alignment').youValue)
        ),
      },
      insight:
        'Try this: align on one shared priority and one personal priority for the next month.',
    },
  ]

  const flow: string[] = []
  const friction: string[] = []

  for (const area of areas) {
    const delta = Math.abs(area.youValue - (area.themValue ?? area.youValue))
    if (delta <= 12) {
      flow.push(`${area.icon} ${area.title}: natural alignment`)
    } else if (delta >= 25) {
      friction.push(`${area.icon} ${area.title}: high mismatch to negotiate`)
    }
  }

  const creativeEdges: string[] = [
    'Translate one friction area into a weekly ritual (timing, repair, or check-in).',
    'Use one aligned area as your anchor when tension rises.',
  ]

  return {
    areas,
    summary: {
      flow: flow.slice(0, 5),
      friction: friction.slice(0, 4),
      creativeEdges: creativeEdges.slice(0, 2),
    },
  }
}

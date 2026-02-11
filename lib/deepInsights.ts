import type { RadarDimensions } from './types'

type PreferencesLike = Record<string, number | undefined> | null | undefined

export interface DeepInsightArea {
  id: string
  title: string
  icon: string
  leftLabel: string
  rightLabel: string
  youValue: number
  themValue?: number
  descriptor: string
  insight: string
  secondary?: {
    leftLabel: string
    rightLabel: string
    youValue: number
    themValue?: number
    descriptor: string
  }
}

export interface DeepInsightSummary {
  flow: string[]
  friction: string[]
  creativeEdges: string[]
}

const clamp = (v: number): number => Math.max(0, Math.min(100, Math.round(v)))

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

function areaValues(radar: RadarDimensions, preferences?: PreferencesLike) {
  const p = effectivePreferences(radar, preferences)

  const pacingRhythm = clamp(p.erotic_pace * 0.5 + p.novelty_depth_preference * 0.3 + radar.self_enhancement * 0.2)
  const autonomyCloseness = clamp(p.open_monogamous * 0.5 + radar.relational * 0.3 + (100 - radar.searching) * 0.2)
  const conflictStyle = clamp(radar.relational * 0.55 + radar.consent * 0.3 + radar.self_enhancement * 0.15)
  const voicingListening = clamp(p.boundaries_ease * 0.5 + radar.consent * 0.3 + radar.relational * 0.2)
  const eroticExpression = clamp(p.vanilla_kinky * 0.5 + p.novelty_depth_preference * 0.3 + radar.erotic * 0.2)
  const emotionalRegulation = clamp(radar.relational * 0.45 + radar.consent * 0.35 + (100 - radar.self_enhancement) * 0.2)
  const valuesAdventure = clamp(radar.searching * 0.6 + (100 - radar.rooting) * 0.4)
  const valuesImpact = clamp(radar.self_transcendence * 0.6 + radar.self_enhancement * 0.4)

  return {
    pacingRhythm,
    autonomyCloseness,
    conflictStyle,
    voicingListening,
    eroticExpression,
    emotionalRegulation,
    valuesAdventure,
    valuesImpact,
  }
}

export function buildUserDeepInsights(
  radar: RadarDimensions,
  preferences?: PreferencesLike
): DeepInsightArea[] {
  const v = areaValues(radar, preferences)

  return [
    {
      id: 'pacing-rhythm',
      title: 'Pacing & Rhythm',
      icon: '🔥',
      leftLabel: 'Slow burn',
      rightLabel: 'Fast ignition',
      youValue: v.pacingRhythm,
      descriptor: axisDescriptor(v.pacingRhythm, 'Slow burn', 'Fast ignition'),
      insight:
        "How fast you move from stranger to intimate. Mismatch here can feel like rejection in both directions when one person needs runway and the other feels ready now.",
    },
    {
      id: 'voicing-listening',
      title: 'Voicing & Listening',
      icon: '🗣️',
      leftLabel: 'Subtle cues',
      rightLabel: 'Direct asks',
      youValue: v.voicingListening,
      descriptor: axisDescriptor(v.voicingListening, 'Subtle cues', 'Direct asks'),
      insight:
        "How you express needs and receive what is unsaid. Clear communication reduces friction, but different signaling styles can still create missed intentions.",
    },
    {
      id: 'conflict-style',
      title: 'Conflict Style',
      icon: '⚡',
      leftLabel: 'Withdraw',
      rightLabel: 'Pursue',
      youValue: v.conflictStyle,
      descriptor: axisDescriptor(v.conflictStyle, 'Withdraw', 'Pursue'),
      insight:
        "What happens when you disagree. Relationships usually survive conflict when repair is intentional, paced, and explicitly initiated.",
    },
    {
      id: 'autonomy-closeness',
      title: 'Autonomy & Closeness',
      icon: '🫶',
      leftLabel: 'Need space',
      rightLabel: 'Need closeness',
      youValue: v.autonomyCloseness,
      descriptor: axisDescriptor(v.autonomyCloseness, 'Need space', 'Need closeness'),
      insight:
        "How much space you need versus togetherness. This is often the attachment dance: do you regenerate alone, together, or with deliberate alternation?",
    },
    {
      id: 'erotic-expression',
      title: 'Erotic Expression',
      icon: '🌙',
      leftLabel: 'Familiar',
      rightLabel: 'Exploratory',
      youValue: v.eroticExpression,
      descriptor: axisDescriptor(v.eroticExpression, 'Familiar', 'Exploratory'),
      insight:
        "The kind of desire and intimacy you are drawn to. Differences here are workable when there is explicit negotiation instead of silent assumptions.",
    },
    {
      id: 'emotional-regulation',
      title: 'Emotional Regulation',
      icon: '🌊',
      leftLabel: 'Self-soothe',
      rightLabel: 'Co-regulate',
      youValue: v.emotionalRegulation,
      descriptor: axisDescriptor(v.emotionalRegulation, 'Self-soothe', 'Co-regulate'),
      insight:
        "How you handle big feelings. Naming your regulation style in real time lowers misread abandonment/smothering loops.",
    },
    {
      id: 'values-alignment',
      title: 'Values Alignment',
      icon: '🧭',
      leftLabel: 'Stability',
      rightLabel: 'Adventure',
      youValue: v.valuesAdventure,
      descriptor: axisDescriptor(v.valuesAdventure, 'Stability', 'Adventure'),
      secondary: {
        leftLabel: 'Meaning through roots',
        rightLabel: 'Meaning through impact',
        youValue: v.valuesImpact,
        descriptor: axisDescriptor(v.valuesImpact, 'roots', 'impact'),
      },
      insight:
        "What drives you and what you are building toward. Long-term fit improves when shared direction is explicit even if paths differ.",
    },
  ]
}

export function buildComparisonDeepInsights(
  youRadar: RadarDimensions,
  themRadar: RadarDimensions,
  youPreferences?: PreferencesLike,
  themPreferences?: PreferencesLike
): { areas: DeepInsightArea[]; summary: DeepInsightSummary } {
  const y = areaValues(youRadar, youPreferences)
  const t = areaValues(themRadar, themPreferences)

  const areas: DeepInsightArea[] = [
    {
      id: 'pacing-rhythm',
      title: 'How You Both Desire',
      icon: '🔥',
      leftLabel: 'Slow pace',
      rightLabel: 'High intensity',
      youValue: y.pacingRhythm,
      themValue: t.pacingRhythm,
      descriptor: descriptorFromDelta(y.pacingRhythm - t.pacingRhythm),
      insight:
        "Pacing mismatch can feel like rejection in both directions. Make timing explicit: who leads tempo, who leads intensity, and when you re-sync.",
    },
    {
      id: 'voicing-listening',
      title: 'Voicing & Listening',
      icon: '🗣️',
      leftLabel: 'Subtle cues',
      rightLabel: 'Direct asks',
      youValue: y.voicingListening,
      themValue: t.voicingListening,
      descriptor: descriptorFromDelta(y.voicingListening - t.voicingListening),
      insight:
        "Different signaling styles are common friction. One direct ask + one reflection per conflict cycle can dramatically improve understanding.",
    },
    {
      id: 'conflict-style',
      title: 'Conflict Style',
      icon: '⚡',
      leftLabel: 'Withdraw',
      rightLabel: 'Pursue',
      youValue: y.conflictStyle,
      themValue: t.conflictStyle,
      descriptor: descriptorFromDelta(y.conflictStyle - t.conflictStyle),
      insight:
        "Conflict itself is not the threat. Delayed repair and silent assumptions are. Set a check-in time after cooldown.",
    },
    {
      id: 'autonomy-closeness',
      title: 'Autonomy & Closeness',
      icon: '🫶',
      leftLabel: 'Need space',
      rightLabel: 'Need closeness',
      youValue: y.autonomyCloseness,
      themValue: t.autonomyCloseness,
      descriptor: descriptorFromDelta(y.autonomyCloseness - t.autonomyCloseness),
      insight:
        "Attachment rhythm is workable when both people know the other's refill pattern and don't moralize it.",
    },
    {
      id: 'erotic-expression',
      title: 'Erotic Expression',
      icon: '🌙',
      leftLabel: 'Familiar',
      rightLabel: 'Exploratory',
      youValue: y.eroticExpression,
      themValue: t.eroticExpression,
      descriptor: descriptorFromDelta(y.eroticExpression - t.eroticExpression),
      insight:
        "Erotic mismatch is a negotiation problem, not automatically incompatibility. Alternate comfort and novelty intentionally.",
    },
    {
      id: 'emotional-regulation',
      title: 'Emotional Regulation',
      icon: '🌊',
      leftLabel: 'Self-soothe',
      rightLabel: 'Co-regulate',
      youValue: y.emotionalRegulation,
      themValue: t.emotionalRegulation,
      descriptor: descriptorFromDelta(y.emotionalRegulation - t.emotionalRegulation),
      insight:
        "When overwhelmed, name process in the moment: 'I need X minutes and I will return.' This protects both nervous systems.",
    },
    {
      id: 'values-alignment',
      title: 'Values Alignment',
      icon: '🧭',
      leftLabel: 'Stability',
      rightLabel: 'Adventure',
      youValue: y.valuesAdventure,
      themValue: t.valuesAdventure,
      descriptor: descriptorFromDelta(y.valuesAdventure - t.valuesAdventure),
      secondary: {
        leftLabel: 'Meaning through roots',
        rightLabel: 'Meaning through impact',
        youValue: y.valuesImpact,
        themValue: t.valuesImpact,
        descriptor: descriptorFromDelta(y.valuesImpact - t.valuesImpact),
      },
      insight:
        "Shared direction matters most long-term. Differences can become strength when translated into a joint roadmap.",
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
    '🎯 Translate one friction area into a simple weekly ritual (timing, repair, or check-in).',
    '🧩 Keep one aligned area as your anchor when tension rises.',
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

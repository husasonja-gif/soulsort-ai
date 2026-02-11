import type { RadarDimensions } from './types'

export interface V4RadarAxes {
  meaning_values: number
  regulation_nervous_system: number
  erotic_attunement: number
  autonomy_orientation: number
  consent_orientation: number
  conflict_repair: number
}

const clamp0to100 = (value: number): number => Math.max(0, Math.min(100, Math.round(value)))

/**
 * Map legacy 7-dim radar values into V4 dashboard axes.
 * This keeps backward compatibility with stored profiles while rendering new axis language.
 */
export function toV4RadarAxes(data: RadarDimensions): V4RadarAxes {
  const meaningValues =
    (data.self_transcendence + data.self_enhancement + data.rooting + data.searching) / 4

  // Regulation reflects repair/settling patterns from relational + consent with some grounding signal.
  const regulationNervousSystem = data.relational * 0.7 + data.consent * 0.2 + data.rooting * 0.1

  // Autonomy reflects freedom/novelty tension.
  const autonomyOrientation = data.searching * 0.5 + data.relational * 0.5

  // Conflict & repair tracks relational skill with consent safety.
  const conflictRepair = data.relational * 0.65 + data.consent * 0.35

  return {
    meaning_values: clamp0to100(meaningValues),
    regulation_nervous_system: clamp0to100(regulationNervousSystem),
    erotic_attunement: clamp0to100(data.erotic),
    autonomy_orientation: clamp0to100(autonomyOrientation),
    consent_orientation: clamp0to100(data.consent),
    conflict_repair: clamp0to100(conflictRepair),
  }
}

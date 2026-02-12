// Type definitions for SoulSort AI

export type SubscriptionTier = 'free' | 'premium'

export type ConsentType = 'public_radar' | 'analytics' | 'data_processing'

export interface RadarDimensions {
  self_transcendence: number // 0-100
  self_enhancement: number
  rooting: number
  searching: number
  relational: number
  erotic: number
  consent: number
}

export interface CanonicalSignalScores {
  self_transcendence: number
  self_enhancement: number
  rooting: number
  searching: number
  communication_style: number
  conflict_navigation: number
  repair_motivation: number
  self_regulation_awareness: number
  stability_orientation: number
  erotic_attunement: number
  desire_intensity: number
  fantasy_openness: number
  attraction_depth_preference: number
  desire_regulation: number
  novelty_depth_preference: number
  freedom_orientation: number
  enm_openness: number
  exclusivity_comfort: number
  consent_awareness: number
  negotiation_comfort: number
  non_coerciveness: number
  self_advocacy: number
}

export interface UserProfile {
  id: string
  email: string
  onboarding_completed: boolean
  subscription_tier: SubscriptionTier
  subscription_expires_at?: string
}

export interface UserRadarProfile {
  id: string
  user_id: string
  self_transcendence: number
  self_enhancement: number
  rooting: number
  searching: number
  relational: number
  erotic: number
  consent: number
  v4_axes?: {
    meaning_values: number
    regulation_nervous_system: number
    erotic_attunement: number
    autonomy_orientation: number
    consent_orientation: number
    conflict_repair: number
  } | null
  signal_scores?: Partial<CanonicalSignalScores> | null
  deep_insights_copy?: Record<string, string> | null
  dealbreakers: string[]
  schema_version: number
  model_version: string
  scoring_version: string
  created_at: string
  updated_at: string
}

export interface ConsentRecord {
  id: string
  user_id: string
  consent_type: ConsentType
  granted: boolean
  granted_at: string
  revoked_at?: string
  version: number
}

export interface UserLink {
  id: string
  user_id: string
  link_id: string
  is_active: boolean
  expires_at?: string
  created_at: string
}

export interface RequesterAssessment {
  id: string
  link_id: string
  user_id: string
  self_transcendence: number
  self_enhancement: number
  rooting: number
  searching: number
  relational: number
  erotic: number
  consent: number
  v4_axes?: {
    meaning_values: number
    regulation_nervous_system: number
    erotic_attunement: number
    autonomy_orientation: number
    consent_orientation: number
    conflict_repair: number
  } | null
  signal_scores?: Partial<CanonicalSignalScores> | null
  deep_insights_copy?: Record<string, string> | null
  compatibility_score: number
  summary_text?: string
  schema_version: number
  model_version: string
  scoring_version: string
  created_at: string
}

export interface SurveyResponse {
  questionId: string
  response: string | boolean | number
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
  quickReplies?: QuickReplyOption[]
}

export interface QuickReplyOption {
  label: string
  value: string
  field: string // e.g., 'relationship_structure', 'kink_openness', 'status_orientation'
}









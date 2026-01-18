// Subscription and paid feature gate utilities

export type SubscriptionTier = 'free' | 'premium'

export interface SubscriptionFeatures {
  maxAssessments: number
  advancedAnalytics: boolean
  customDealbreakers: boolean
  prioritySupport: boolean
}

const FREE_TIER_FEATURES: SubscriptionFeatures = {
  maxAssessments: 5,
  advancedAnalytics: false,
  customDealbreakers: false,
  prioritySupport: false,
}

const PREMIUM_TIER_FEATURES: SubscriptionFeatures = {
  maxAssessments: -1, // Unlimited
  advancedAnalytics: true,
  customDealbreakers: true,
  prioritySupport: true,
}

export function getFeaturesForTier(tier: SubscriptionTier): SubscriptionFeatures {
  return tier === 'premium' ? PREMIUM_TIER_FEATURES : FREE_TIER_FEATURES
}

export function checkFeatureAccess(
  tier: SubscriptionTier,
  feature: keyof SubscriptionFeatures
): boolean {
  const features = getFeaturesForTier(tier)
  return features[feature] === true || features[feature] === -1
}

/**
 * Check if user can create more assessments
 */
export async function canCreateAssessment(
  userId: string,
  tier: SubscriptionTier
): Promise<boolean> {
  const features = getFeaturesForTier(tier)
  
  if (features.maxAssessments === -1) {
    return true // Unlimited
  }

  // Count existing assessments for this user
  const { createSupabaseServerClient } = await import('./supabaseServer')
  const supabase = await createSupabaseServerClient()
  
  const { count } = await supabase
    .from('requester_assessments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return (count || 0) < features.maxAssessments
}








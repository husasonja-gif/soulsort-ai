// Database utilities for SoulSort AI
import { createSupabaseServerClient } from './supabaseServer'
import type { UserRadarProfile, ConsentRecord, UserLink, RequesterAssessment, RadarDimensions } from './types'
import { CURRENT_SCHEMA_VERSION, CURRENT_MODEL_VERSION, CURRENT_SCORING_VERSION } from './llm'

/**
 * Get or create user profile
 */
export async function getUserProfile(userId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

/**
 * Create or update user radar profile
 */
export async function upsertUserRadarProfile(
  userId: string,
  radar: RadarDimensions,
  dealbreakers: string[]
) {
  const supabase = await createSupabaseServerClient()
  
  // Map consent (code) to consent_dim (DB) for database compatibility
  const { consent, ...radarWithoutConsent } = radar
  const dbRadar = {
    ...radarWithoutConsent,
    consent_dim: consent || (radar as any).consent_dim || 50, // Map consent to consent_dim for DB
  }

  const { data, error } = await supabase
    .from('user_radar_profiles')
    .upsert({
      user_id: userId,
      ...dbRadar,
      dealbreakers,
      schema_version: CURRENT_SCHEMA_VERSION,
      model_version: CURRENT_MODEL_VERSION,
      scoring_version: CURRENT_SCORING_VERSION,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get user radar profile
 */
export async function getUserRadarProfile(userId: string): Promise<UserRadarProfile | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_radar_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user radar profile:', error)
    throw error
  }
  
  // Map consent_dim (DB) to consent (code) for type compatibility
  if (data) {
    return {
      ...data,
      consent: data.consent_dim || data.consent || 50,
    } as UserRadarProfile
  }
  
  return null
}

/**
 * Get consent records for user
 */
export async function getUserConsents(userId: string): Promise<ConsentRecord[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('consent_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Record consent
 */
export async function recordConsent(
  userId: string,
  consentType: 'public_radar' | 'analytics' | 'data_processing',
  granted: boolean,
  ipAddress?: string,
  userAgent?: string
) {
  const supabase = await createSupabaseServerClient()
  
  // Revoke previous consent if granting new one
  if (granted) {
    await supabase
      .from('consent_ledger')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('consent_type', consentType)
      .is('revoked_at', null)
  }

  const { data, error } = await supabase
    .from('consent_ledger')
    .insert({
      user_id: userId,
      consent_type: consentType,
      granted,
      ip_address: ipAddress,
      user_agent: userAgent,
      version: 1,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get or create user link
 */
export async function getUserLink(userId: string): Promise<UserLink> {
  const supabase = await createSupabaseServerClient()
  
  // Check for existing active link
  const { data: existing } = await supabase
    .from('user_links')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (existing) return existing

  // Generate new link ID
  const linkId = crypto.randomUUID().replace(/-/g, '').substring(0, 16)

  const { data, error } = await supabase
    .from('user_links')
    .insert({
      user_id: userId,
      link_id: linkId,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get user link by link ID (public access - no auth required)
 */
export async function getUserLinkByLinkId(linkId: string): Promise<UserLink | null> {
  const supabase = await createSupabaseServerClient()
  
  // Use service role or bypass RLS for public link lookup
  // Since this is server-side, we can use the anon key but need RLS to allow public reads
  const { data, error } = await supabase
    .from('user_links')
    .select('*')
    .eq('link_id', linkId)
    .eq('is_active', true)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching link by linkId:', error)
    throw error
  }
  return data
}

/**
 * Create requester assessment
 */
export async function createRequesterAssessment(
  linkId: string,
  userId: string,
  radar: RadarDimensions,
  compatibilityScore: number,
  summary: string,
  abuseFlags: string[] = [],
  dealbreakerHits: Array<{ ruleId: string; label: string; reason: string; evidence: Array<{ field: string; value: string | number }>; capScoreTo: number }> = []
) {
  // Use service role to bypass RLS for requester assessment inserts
  // Requesters are anonymous, so we need service role to insert on their behalf
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  let supabase
  
  if (serviceRoleKey) {
    const { createClient } = await import('@supabase/supabase-js')
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )
  } else {
    // Fallback to regular client if service role not available
    supabase = await createSupabaseServerClient()
  }
  
  // Ensure all values are integers (0-100) as required by the database
  // Map consent (code) to consent_dim (DB) for database compatibility
  const radarInt = {
    self_transcendence: Math.round(Math.max(0, Math.min(100, radar.self_transcendence))),
    self_enhancement: Math.round(Math.max(0, Math.min(100, radar.self_enhancement))),
    rooting: Math.round(Math.max(0, Math.min(100, radar.rooting))),
    searching: Math.round(Math.max(0, Math.min(100, radar.searching))),
    relational: Math.round(Math.max(0, Math.min(100, radar.relational))),
    erotic: Math.round(Math.max(0, Math.min(100, radar.erotic))),
    consent_dim: Math.round(Math.max(0, Math.min(100, radar.consent || (radar as any).consent_dim || 50))), // Map consent to consent_dim for DB
  }
  
  const compatibilityScoreInt = Math.round(Math.max(0, Math.min(100, compatibilityScore)))
  
  // Convert dealbreakerHits to JSONB format for database storage (private to profile owner)
  const dealbreakerHitsJson = JSON.stringify(dealbreakerHits.map(hit => ({
    ruleId: hit.ruleId,
    label: hit.label,
    reason: hit.reason,
    evidence: hit.evidence,
    capScoreTo: hit.capScoreTo,
  })))
  
  // First verify the link exists and is active (helps with RLS policy evaluation)
  const { data: linkCheck, error: linkError } = await supabase
    .from('user_links')
    .select('link_id, is_active, user_id')
    .eq('link_id', linkId)
    .eq('is_active', true)
    .maybeSingle()

  if (linkError) {
    console.error('Error checking link before insert:', linkError)
    throw new Error(`Failed to verify link: ${linkError.message}`)
  }

  if (!linkCheck) {
    console.error('Link not found or not active:', linkId)
    throw new Error(`Link ${linkId} not found or not active`)
  }

  if (linkCheck.user_id !== userId) {
    console.error('Link user_id mismatch:', { linkUserId: linkCheck.user_id, providedUserId: userId })
    throw new Error('Link user_id does not match provided userId')
  }

  console.log('Link verified, inserting assessment for linkId:', linkId, 'userId:', userId)
  
  const { data, error } = await supabase
    .from('requester_assessments')
    .insert({
      link_id: linkId,
      user_id: userId,
      ...radarInt,
      compatibility_score: compatibilityScoreInt,
      summary_text: summary,
      abuse_flags: abuseFlags,
      dealbreaker_hits: dealbreakerHitsJson,
      schema_version: CURRENT_SCHEMA_VERSION,
      model_version: CURRENT_MODEL_VERSION,
      scoring_version: CURRENT_SCORING_VERSION,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating requester assessment:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)
    console.error('Insert data:', {
      link_id: linkId,
      user_id: userId,
      ...radarInt,
      compatibility_score: compatibilityScoreInt,
      summary_text: summary?.substring(0, 100),
      abuse_flags: abuseFlags,
    })
    throw error
  }
  return data
}

/**
 * Get requester assessment
 */
export async function getRequesterAssessment(assessmentId: string): Promise<RequesterAssessment | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('requester_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(userId: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('user_profiles')
    .update({ onboarding_completed: true })
    .eq('id', userId)

  if (error) throw error
}





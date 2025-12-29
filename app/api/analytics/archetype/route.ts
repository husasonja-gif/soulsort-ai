import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

/**
 * Analytics endpoint for updating archetype fingerprints
 * Only processes data from users who have consented to analytics
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has analytics consent
    const { data: consent } = await supabase
      .from('consent_ledger')
      .select('*')
      .eq('user_id', user.id)
      .eq('consent_type', 'analytics')
      .eq('granted', true)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!consent) {
      return NextResponse.json(
        { error: 'Analytics consent required' },
        { status: 403 }
      )
    }

    // Get user's radar profile (vector data only)
    const { data: radarProfile } = await supabase
      .from('user_radar_profiles')
      .select('vector_embedding, self_transcendence, self_enhancement, rooting, searching, relational, erotic, consent_dim')
      .eq('user_id', user.id)
      .single()

    if (!radarProfile || !radarProfile.vector_embedding) {
      return NextResponse.json(
        { error: 'Radar profile not found or missing vector' },
        { status: 404 }
      )
    }

    // TODO: Implement archetype clustering algorithm
    // This would:
    // 1. Find similar vectors using cosine similarity
    // 2. Cluster into archetypes
    // 3. Update archetype_fingerprints table with centroids
    // 4. Use for improving prompts and scoring

    // For now, return success (stubbed)
    return NextResponse.json({
      success: true,
      message: 'Analytics processing queued',
    })
  } catch (error) {
    console.error('Error in analytics:', error)
    return NextResponse.json(
      { error: 'Failed to process analytics' },
      { status: 500 }
    )
  }
}




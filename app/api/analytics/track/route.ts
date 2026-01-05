import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const body = await request.json()
    
    // Validate event type
    const validEventTypes = [
      'requester_started',
      'requester_consent_granted',
      'requester_completed',
      'requester_abandoned',
      'radar_viewed',
      'share_clicked',
      'dashboard_visited',
      'onboarding_started',
      'onboarding_completed',
      'onboarding_abandoned',
      'compatibility_feedback',
    ]
    
    if (!body.event_type || !validEventTypes.includes(body.event_type)) {
      return NextResponse.json(
        { error: 'Invalid event_type' },
        { status: 400 }
      )
    }
    
    // Insert analytics event
    // Use service role key to bypass RLS (analytics events can come from anonymous requesters)
    let analyticsClient = supabase
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js')
      analyticsClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    }
    
    const { error: eventError } = await analyticsClient.from('analytics_events').insert({
      user_id: user?.id || null,
      event_type: body.event_type,
      event_data: body.event_data || {},
    })
    
    if (eventError) {
      console.error('Error inserting analytics event:', eventError)
      console.error('Event data:', { event_type: body.event_type, event_data: body.event_data })
      // Don't fail the request if analytics tracking fails - log and continue
      // This allows the main flow to continue even if analytics has issues
      console.warn('Analytics tracking failed, but continuing with request')
    }
    
    // Handle requester session tracking for specific events
    // Use service role key to bypass RLS (requester sessions are anonymous)
    if (body.event_type === 'requester_started' && body.event_data?.session_token && body.event_data?.link_id) {
      let sessionClient = supabase
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = await import('@supabase/supabase-js')
        sessionClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      }
      
      const { error: sessionError } = await sessionClient.from('requester_sessions').insert({
        link_id: body.event_data.link_id,
        requester_id: user?.id || null,
        session_token: body.event_data.session_token,
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      
      if (sessionError) {
        console.error('Error creating requester session:', sessionError)
        // Don't fail the request, just log the error
      }
      
      // Also store requester_assessment_events (for analytics)
      // Note: This is optional and won't fail if table doesn't exist yet
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const { error: eventError } = await supabaseAdmin
            .from('requester_assessment_events')
            .insert({
              link_id: body.event_data.link_id,
              requester_session_id: body.event_data.session_token,
              status: 'started',
              analytics_opt_in: body.event_data.analytics_opt_in || false,
            })
          if (eventError) {
            // Check if it's a "table doesn't exist" error - that's OK, migration not run yet
            if (eventError.message?.includes('does not exist') || eventError.code === '42P01') {
              console.warn('requester_assessment_events table does not exist yet (migration not run). Using requester_sessions only.')
            } else {
              console.error('Error storing requester assessment event:', eventError)
            }
          }
        } catch (error) {
          // Table might not exist yet - that's OK
          if (error instanceof Error && (error.message.includes('does not exist') || error.message.includes('relation'))) {
            console.warn('requester_assessment_events table does not exist yet (migration not run). Using requester_sessions only.')
          } else {
            console.error('Error storing requester assessment event:', error)
          }
        }
      }
    } else if (body.event_type === 'requester_consent_granted' && body.event_data?.session_token) {
      // Update session with consent timestamp
      // Use service role key to bypass RLS (requester sessions are anonymous)
      let sessionClient = supabase
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = await import('@supabase/supabase-js')
        sessionClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      }
      
      const { error: updateError } = await sessionClient
        .from('requester_sessions')
        .update({ consent_granted_at: new Date().toISOString() })
        .eq('session_token', body.event_data.session_token)
      
      if (updateError) {
        console.error('Error updating requester session:', updateError)
      }
    } else if (body.event_type === 'requester_completed' && body.event_data?.session_token) {
      // Update session with completion
      // Note: This might fail if session doesn't exist, but that's OK - we also track via requester_assessments
      // Use service role key to bypass RLS (requester sessions are anonymous)
      let sessionClient = supabase
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = await import('@supabase/supabase-js')
        sessionClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      }
      
      const { error: updateError } = await sessionClient
        .from('requester_sessions')
        .update({
          completed_at: new Date().toISOString(),
          completion_time_ms: body.event_data.completion_time_ms || null,
        })
        .eq('session_token', body.event_data.session_token)
      
      if (updateError) {
        // Log but don't fail - requester_assessments table is the source of truth for completed flows
        console.warn('Error updating requester session (non-critical):', updateError)
        console.log('Note: Completed assessments are tracked via requester_assessments table')
      } else {
        console.log('Successfully updated requester session completion')
      }
      
      // Also store requester_assessment_events completion (for analytics)
      // Note: This is optional and won't fail if table doesn't exist yet
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const { error: eventError } = await supabaseAdmin
            .from('requester_assessment_events')
            .insert({
              link_id: body.event_data.link_id,
              requester_session_id: body.event_data.session_token,
              status: 'completed',
              analytics_opt_in: body.event_data.analytics_opt_in || false,
            })
          if (eventError) {
            // Check if it's a "table doesn't exist" error - that's OK, migration not run yet
            if (eventError.message?.includes('does not exist') || eventError.code === '42P01') {
              console.warn('requester_assessment_events table does not exist yet (migration not run). Using requester_sessions only.')
            } else {
              console.error('Error storing requester assessment completion event:', eventError)
            }
          }
        } catch (error) {
          // Table might not exist yet - that's OK
          if (error instanceof Error && (error.message.includes('does not exist') || error.message.includes('relation'))) {
            console.warn('requester_assessment_events table does not exist yet (migration not run). Using requester_sessions only.')
          } else {
            console.error('Error storing requester assessment completion event:', error)
          }
        }
      }
    }
    
    // Handle share action tracking
    if (body.event_type === 'share_clicked' && body.event_data?.share_method) {
      if (user?.id) {
        // Get user's link_id
        const { data: userLink } = await supabase
          .from('user_links')
          .select('link_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (userLink) {
          const { error: shareError } = await supabase.from('share_actions').insert({
            user_id: user.id,
            link_id: userLink.link_id,
            share_method: body.event_data.share_method,
          })
          
          if (shareError) {
            console.error('Error tracking share action:', shareError)
          }
        }
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    
    // Extract detailed error information
    let errorMessage = 'Failed to track event'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error stack:', error.stack)
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      errorMessage = (error as any).message || (error as any).error || JSON.stringify(error)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to track event',
        details: errorMessage,
        ...(process.env.NODE_ENV !== 'production' && error instanceof Error && error.stack ? { stack: error.stack } : {}),
      },
      { status: 500 }
    )
  }
}


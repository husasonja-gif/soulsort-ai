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
    const { error: eventError } = await supabase.from('analytics_events').insert({
      user_id: user?.id || null,
      event_type: body.event_type,
      event_data: body.event_data || {},
    })
    
    if (eventError) {
      console.error('Error inserting analytics event:', eventError)
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      )
    }
    
    // Handle requester session tracking for specific events
    if (body.event_type === 'requester_started' && body.event_data?.session_token && body.event_data?.link_id) {
      const { error: sessionError } = await supabase.from('requester_sessions').insert({
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
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
          console.error('Error storing requester assessment event:', eventError)
        }
      }
    } else if (body.event_type === 'requester_consent_granted' && body.event_data?.session_token) {
      // Update session with consent timestamp
      const { error: updateError } = await supabase
        .from('requester_sessions')
        .update({ consent_granted_at: new Date().toISOString() })
        .eq('session_token', body.event_data.session_token)
      
      if (updateError) {
        console.error('Error updating requester session:', updateError)
      }
    } else if (body.event_type === 'requester_completed' && body.event_data?.session_token) {
      // Update session with completion
      const { error: updateError } = await supabase
        .from('requester_sessions')
        .update({
          completed_at: new Date().toISOString(),
          completion_time_ms: body.event_data.completion_time_ms || null,
        })
        .eq('session_token', body.event_data.session_token)
      
      if (updateError) {
        console.error('Error updating requester session:', updateError)
      }
      
      // Also store requester_assessment_events completion (for analytics)
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
          console.error('Error storing requester assessment completion event:', eventError)
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
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}


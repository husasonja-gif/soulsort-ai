import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, consent_granted, auth_user_id } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      )
    }

    if (!consent_granted) {
      return NextResponse.json(
        { error: 'Consent required' },
        { status: 400 }
      )
    }

    // Use service role for participant creation
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing. Please set it in your .env.local file.' },
        { status: 500 }
      )
    }

    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not set')
      return NextResponse.json(
        { error: 'Server configuration error: NEXT_PUBLIC_SUPABASE_URL is missing. Please set it in your .env.local file.' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    // Check if participant already exists (by email or auth_user_id)
    // Build query conditionally to avoid empty OR clause
    let query = supabaseAdmin
      .from('bmnl_participants')
      .select('id, auth_user_id, status')
    
    if (auth_user_id) {
      query = query.or(`email.eq.${email.toLowerCase()},auth_user_id.eq.${auth_user_id}`)
    } else {
      query = query.eq('email', email.toLowerCase())
    }
    
    const { data: existing } = await query.maybeSingle()

    let participantId: string
    let currentAuthUserId: string | null = auth_user_id || null

    if (existing) {
      participantId = existing.id
      // Update auth_user_id if we have one and participant doesn't
      if (auth_user_id && !existing.auth_user_id) {
        const { error: updateError } = await supabaseAdmin
          .from('bmnl_participants')
          .update({ auth_user_id })
          .eq('id', participantId)
        
        if (updateError) {
          console.error('Error updating participant with auth user ID:', updateError)
        } else {
          currentAuthUserId = auth_user_id
        }
      } else {
        currentAuthUserId = existing.auth_user_id
      }
    } else {
      // Create new participant with auto-delete date (6 months from now)
      const autoDeleteDate = new Date()
      autoDeleteDate.setMonth(autoDeleteDate.getMonth() + 6)

      const { data: newParticipant, error: createError } = await supabaseAdmin
        .from('bmnl_participants')
        .insert({
          email: email.toLowerCase(),
          auth_user_id: auth_user_id || null,
          consent_granted_at: new Date().toISOString(),
          status: 'pending',
          auto_delete_at: autoDeleteDate.toISOString(),
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating participant:', createError)
        
        // Check if it's a unique constraint violation (email already exists)
        if (createError.code === '23505' || createError.message?.includes('duplicate') || createError.message?.includes('unique')) {
          // Email already exists - try to get the existing participant
          const { data: existingByEmail } = await supabaseAdmin
            .from('bmnl_participants')
            .select('id, auth_user_id, status')
            .eq('email', email.toLowerCase())
            .maybeSingle()
          
          if (existingByEmail) {
            participantId = existingByEmail.id
            // Update auth_user_id if we have one and participant doesn't
            if (auth_user_id && !existingByEmail.auth_user_id) {
              await supabaseAdmin
                .from('bmnl_participants')
                .update({ auth_user_id })
                .eq('id', participantId)
            }
            // Continue with existing participant
          } else {
            return NextResponse.json(
              { error: 'Participant with this email already exists, but could not be retrieved', details: createError.message },
              { status: 500 }
            )
          }
        } else if (createError.code === '42P01' || createError.message?.includes('does not exist') || createError.message?.includes('relation') && createError.message?.includes('does not exist')) {
          // Check if table doesn't exist
          return NextResponse.json(
            { 
              error: 'Database table not found. Please run the migration: supabase/migrations/021_bmnl_schema.sql',
              details: createError.message,
              code: createError.code,
              hint: 'Run this SQL in your Supabase SQL Editor: supabase/migrations/021_bmnl_schema.sql'
            },
            { status: 500 }
          )
        } else {
          return NextResponse.json(
            { error: 'Failed to create participant', details: createError.message, code: createError.code },
            { status: 500 }
          )
        }
      } else if (newParticipant) {
        participantId = newParticipant.id
      }

      if (!newParticipant && !participantId) {
        return NextResponse.json(
          { error: 'Failed to create participant: no data returned' },
          { status: 500 }
        )
      }
    }

    // Log consent (always, regardless of auth status)
    const { error: consentError } = await supabaseAdmin
      .from('bmnl_consent_log')
      .insert({
        participant_id: participantId,
        consent_type: 'assessment',
        granted: true,
        consent_text: 'Cultural onboarding assessment consent',
      })

    if (consentError) {
      console.error('Error logging consent:', consentError)
      // Don't fail the request if consent logging fails
    }

    return NextResponse.json({
      success: true,
      participant_id: participantId,
    })
  } catch (error) {
    console.error('Error in BMNL start:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to start assessment', details: errorMessage },
      { status: 500 }
    )
  }
}


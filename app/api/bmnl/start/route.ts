import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, consent_granted } = body

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
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // Check if participant already exists
    const { data: existing } = await supabaseAdmin
      .from('bmnl_participants')
      .select('id, auth_user_id, status')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    let participantId: string
    let authUserId: string | null = null

    if (existing) {
      participantId = existing.id
      authUserId = existing.auth_user_id
    } else {
      // Create new participant
      const { data: newParticipant, error: createError } = await supabaseAdmin
        .from('bmnl_participants')
        .insert({
          email: email.toLowerCase(),
          consent_granted_at: new Date().toISOString(),
          status: 'pending',
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating participant:', createError)
        return NextResponse.json(
          { error: 'Failed to create participant' },
          { status: 500 }
        )
      }

      participantId = newParticipant.id
    }

    // Create or get auth user (magic link)
    if (!authUserId) {
      // Send magic link
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email.toLowerCase(),
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bmnl/assessment`,
        },
      })

      if (authError || !authData) {
        console.error('Error generating magic link:', authError)
        // Continue anyway - we'll use token-based auth
      } else {
        authUserId = authData.user.id

        // Update participant with auth user ID
        await supabaseAdmin
          .from('bmnl_participants')
          .update({ auth_user_id: authUserId })
          .eq('id', participantId)

        // Log consent
        await supabaseAdmin
          .from('bmnl_consent_log')
          .insert({
            participant_id: participantId,
            consent_type: 'assessment',
            granted: true,
            consent_text: 'Cultural onboarding assessment consent',
          })
      }
    }

    // Generate temporary token for assessment (if magic link fails)
    const token = Buffer.from(`${participantId}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      token,
      participant_id: participantId,
    })
  } catch (error) {
    console.error('Error in BMNL start:', error)
    return NextResponse.json(
      { error: 'Failed to start assessment' },
      { status: 500 }
    )
  }
}


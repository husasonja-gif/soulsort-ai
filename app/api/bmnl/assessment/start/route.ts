import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { participant_id } = body

    if (!participant_id) {
      return NextResponse.json(
        { error: 'Participant ID required' },
        { status: 400 }
      )
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing' },
        { status: 500 }
      )
    }

    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not set')
      return NextResponse.json(
        { error: 'Server configuration error: NEXT_PUBLIC_SUPABASE_URL is missing' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    // Update participant status to in_progress
    const { error: updateError } = await supabaseAdmin
      .from('bmnl_participants')
      .update({
        status: 'in_progress',
        assessment_started_at: new Date().toISOString(),
      })
      .eq('id', participant_id)

    if (updateError) {
      console.error('Error starting assessment:', updateError)
      return NextResponse.json(
        { error: 'Failed to start assessment', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in assessment start:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to start assessment', details: errorMessage },
      { status: 500 }
    )
  }
}



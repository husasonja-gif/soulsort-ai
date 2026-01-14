import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participant_id')

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID required' },
        { status: 400 }
      )
    }

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

    // Mark for manual deletion (GDPR: process within 30 days)
    const { error: updateError } = await supabaseAdmin
      .from('bmnl_participants')
      .update({
        status: 'deleted',
        manually_deleted_at: new Date().toISOString(),
      })
      .eq('id', participantId)

    if (updateError) {
      console.error('Error requesting deletion:', updateError)
      return NextResponse.json(
        { error: 'Failed to request deletion', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Deletion request submitted' })
  } catch (error) {
    console.error('Error in delete request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to request deletion', details: errorMessage },
      { status: 500 }
    )
  }
}


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

    // Delete all related data (cascade deletes should handle most, but we'll be explicit)
    // Delete in order to respect foreign key constraints
    
    // Delete flags
    await supabaseAdmin
      .from('bmnl_flags')
      .delete()
      .eq('participant_id', participantId)

    // Delete signals
    await supabaseAdmin
      .from('bmnl_signals')
      .delete()
      .eq('participant_id', participantId)

    // Delete radar profiles
    await supabaseAdmin
      .from('bmnl_radar_profiles')
      .delete()
      .eq('participant_id', participantId)

    // Delete consent log
    await supabaseAdmin
      .from('bmnl_consent_log')
      .delete()
      .eq('participant_id', participantId)

    // Delete answers
    await supabaseAdmin
      .from('bmnl_answers')
      .delete()
      .eq('participant_id', participantId)

    // Finally, delete participant
    const { error: deleteError } = await supabaseAdmin
      .from('bmnl_participants')
      .delete()
      .eq('id', participantId)

    if (deleteError) {
      console.error('Error deleting participant:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete data', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'All data has been permanently deleted' })
  } catch (error) {
    console.error('Error in delete request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to request deletion', details: errorMessage },
      { status: 500 }
    )
  }
}



import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: participantId } = await params
    
    // Check if user is organizer
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: organizer } = await supabase
      .from('bmnl_organizers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!organizer) {
      return NextResponse.json(
        { error: 'Not authorized as organizer' },
        { status: 403 }
      )
    }

    // Use service role for full access
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Get flags for this specific participant with question numbers
    const { data: flags, error: flagsError } = await supabaseAdmin
      .from('bmnl_flags')
      .select('id, flag_type, flag_reason, question_number, severity, created_at, reviewed_at')
      .eq('participant_id', participantId)
      .order('question_number', { ascending: true })
      .order('created_at', { ascending: true })

    if (flagsError) {
      console.error('Error fetching flags:', flagsError)
      return NextResponse.json(
        { error: 'Failed to fetch flags', details: flagsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      flags: flags || [],
    })
  } catch (error) {
    console.error('Error in participant flags API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to load flags', details: errorMessage },
      { status: 500 }
    )
  }
}



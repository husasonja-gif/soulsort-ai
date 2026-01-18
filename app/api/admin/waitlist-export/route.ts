import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmailsStr = process.env.ADMIN_EMAILS || ''
  const adminEmails = adminEmailsStr
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0)
  return adminEmails.includes(email.toLowerCase().trim())
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Use service role to read waitlist
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

    const { data: waitlist, error } = await supabaseAdmin
      .from('waitlist')
      .select('email, created_at, source')
      .eq('subscribed', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching waitlist:', error)
      return NextResponse.json(
        { error: 'Failed to fetch waitlist' },
        { status: 500 }
      )
    }

    // Return as CSV format (emails only, comma-separated for Gmail BCC)
    const emails = waitlist?.map(w => w.email).join(', ') || ''
    
    return NextResponse.json({
      count: waitlist?.length || 0,
      emails: emails,
      csv: waitlist?.map(w => w.email).join(',\n') || '',
    })
  } catch (error) {
    console.error('Error in waitlist export:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





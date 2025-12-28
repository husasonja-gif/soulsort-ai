import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { getUserRadarProfile, getUserConsents, getUserLink } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      redirect('/login')
    }

    // Check if onboarding is needed
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      redirect('/onboarding')
    }

    if (!profile?.onboarding_completed) {
      redirect('/onboarding')
    }

    const radarProfile = await getUserRadarProfile(user.id)
    const consents = await getUserConsents(user.id)
    
    let userLink
    let shareLink = ''
    try {
      userLink = await getUserLink(user.id)
      // Use environment variable or default to production domain
      shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://soulsortai.com'}/r/${userLink.link_id}`
    } catch (error) {
      console.error('Error getting user link:', error)
      // Continue without share link if there's an error
    }

    return (
      <DashboardClient
        radarProfile={radarProfile}
        consents={consents}
        shareLink={shareLink}
      />
    )
  } catch (error) {
    console.error('Error in DashboardPage:', error)
    // Redirect to login on any error
    redirect('/login')
  }
}

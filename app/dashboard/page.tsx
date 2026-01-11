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
      .select('id, onboarding_completed, email')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      console.error('User ID:', user.id, 'Email:', user.email)
      // Don't redirect if profile doesn't exist - might be a new user
      // Instead, check if profile exists at all
      if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows')) {
        console.log('User profile not found, redirecting to onboarding')
        redirect('/onboarding')
      } else {
        // Other error - log and redirect to onboarding as safe fallback
        redirect('/onboarding')
      }
    }

    if (!profile) {
      console.log('No profile found for user:', user.id, 'redirecting to onboarding')
      redirect('/onboarding')
    }

    if (!profile.onboarding_completed) {
      console.log('User has not completed onboarding, redirecting')
      redirect('/onboarding')
    }
    
    console.log('User authenticated and onboarded:', user.email, 'Profile ID:', profile.id)

    // Track dashboard visit
    try {
      await supabase.rpc('track_dashboard_visit', {
        user_id: user.id,
      })
    } catch (err) {
      console.error('Error tracking dashboard visit:', err)
    }

    const radarProfile = await getUserRadarProfile(user.id)
    const consents = await getUserConsents(user.id)
    
    let userLink
    let shareLink = ''
    try {
      userLink = await getUserLink(user.id)
      shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/r/${userLink.link_id}`
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

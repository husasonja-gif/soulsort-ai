import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { skipChat?: string }
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const skipChat = searchParams?.skipChat === 'true'

  return <OnboardingClient userId={user.id} skipChat={skipChat} />
}




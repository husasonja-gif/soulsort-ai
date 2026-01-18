'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

/**
 * BMNL-specific auth callback
 * This route is used when users click magic links from BMNL login
 * It doesn't rely on query parameters which Supabase may strip
 */
function BMNLAuthCallbackContent() {
  const router = useRouter()

  useEffect(() => {
    const handleBMNLAuthCallback = async () => {
      try {
        console.log('=== BMNL AUTH CALLBACK START ===')
        console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')
        
        // Check for hash fragments (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        // Check for code in query params (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')

        console.log('Auth params:', { code: code ? 'present' : 'missing', accessToken: accessToken ? 'present' : 'missing' })

        const redirectAfterAuth = async () => {
          // Wait for session to be set
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Verify session exists
          let session = null
          let retries = 3
          while (retries > 0 && !session) {
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            if (currentSession) {
              session = currentSession
              break
            }
            await new Promise(resolve => setTimeout(resolve, 500))
            retries--
          }
          
          if (!session) {
            console.error('No session found after auth')
            router.push('/bmnl/login?error=no_session')
            return
          }
          
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError || !user) {
            console.error('Error getting user:', userError)
            router.push('/bmnl/login?error=auth_failed')
            return
          }

          console.log('User authenticated:', user.email)

          // Check if user has a BMNL participant record
          const { data: participant, error: participantError } = await supabase
            .from('bmnl_participants')
            .select('id, status')
            .eq('auth_user_id', user.id)
            .maybeSingle()
          
          console.log('BMNL participant check:', { participant, participantError })
          
          if (participant) {
            // User has BMNL participant - route based on status
            if (participant.status === 'completed') {
              console.log('BMNL participant - completed, redirecting to dashboard')
              router.push('/bmnl/dashboard')
              return
            } else {
              // Assessment in progress - go to assessment
              console.log('BMNL participant - in progress, redirecting to assessment')
              router.push(`/bmnl/assessment?participant_id=${participant.id}`)
              return
            }
          } else {
            // No participant record yet - go to start page to create one
            console.log('BMNL callback - no participant yet, redirecting to start')
            router.push('/bmnl/start')
            return
          }
        }

        if (code) {
          // PKCE flow - exchange code for session
          console.log('Processing PKCE flow for BMNL')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Auth callback error:', exchangeError)
            // Don't fail on PKCE code verifier errors - they're often false positives
            // Check if we still got a session despite the error
            if (exchangeError.message.includes('PKCE code verifier') || exchangeError.message.includes('code verifier')) {
              // PKCE error - check if session exists anyway
              const { data: { session: checkSession } } = await supabase.auth.getSession()
              if (checkSession) {
                console.log('PKCE error but session exists, continuing...')
                // Clear the code from URL and continue
                const url = new URL(window.location.href)
                url.searchParams.delete('code')
                window.history.replaceState({}, '', url.toString())
                await redirectAfterAuth()
                return
              } else {
                console.error('PKCE error and no session - this might be a real issue')
                // Still try to continue - sometimes the session is set asynchronously
              }
            } else {
              // Non-PKCE error - more serious
              console.error('Non-PKCE auth error:', exchangeError)
              // Still check if session exists
              const { data: { session: checkSession } } = await supabase.auth.getSession()
              if (!checkSession) {
                router.push('/bmnl/login?error=auth_failed')
                return
              }
            }
          }

          // Verify session exists (either from exchange or from getSession)
          const { data: { session: finalSession } } = await supabase.auth.getSession()
          if (!finalSession && !data?.session) {
            console.error('No session found after PKCE exchange')
            router.push('/bmnl/login?error=no_session')
            return
          }
          
          // Clear the code from URL
          const url = new URL(window.location.href)
          url.searchParams.delete('code')
          window.history.replaceState({}, '', url.toString())

          await redirectAfterAuth()
        } else if (accessToken && refreshToken) {
          // Implicit flow - set session directly
          console.log('Processing implicit flow for BMNL')
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError || !data.session) {
            console.error('Auth callback error:', sessionError)
            router.push('/bmnl/login?error=auth_failed')
            return
          }

          // Clear hash from URL
          window.history.replaceState({}, '', window.location.pathname)

          await redirectAfterAuth()
        } else {
          // No auth params found
          console.error('No auth params found in BMNL callback URL')
          router.push('/bmnl/login?error=no_code')
        }
      } catch (err) {
        console.error('Unexpected error in BMNL auth callback:', err)
        router.push('/bmnl/login?error=unexpected_error')
      }
    }

    handleBMNLAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing BMNL sign in...</p>
      </div>
    </div>
  )
}

export default function BMNLAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BMNLAuthCallbackContent />
    </Suspense>
  )
}


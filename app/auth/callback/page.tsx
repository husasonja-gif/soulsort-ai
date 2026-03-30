'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * Auth Callback Handler
 * 
 * ARCHITECTURE NOTE: Multi-Context User Support
 * ==============================================
 * The same email/auth_user_id can have MULTIPLE independent contexts:
 * 1. Regular SoulSort app (user_profiles) - dating context radar
 * 2. Event-specific participants (bmnl_participants, future events) - event-specific radars
 * 
 * Routing is determined by the redirect parameter, NOT by existing records.
 * This allows users to:
 * - Access regular app AND participate in events independently
 * - Participate in multiple events (BMNL, future festivals, etc.)
 * - Each context has its own assessment, radar, and dashboard
 * 
 * The redirect parameter is the SOURCE OF TRUTH for routing.
 */
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // IMPORTANT: Check sessionStorage FIRST before Supabase processes the callback
        // This ensures we capture the redirect intent even if Supabase strips it from URL
        const storedRedirect = typeof window !== 'undefined' ? sessionStorage.getItem('redirect') : null
        const storedBmnlContext = typeof window !== 'undefined' ? sessionStorage.getItem('bmnl_login') : null
        
        console.log('=== AUTH CALLBACK START ===')
        console.log('Stored redirect:', storedRedirect)
        console.log('Stored BMNL context:', storedBmnlContext)
        
        // Check for hash fragments (implicit flow) - these are client-side only
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        // Check for code in query params (PKCE flow)
        const code = searchParams.get('code')
        const tokenHash = searchParams.get('token_hash')
        const otpTypeParam = searchParams.get('type')

        console.log('Auth callback - code:', code ? 'present' : 'missing')
        console.log('Auth callback - token_hash:', tokenHash ? 'present' : 'missing')
        console.log('Auth callback - hash tokens:', accessToken ? 'present' : 'missing')
        console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')

        const redirectAfterAuth = async (seedSession?: unknown) => {
          const hasSeedSession = Boolean(seedSession)

          // Wait a bit for session to be set and cookies to be written.
          // Real users can be slower than local dev, so we must be patient here.
          await new Promise(resolve => setTimeout(resolve, hasSeedSession ? 350 : 900))

          // Verify user exists with retry (more reliable than checking getSession first).
          let user: any = null
          let retries = hasSeedSession ? 8 : 12
          while (retries > 0 && !user) {
            const { data: userData, error: userError } = await supabase.auth.getUser()

            if (userError) {
              // Ignore PKCE verifier noise; still keep retrying.
              const msg = userError.message || ''
              if (
                msg.includes('PKCE code verifier') ||
                msg.includes('code verifier')
              ) {
                // continue retry loop
              } else {
                console.error('Error getting user:', userError)
                setError(userError.message)
                return
              }
            }

            if (userData?.user) {
              user = userData.user
              break
            }

            await new Promise(resolve => setTimeout(resolve, hasSeedSession ? 250 : 500))
            retries--
          }

          if (!user) {
            console.error('No user found after auth (after retries)')
            // IMPORTANT: do NOT redirect back to /login here.
            // Redirects cause the “loop back to email input” symptom.
            setError('Almost there—finishing sign-in. If this persists, please try again.')
            return
          }

          console.log('User authenticated:', user.email)

          // CRITICAL: Redirect parameter is the source of truth for routing
          // Same user can have both regular app profile AND event participants
          // Check multiple sources with PRIORITY: sessionStorage (most reliable) > URL params > hash params
          const redirectFromStorage = typeof window !== 'undefined' 
            ? sessionStorage.getItem('redirect')
            : null
          const redirectFromParams = searchParams.get('redirect')
          const redirectFromHash = typeof window !== 'undefined' 
            ? new URLSearchParams(window.location.hash.substring(1)).get('redirect')
            : null
          
          // Priority: sessionStorage first (most reliable), then URL params, then hash
          const redirect = redirectFromStorage || redirectFromParams || redirectFromHash
          
          // Also check for BMNL context in sessionStorage as fallback
          const bmnlContext = typeof window !== 'undefined' ? sessionStorage.getItem('bmnl_login') : null
          
          console.log('=== REDIRECT CHECK ===')
          console.log('Redirect sources:', { 
            storage: redirectFromStorage, 
            params: redirectFromParams, 
            hash: redirectFromHash,
            final: redirect 
          })
          console.log('BMNL context from storage:', bmnlContext)
          console.log('Full URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')
          console.log('Search params:', typeof window !== 'undefined' ? window.location.search : 'N/A')
          console.log('Hash:', typeof window !== 'undefined' ? window.location.hash : 'N/A')
          
          // ============================================================================
          // EVENT-SPECIFIC ROUTING (BMNL, future events, etc.)
          // ============================================================================
          // If redirect is set to an event path, route to that event context
          // This allows same user to access multiple events independently
          if (redirect && redirect.startsWith('/bmnl')) {
            console.log('=== BMNL EVENT ROUTING ===')
            console.log('BMNL event redirect detected:', redirect)
            
            try {
              // Check if user has a BMNL participant record for this event
              const { data: participant, error: participantError } = await supabase
                .from('bmnl_participants')
                .select('id, status')
                .eq('auth_user_id', user.id)
                .maybeSingle()
              
              console.log('BMNL participant check:', { participant, participantError })
              
              if (participantError) {
                console.error('Error checking BMNL participant:', participantError)
                // Continue anyway - might be a new participant
              }
              
              if (participant) {
                // User has BMNL participant - route based on status
                if (participant.status === 'completed') {
                  console.log('BMNL participant - completed, redirecting to dashboard')
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('redirect')
                    sessionStorage.removeItem('bmnl_login')
                  }
                  window.location.href = '/bmnl/dashboard'
                  return
                } else {
                  // Assessment in progress - go to assessment
                  console.log('BMNL participant - in progress, redirecting to assessment')
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('redirect')
                    sessionStorage.removeItem('bmnl_login')
                  }
                  window.location.href = `/bmnl/assessment?participant_id=${participant.id}`
                  return
                }
              } else {
                // No participant record yet - go to start page to create one
                console.log('BMNL redirect - no participant yet, redirecting to start')
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('redirect')
                  sessionStorage.removeItem('bmnl_login')
                }
                window.location.href = '/bmnl/start'
                return
              }
            } catch (error) {
              console.error('Error in BMNL routing:', error)
              // Fallback: redirect to start page
              console.log('Error in BMNL routing, falling back to /bmnl/start')
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('redirect')
                sessionStorage.removeItem('bmnl_login')
              }
              window.location.href = '/bmnl/start'
              return
            }
          }
          
          // Fallback: If no redirect but sessionStorage has BMNL context
          if (!redirect && bmnlContext === 'true') {
            console.log('=== BMNL FALLBACK: No redirect param but BMNL context found ===')
            console.log('Redirecting to /bmnl/start based on sessionStorage context')
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('bmnl_login')
              sessionStorage.removeItem('redirect')
            }
            window.location.href = '/bmnl/start'
            return
          }
          
          // If we still don't have a redirect, log warning
          if (!redirect) {
            console.warn('=== WARNING: No redirect parameter found anywhere ===')
            console.warn('This might be a regular app login or redirect was lost')
          }

          // ============================================================================
          // REGULAR APP ROUTING (SoulSort dating context)
          // ============================================================================
          // Only route to regular app if NOT an event redirect
          // Same user can have both regular app profile AND event participants
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .maybeSingle()

          if (profileError) {
            console.error('Error fetching profile:', profileError)
          }

          if (!profile || !profile.onboarding_completed) {
            console.log('Redirecting to onboarding')
            // Check if skipChat was in the original URL (from login page or stored in sessionStorage)
            const skipChat = searchParams.get('skipChat') || 
              (typeof window !== 'undefined' && (window.location.search.includes('skipChat=true') || sessionStorage.getItem('skipChat') === 'true'))
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('skipChat') // Clear after use
            }
            window.location.href = skipChat ? '/onboarding?skipChat=true' : '/onboarding'
          } else {
            console.log('Redirecting after auth')
            // Check for redirect parameter
            if (typeof window !== 'undefined' && redirect) {
              sessionStorage.removeItem('redirect') // Clear after use
            }
            window.location.href = redirect || '/dashboard'
          }
        }

        if (code) {
          // PKCE flow - exchange code for session
          console.log('Processing PKCE flow')
          console.log('Checking for code verifier cookie...')
          
          // Check if code verifier cookie exists
          const codeVerifierCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('sb-') && row.includes('code-verifier'))
          console.log('Code verifier cookie:', codeVerifierCookie ? 'found' : 'not found')
          console.log('All cookies:', document.cookie)
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Auth callback error:', exchangeError)
            // Don't show PKCE code verifier errors - they're often false positives
            if (!exchangeError.message.includes('PKCE code verifier') && !exchangeError.message.includes('code verifier')) {
              setError(exchangeError.message)
              setTimeout(() => {
                window.location.href = `/login?error=${encodeURIComponent(exchangeError.message)}`
              }, 2000)
              return
            }
            // For PKCE errors, check if we still got a session
            if (!data?.session) {
              console.error('PKCE error and no session - redirecting to login')
              setError('Authentication failed. Please try again.')
              setTimeout(() => {
                window.location.href = '/login?error=auth_failed'
              }, 2000)
              return
            }
            // For PKCE errors but we have a session, continue
            console.log('PKCE error detected but session exists, continuing...')
          }

          if (!data?.session) {
            console.error('No session returned from exchange')
            setError('No session returned')
            setTimeout(() => {
              window.location.href = '/login?error=no_session'
            }, 2000)
            return
          }
          
          // Verify session is actually valid before redirecting
          const { data: { user: verifyUser }, error: verifyError } = await supabase.auth.getUser()
          if (verifyError || !verifyUser) {
            console.error('Session verification failed:', verifyError)
            setError('Session verification failed')
            setTimeout(() => {
              window.location.href = '/login?error=session_verification_failed'
            }, 2000)
            return
          }

          console.log('Session set successfully')

          // Clear the code from URL
          const url = new URL(window.location.href)
          url.searchParams.delete('code')
          window.history.replaceState({}, '', url.toString())

          // Redirect based on onboarding status
          await redirectAfterAuth(data?.session)
        } else if (tokenHash && otpTypeParam) {
          // Token-hash OTP flow (Supabase magic links can use this format)
          console.log('Processing token_hash OTP flow')
          const otpType = otpTypeParam as EmailOtpType
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            type: otpType,
            token_hash: tokenHash,
          })

          if (verifyError) {
            console.error('Token-hash OTP verification error:', verifyError)
            setError(verifyError.message)
            setTimeout(() => {
              window.location.href = `/login?error=${encodeURIComponent(verifyError.message)}`
            }, 1200)
            return
          }

          if (!data?.session) {
            // Fallback: some flows may still set session asynchronously
            await redirectAfterAuth()
            return
          }

          await redirectAfterAuth(data.session)
        } else if (accessToken && refreshToken) {
          // Implicit flow - set session directly
          console.log('Processing implicit flow')
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Auth callback error:', sessionError)
            setError(sessionError.message)
            setTimeout(() => {
              window.location.href = `/login?error=${encodeURIComponent(sessionError.message)}`
            }, 1000)
            return
          }

          if (!data.session) {
            console.error('No session returned from setSession')
            setError('No session returned')
            setTimeout(() => {
              window.location.href = '/login?error=no_session'
            }, 1000)
            return
          }

          console.log('Session set successfully')

          // Clear hash from URL
          window.history.replaceState({}, '', window.location.pathname)

          // Redirect based on onboarding status
          await redirectAfterAuth(data.session)
        } else {
          // No explicit params: check for an already-established session before failing
          const { data: userData } = await supabase.auth.getUser()
          if (userData?.user) {
            console.log('No auth params but user session exists, continuing redirect')
            await redirectAfterAuth()
            return
          }

          console.error('No auth params found in URL')
          console.log('Full URL:', window.location.href)
          setError('No authentication parameters found')
          setTimeout(() => {
            window.location.href = '/login?error=no_code'
          }, 1000)
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setTimeout(() => {
          window.location.href = '/login?error=unexpected_error'
        }, 1000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
        {error ? (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}





'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for hash fragments (implicit flow) - these are client-side only
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        // Check for code in query params (PKCE flow)
        const code = searchParams.get('code')

        console.log('Auth callback - code:', code ? 'present' : 'missing')
        console.log('Auth callback - hash tokens:', accessToken ? 'present' : 'missing')

        const redirectAfterAuth = async () => {
          // Wait a bit for session to be set and cookies to be written
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Verify session exists
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            console.error('No session found after auth')
            // Don't show error immediately, try to redirect first
            router.push('/login?error=no_session')
            return
          }
          
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError) {
            console.error('Error getting user:', userError)
            // Only show error if it's a real error, not just PKCE code verifier warning
            if (!userError.message.includes('PKCE code verifier')) {
              setError(userError.message)
              setTimeout(() => {
                window.location.href = '/login?error=auth_failed'
              }, 1000)
            }
            return
          }

          if (!user) {
            console.error('No user found after auth')
            setError('No user found after authentication')
            setTimeout(() => {
              window.location.href = '/login?error=no_user'
            }, 1000)
            return
          }

          console.log('User authenticated:', user.email)

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
            const redirect = searchParams.get('redirect') || 
              (typeof window !== 'undefined' ? sessionStorage.getItem('redirect') : null)
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
            if (!exchangeError.message.includes('PKCE code verifier')) {
              setError(exchangeError.message)
              setTimeout(() => {
                window.location.href = `/login?error=${encodeURIComponent(exchangeError.message)}`
              }, 1000)
              return
            }
            // For PKCE errors, try to continue anyway - might still work
            console.log('PKCE error detected, attempting to continue...')
          }

          if (!data.session) {
            console.error('No session returned from exchange')
            setError('No session returned')
            setTimeout(() => {
              window.location.href = '/login?error=no_session'
            }, 1000)
            return
          }

          console.log('Session set successfully')

          // Clear the code from URL
          const url = new URL(window.location.href)
          url.searchParams.delete('code')
          window.history.replaceState({}, '', url.toString())

          // Redirect based on onboarding status
          await redirectAfterAuth()
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
          await redirectAfterAuth()
        } else {
          // No auth params found - redirect to login
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
        {/* Errors hidden during auth flow to avoid confusion */}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
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





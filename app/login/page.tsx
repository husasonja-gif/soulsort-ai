'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()

        const skipChat = searchParams.get('skipChat')
        // If they need onboarding and have skipChat, redirect to onboarding
        if ((!profile || !profile.onboarding_completed) && skipChat === 'true') {
          router.push('/onboarding?skipChat=true')
        } else if (!profile || !profile.onboarding_completed) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
      }
    }
    checkAuth()
  }, [router, searchParams])

  // Handle auth callback if tokens are in URL (fallback if Supabase redirects to /login)
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check for hash fragments (implicit flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      // Check for code in query params (PKCE flow)
      const code = searchParams.get('code')

      // Only process if we have auth params
      if (!code && !accessToken) {
        return
      }

      if (code) {
        // PKCE flow - redirect to callback page which handles this
        router.push(`/auth/callback?code=${code}`)
      } else if (accessToken && refreshToken) {
        // Implicit flow - set session directly
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!error) {
          // Clear hash from URL
          window.history.replaceState({}, '', window.location.pathname)

          // Check if onboarding is needed
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('onboarding_completed')
              .eq('id', user.id)
              .maybeSingle()

            if (!profile || !profile.onboarding_completed) {
              const skipChat = searchParams.get('skipChat')
              router.push(skipChat ? '/onboarding?skipChat=true' : '/onboarding')
            } else {
              router.push('/dashboard')
            }
          } else {
            router.push('/dashboard')
          }
        }
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const skipChat = searchParams.get('skipChat')
    // Store skipChat in sessionStorage for auth callback
    if (skipChat === 'true' && typeof window !== 'undefined') {
      sessionStorage.setItem('skipChat', 'true')
    }
    const redirectUrl = skipChat === 'true' 
      ? `${origin}/auth/callback?skipChat=true`
      : `${origin}/auth/callback`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: true,
      }
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the magic link ✨')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SoulSort AI
          </h1>
          <p className="text-gray-600">Sign in with a magic link</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending link…' : 'Send magic link'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center ${message.includes('error') || message.includes('Error') ? 'text-red-600' : 'text-gray-600'}`}>
            {message}
          </p>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="text-purple-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}

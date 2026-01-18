'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

function BMNLLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Don't auto-redirect - let users explicitly click login even if already authenticated
  // This allows users to start fresh assessments or access different contexts

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    // Use dedicated BMNL callback route - no query parameters needed
    const redirectUrl = `${origin}/auth/callback/bmnl`

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
    <div className="min-h-screen bg-white dark:bg-gray-50">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-md">
        <div className="bg-white dark:bg-white rounded-lg p-6 sm:p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-900">
              Where the Sheep Sleep
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-600 italic mb-4">
              Burning Man Netherlands
            </p>
            <p className="text-gray-700 dark:text-gray-700">
              Start onboarding by authenticating your email. Check your spam for the magic link.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-white dark:text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Sending link…' : 'Send magic link'}
            </button>
          </form>

          {message && (
            <div className="mt-4 text-center">
              <p className={`${message.includes('error') || message.includes('Error') ? 'text-red-600' : 'text-gray-600'}`}>
                {message}
              </p>
              {message.includes('Check your email') && (
                <p className="mt-2 text-sm text-gray-500">
                  If you can't find the link, check your spam folder.
                </p>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <Link href="/bmnl" className="text-purple-600 hover:underline">
              ← Back to landing page
            </Link>
          </div>
        </div>

        <footer className="text-center text-sm text-gray-600 dark:text-gray-600 mt-8">
          <p>
            Powered by{' '}
            <Link href="https://soulsortai.com" className="text-purple-600 dark:text-purple-600 hover:underline">
              SoulSort
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default function BMNLLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BMNLLoginContent />
    </Suspense>
  )
}


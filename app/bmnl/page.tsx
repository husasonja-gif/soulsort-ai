'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BMNLLandingPage() {
  const router = useRouter()
  const [consentGiven, setConsentGiven] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleStart = () => {
    if (!consentGiven) {
      alert('Please provide consent to continue')
      return
    }

    // Redirect to login page
    router.push('/bmnl/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">
            SoulSort Events Demo
          </h1>
          <p className="text-lg sm:text-xl text-purple-100 italic">
            Cultural Onboarding
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-xl border border-purple-300/20 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
            Cultural Onboarding
          </h2>

          <div className="space-y-6 text-purple-50/95">
            <section>
              <p className="mb-4">
                This is a cultural onboarding tool to help us understand how you relate to event principles and community expectations. It is designed to scale reflection and set expectations before the event.
              </p>
              <p className="mb-4">
                We use AI to help process responses at scale, but <strong className="font-semibold">humans make all final decisions</strong>. This is not an exclusion machine—it's a way to route people differently and ensure everyone has the information they need.
              </p>
            </section>

            <section>
              <p className="mb-4">
                We're processing a large volume of applications. AI helps us scale reflection and identify patterns, but it only <em>assists</em>—it doesn't decide. Every flagged response is reviewed by a human organizer.
              </p>
            </section>

            <section className="bg-white/10 p-4 sm:p-6 rounded-2xl border border-purple-300/20">
              <h3 className="text-lg font-semibold mb-3 text-white">
                Your data
              </h3>
              <ul className="space-y-2 text-sm text-purple-50/90">
                <li>Your answers are used only for event safety and cultural onboarding</li>
                <li>They are automatically deleted after 6 months (30 July 2026)</li>
                <li>You can request a human explanation at any time</li>
                <li>You can request deletion at any time</li>
                <li>Sensitive data (sexuality, gender identity, phobia-related responses) is marked and handled with extra care</li>
              </ul>
            </section>
          </div>
        </div>

        {/* Consent Form */}
        <div className="bg-white/10 backdrop-blur-xl border border-purple-300/20 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold mb-6 text-white">
            Get Started
          </h3>

          <div className="space-y-6">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="consent" className="ml-3 text-sm text-purple-50/95">
                <span className="font-semibold">I consent to this cultural onboarding assessment.</span>
                <br />
                <span className="text-xs text-purple-100/75">
                  I understand that my answers will be used for event safety and cultural onboarding, stored for 6 months, and reviewed by human organizers. I can request explanation or deletion at any time.
                </span>
              </label>
            </div>
            
            <button
              onClick={handleStart}
              disabled={!consentGiven || loading}
              className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-2xl transition-colors"
            >
              {loading ? 'Starting...' : 'Start Cultural Onboarding'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-purple-100/80">
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


'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BMNLLandingPage() {
  const router = useRouter()
  const [consentGiven, setConsentGiven] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    if (!consentGiven) {
      alert('Please provide consent to continue')
      return
    }

    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      // Create participant and send magic link
      const response = await fetch('/api/bmnl/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent_granted: true }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/bmnl/assessment?token=${data.token}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to start assessment')
      }
    } catch (error) {
      console.error('Error starting assessment:', error)
      alert('Failed to start assessment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-50">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-900">
            Where the Sheep Sleep
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-600 italic">
            Burning Man Netherlands
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-white rounded-lg p-6 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 dark:text-gray-900">
            Cultural Onboarding
          </h2>

          <div className="space-y-6 text-gray-700 dark:text-gray-700">
            <section>
              <p className="mb-4">
                This is a cultural onboarding tool to help us understand how you relate to Burning Man principles and community expectations. It's designed to scale reflection and set expectations before the event.
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

            <section className="bg-gray-50 dark:bg-gray-50 p-4 sm:p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-900">
                Your data
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-700">
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
        <div className="bg-white dark:bg-white rounded-lg p-6 sm:p-8 mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-900">
            Get Started
          </h3>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-white dark:text-gray-900"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="consent" className="ml-3 text-sm text-gray-700 dark:text-gray-700">
                <span className="font-semibold">I consent to this cultural onboarding assessment.</span>
                <br />
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  I understand that my answers will be used for event safety and cultural onboarding, stored for 6 months, and reviewed by human organizers. I can request explanation or deletion at any time.
                </span>
              </label>
            </div>

            <button
              onClick={handleStart}
              disabled={!consentGiven || !email || loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Starting...' : 'Start Cultural Onboarding'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-600 dark:text-gray-600">
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


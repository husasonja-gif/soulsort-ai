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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-orange-600 dark:text-orange-400">
            Where the Sheep Sleep
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 italic">
            Burning Man Netherlands
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Cultural Onboarding
          </h2>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                What this is
              </h3>
              <p className="mb-4">
                This is a cultural onboarding tool to help us understand how you relate to Burning Man principles and community expectations. It's designed to scale reflection and set expectations before the event.
              </p>
              <p className="mb-4">
                We use AI to help process responses at scale, but <strong className="font-semibold">humans make all final decisions</strong>. This is not an exclusion machine—it's a way to route people differently and ensure everyone has the information they need.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                What this is not
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>A dating app or compatibility score</li>
                <li>A morality judge or exclusion machine</li>
                <li>An automated ban system</li>
                <li>A therapy session</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                Why we use AI
              </h3>
              <p className="mb-4">
                We're processing a large volume of applications. AI helps us scale reflection and identify patterns, but it only <em>assists</em>—it doesn't decide. Every flagged response is reviewed by a human organizer.
              </p>
            </section>

            <section className="bg-orange-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Your data
              </h3>
              <ul className="space-y-2 text-sm">
                <li>✓ Your answers are used only for event safety and cultural onboarding</li>
                <li>✓ They are automatically deleted after 6 months (30 July 2026)</li>
                <li>✓ You can request a human explanation at any time</li>
                <li>✓ You can request deletion at any time</li>
                <li>✓ Sensitive data (sexuality, gender identity, phobia-related responses) is marked and handled with extra care</li>
              </ul>
            </section>
          </div>
        </div>

        {/* Consent Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Get Started
          </h3>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
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
                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="consent" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">I consent to this cultural onboarding assessment.</span>
                <br />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  I understand that my answers will be used for event safety and cultural onboarding, stored for 6 months, and reviewed by human organizers. I can request explanation or deletion at any time.
                </span>
              </label>
            </div>

            <button
              onClick={handleStart}
              disabled={!consentGiven || !email || loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Starting...' : 'Start Cultural Onboarding'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Powered by{' '}
            <Link href="https://soulsortai.com" className="text-orange-600 dark:text-orange-400 hover:underline">
              SoulSort
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}


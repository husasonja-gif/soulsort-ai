'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import RadarChart from '@/components/RadarChart'
import ShareCard from '@/components/ShareCard'
import ThemeToggle from '@/components/ThemeToggle'
import type { UserRadarProfile, ConsentRecord } from '@/lib/types'

interface DashboardClientProps {
  radarProfile: UserRadarProfile | null
  consents: ConsentRecord[]
  shareLink: string
}

export default function DashboardClient({ radarProfile, consents, shareLink }: DashboardClientProps) {
  const router = useRouter()

  const publicRadarConsent = consents.find(c => c.consent_type === 'public_radar' && c.granted && !c.revoked_at)
  const analyticsConsent = consents.find(c => c.consent_type === 'analytics' && c.granted && !c.revoked_at)

  const [publicRadar, setPublicRadar] = useState(!!publicRadarConsent)
  const [analyticsOptIn, setAnalyticsOptIn] = useState(!!analyticsConsent)
  const [updating, setUpdating] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)

  useEffect(() => {
    setPublicRadar(!!publicRadarConsent)
    setAnalyticsOptIn(!!analyticsConsent)
  }, [publicRadarConsent, analyticsConsent])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const handleConsentChange = async (type: 'public_radar' | 'analytics', granted: boolean) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentType: type, granted }),
      })

      if (response.ok) {
        if (type === 'public_radar') {
          setPublicRadar(granted)
        } else {
          setAnalyticsOptIn(granted)
        }
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating consent:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    const ok = window.confirm(
      'This permanently deletes your profile and all data. This cannot be undone. Continue?'
    )
    if (!ok) return

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Your profile and all data have been permanently deleted. You will be signed out.')
        router.push('/login')
      } else {
        const error = await response.json()
        alert(`Failed to delete profile: ${error.error || error.details || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Failed to delete profile. Please try again or contact support.')
    }
  }

  const radarData = radarProfile ? {
    self_transcendence: radarProfile.self_transcendence,
    self_enhancement: radarProfile.self_enhancement,
    rooting: radarProfile.rooting,
    searching: radarProfile.searching,
    relational: radarProfile.relational,
    erotic: radarProfile.erotic,
    consent: radarProfile.consent || (radarProfile as any).consent_dim, // Support both for migration
  } : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">Your SoulSort Profile</h1>
        </div>
        <div className="flex gap-3">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Radar Chart */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">Your SoulSort Radar</h2>
        {radarData ? (
          <>
            <RadarChart data={radarData} label="Your Profile" />
            <div className="mt-6">
              <h3 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">Dimension Meanings</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm dark:text-gray-300">
                <div>
                  <b>Self Transcendence</b> — How much you orient toward meaning and making the world a better place.
                </div>
                <div>
                  <b>Self Enhancement</b> — Drive for intensity, ambition, erotic charge, and self-expression.
                </div>
                <div>
                  <b>Rooting</b> — Your grounding in tradition, conformity, and security.
                </div>
                <div>
                  <b>Searching</b> — Your appetite for novelty, exploration, spontaneity, and change.
                </div>
                <div>
                  <b>Relational Alignment</b> — Your strengths in communication, repair, empathy, and emotional clarity.
                </div>
                <div>
                  <b>Erotic Alignment</b> — Your ability to read, respond to, and co-create erotic connection.
                </div>
                <div>
                  <b>Consent Alignment</b> — Your non-coerciveness, boundary negotiation and self-advocacy comfort
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Complete onboarding to see your radar profile.</p>
            <a href="/onboarding" className="text-purple-600 hover:underline mt-2 inline-block">
              Start onboarding →
            </a>
          </div>
        )}
      </section>

      {/* Dealbreakers */}
      {radarProfile && radarProfile.dealbreakers.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">Your Dealbreakers</h2>
          <ul className="space-y-2 dark:text-gray-300">
            {radarProfile.dealbreakers.map((db, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-1 text-lg">🚩</span>
                <span>{db}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sharing & Consent */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 dark:text-gray-100">Sharing & Consent</h2>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={publicRadar}
              onChange={(e) => handleConsentChange('public_radar', e.target.checked)}
              disabled={updating}
              className="mt-1 w-5 h-5 text-purple-600 rounded accent-purple-600 dark:accent-purple-400"
            />
            <div className="flex-1">
              <span className="font-medium dark:text-gray-100">My radar can be viewed publicly</span>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Allow others to see your radar profile when they use your link (without your identity).
              </p>
            </div>
          </label>

          <div className="pt-2">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Your share link</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm dark:text-gray-100"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareLink)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
              You can paste this link in your dating/online profile bio with a short explainer e.g. 'Here's my personal vibe-check link. Send me our score and I'm more likely to answer :)'
            </p>
          </div>

          {/* Generate shareable radar card */}
          {radarData && (
            <div className="pt-4">
              <button
                onClick={() => setShowShareCard(!showShareCard)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Generate shareable radar
              </button>
              {showShareCard && (
                <div className="mt-4 p-2 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto">
                  <div className="scale-[0.35] sm:scale-[0.45] md:scale-[0.55] lg:scale-[0.65] xl:scale-75 origin-top-left">
                    <ShareCard
                      radarValues={radarData}
                      shareUrl={shareLink}
                      date={new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <hr className="my-4 dark:border-gray-700" />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={analyticsOptIn}
              onChange={(e) => handleConsentChange('analytics', e.target.checked)}
              disabled={updating}
              className="mt-1 w-5 h-5 text-purple-600 rounded accent-purple-600 dark:accent-purple-400"
            />
            <div className="flex-1">
              <span className="font-medium dark:text-gray-100">My data can be used for anonymized aggregate analytics</span>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Help improve SoulSort by allowing your anonymized data to be used for archetype analysis. No raw responses are stored.
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* Warning Zone */}
      <section className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-red-900 dark:text-red-300">Warning: irrevocable step</h2>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
        >
          Delete my profile and all data
        </button>
        <p className="text-sm text-red-700 dark:text-red-400 mt-2">
          This action cannot be undone. All your data will be permanently deleted.
        </p>
      </section>
    </div>
  )
}

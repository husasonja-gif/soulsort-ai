'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import RadarChart from '@/components/RadarChart'
import ShareCard from '@/components/ShareCard'
import ThemeToggle from '@/components/ThemeToggle'
import DeepInsightsSection from '@/components/DeepInsightsSection'
import type { UserRadarProfile, ConsentRecord } from '@/lib/types'

interface DashboardClientProps {
  radarProfile: UserRadarProfile | null
  consents: ConsentRecord[]
  shareLink: string
  userPreferences?: Record<string, number | undefined> | null
}

export default function DashboardClient({ radarProfile, consents, shareLink, userPreferences = null }: DashboardClientProps) {
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
        credentials: 'include', // Include cookies for authentication
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400">Your SoulSort Profile</h1>
        </div>
        <div className="flex gap-2 items-center">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-100"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Radar Chart */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">Your SoulSort Radar</h2>
        {radarData ? (
          <>
            <RadarChart data={radarData} label="Your Profile" />
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Hover over each axis label to see its explanation.
            </p>
            <div className="mt-6">
              <DeepInsightsSection
                mode="user"
                userRadar={radarData}
                userPreferences={userPreferences}
                userSignalScores={radarProfile?.signal_scores}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>Complete onboarding to see your radar profile.</p>
            <a href="/onboarding" className="text-purple-600 dark:text-purple-400 hover:underline mt-2 inline-block">
              Start onboarding →
            </a>
          </div>
        )}
      </section>

      {/* Dealbreakers */}
      {radarProfile && radarProfile.dealbreakers.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">Your Dealbreakers</h2>
          <ul className="space-y-2">
            {radarProfile.dealbreakers.map((db, idx) => (
              <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-200">
                <span className="text-purple-600 dark:text-purple-400 mt-1 text-lg">🚩</span>
                <span className="text-gray-900 dark:text-gray-100">{db}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sharing & Consent */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Sharing & Consent</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="public-radar-checkbox"
              checked={publicRadar}
              onChange={(e) => handleConsentChange('public_radar', e.target.checked)}
              disabled={updating}
              className="mt-1 w-5 h-5 text-purple-600 rounded accent-purple-600 cursor-pointer flex-shrink-0"
            />
            <label htmlFor="public-radar-checkbox" className="flex-1 cursor-pointer">
              <span className="font-medium dark:text-gray-100">My radar can be viewed publicly</span>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Allow others to see your radar profile when they use your link (without your identity).
              </p>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="analytics-checkbox"
              checked={analyticsOptIn}
              onChange={(e) => handleConsentChange('analytics', e.target.checked)}
              disabled={updating}
              className="mt-1 w-5 h-5 text-purple-600 rounded accent-purple-600 cursor-pointer flex-shrink-0"
            />
            <label htmlFor="analytics-checkbox" className="flex-1 cursor-pointer">
              <span className="font-medium dark:text-gray-100">My data can be used for anonymized aggregate analytics</span>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Help improve SoulSort by allowing your anonymized data to be used for archetype analysis. No raw responses are stored.
              </p>
            </label>
          </div>

          <div className="pt-2">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Your share link</div>
            <div className="flex gap-2">
              <input
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm dark:text-gray-100"
              />
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(shareLink)
                  // Track share action
                  fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      event_type: 'share_clicked',
                      event_data: {
                        share_method: 'copy_link',
                      },
                    }),
                  }).catch(err => console.error('Analytics tracking error:', err))
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
              Use this link in your socials/ bios/ at parties to ask others to vibe check against you. Spark better conversations and invite interpretation!
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  const newState = !showShareCard
                  setShowShareCard(newState)
                  
                  // Track QR code generation when share card is shown
                  if (newState) {
                    fetch('/api/analytics/track', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        event_type: 'share_clicked',
                        event_data: {
                          share_method: 'qr_code',
                        },
                      }),
                    }).catch(err => console.error('Analytics tracking error:', err))
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                {showShareCard ? 'Hide' : 'Generate'} shareable radar
              </button>
            </div>
            {showShareCard && radarData && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <ShareCard radarData={radarData} shareLink={shareLink} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Warning Zone */}
      <section className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-900 dark:text-red-300">Warning: irrevocable step</h2>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Delete my profile and all data
        </button>
        <p className="text-sm text-red-700 dark:text-red-300 mt-2">
          This action cannot be undone. All your data will be permanently deleted.
        </p>
      </section>
    </div>
  )
}

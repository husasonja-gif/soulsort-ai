'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import RadarChart from '@/components/RadarChart'
import ShareCard from '@/components/ShareCard'
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

  const analyticsConsent = consents.find(c => c.consent_type === 'analytics' && c.granted && !c.revoked_at)

  const [analyticsOptIn, setAnalyticsOptIn] = useState(!!analyticsConsent)
  const [updating, setUpdating] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)

  useEffect(() => {
    setAnalyticsOptIn(!!analyticsConsent)
  }, [analyticsConsent])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const handleConsentChange = async (type: 'analytics', granted: boolean) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentType: type, granted }),
      })

      if (response.ok) {
        setAnalyticsOptIn(granted)
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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900">
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-300">Your SoulSort Profile</h1>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-purple-300/30 rounded-xl bg-white/10 hover:bg-white/20 text-purple-100 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Radar Chart + Deep Insights + Analytics consent */}
      <section className="bg-white/10 backdrop-blur-xl rounded-2xl border border-purple-300/20 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-300">Your SoulSort Radar</h2>
        {radarData ? (
          <>
            <RadarChart data={radarData} label="Your Profile" />
            <p className="mt-3 text-xs text-gray-400">
              Hover over each axis label to see its explanation.
            </p>
            <div className="mt-6">
              <DeepInsightsSection
                mode="user"
                userRadar={radarData}
                userPreferences={userPreferences}
                userSignalScores={radarProfile?.signal_scores}
                insightOverrides={radarProfile?.deep_insights_copy || null}
              />
            </div>
            {/* Analytics consent - minimal, below insights */}
            <div className="mt-4 pt-4 border-t border-purple-300/20 flex items-center gap-3">
              <input
                type="checkbox"
                id="analytics-checkbox"
                checked={analyticsOptIn}
                onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                disabled={updating}
                className="w-4 h-4 accent-purple-600 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="analytics-checkbox" className="text-sm text-gray-400 cursor-pointer">
                My data can be used for anonymized aggregate analytics
              </label>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>Complete onboarding to see your radar profile.</p>
            <a href="/onboarding" className="text-purple-300 hover:underline mt-2 inline-block">
              Start onboarding →
            </a>
          </div>
        )}
      </section>

      {/* Share Link */}
      <section className="bg-white/10 backdrop-blur-xl rounded-2xl border border-purple-300/20 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3 text-purple-300">Your Vibe-Check Link</h2>
        <div className="flex gap-2">
          <input
            value={shareLink}
            readOnly
            className="flex-1 px-3 py-2 border border-purple-300/30 rounded-xl bg-white/10 text-sm text-gray-200"
          />
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(shareLink)
              fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event_type: 'share_clicked',
                  event_data: { share_method: 'copy_link' },
                }),
              }).catch(err => console.error('Analytics tracking error:', err))
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Copy
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-2 italic">
          Share in your bio, socials or at parties — invite people to vibe-check against your radar.
        </p>
        <div className="mt-4">
          <button
            onClick={() => {
              const newState = !showShareCard
              setShowShareCard(newState)
              if (newState) {
                fetch('/api/analytics/track', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event_type: 'share_clicked',
                    event_data: { share_method: 'qr_code' },
                  }),
                }).catch(err => console.error('Analytics tracking error:', err))
              }
            }}
            className="px-4 py-2 border border-purple-300/30 bg-white/10 text-purple-200 rounded-xl hover:bg-white/20 transition-colors text-sm font-medium"
          >
            {showShareCard ? 'Hide' : 'Generate'} shareable radar
          </button>
        </div>
        {showShareCard && radarData && (
          <div className="mt-6 pt-6 border-t border-purple-300/20">
            <ShareCard radarData={radarData} shareLink={shareLink} />
          </div>
        )}
      </section>

      {/* Dealbreakers */}
      {radarProfile && radarProfile.dealbreakers.length > 0 && (
        <section className="bg-white/10 backdrop-blur-xl rounded-2xl border border-purple-300/20 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-300">Your Dealbreakers</h2>
          <ul className="space-y-2">
            {radarProfile.dealbreakers.map((db, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 w-5 h-5 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </span>
                <span className="text-gray-200">{db}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Warning Zone */}
      <section className="bg-red-900/20 rounded-2xl border border-red-500/30 p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-300">Warning: irrevocable step</h2>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Delete my profile and all data
        </button>
        <p className="text-sm text-red-300 mt-2">
          This action cannot be undone. All your data will be permanently deleted.
        </p>
      </section>
    </div>
    </div>
  )
}

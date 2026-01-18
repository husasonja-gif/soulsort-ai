'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BMNLRadarChart from '@/components/BMNLRadarChart'
import { supabase } from '@/lib/supabaseClient'

interface RadarProfile {
  participation: 'low' | 'emerging' | 'stable' | 'mastering'
  consent_literacy: 'low' | 'emerging' | 'stable' | 'mastering'
  communal_responsibility: 'low' | 'emerging' | 'stable' | 'mastering'
  inclusion_awareness: 'low' | 'emerging' | 'stable' | 'mastering'
  self_regulation: 'low' | 'emerging' | 'stable' | 'mastering'
  openness_to_learning: 'low' | 'emerging' | 'stable' | 'mastering'
  gate_experience: 'basic' | 'needs_orientation'
}

interface Answer {
  question_number: number
  question_text: string
  raw_answer: string
  answered_at: string
}

function BMNLParticipantDashboardContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [radar, setRadar] = useState<RadarProfile | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    const loadParticipant = async () => {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/bmnl/login')
        return
      }

      // Find participant by auth_user_id
      const { data: participant, error: participantError } = await supabase
        .from('bmnl_participants')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (participantError || !participant) {
        console.error('Error finding participant:', participantError)
        router.push('/bmnl/start')
        return
      }

      setParticipantId(participant.id)
      loadDashboard(participant.id)
    }

    loadParticipant()
  }, [router])

  const loadDashboard = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/bmnl/dashboard?participant_id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setRadar(data.radar)
        setAnswers(data.answers || [])
        
        // Load summary if radar exists
        if (data.radar) {
          loadSummary(id, data.radar, data.answers || [])
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to load dashboard')
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      alert('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async (id: string, radarData: RadarProfile, answersData: Answer[]) => {
    setSummaryLoading(true)
    try {
      const response = await fetch('/api/bmnl/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: id,
          radar: radarData,
          answers: answersData,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error loading summary:', error)
    } finally {
      setSummaryLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-50">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-900">
                Your Cultural Onboarding Results
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-600">
                Where the Sheep Sleep - Burning Man Netherlands
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut()
                    router.push('/bmnl')
                  } catch (error) {
                    console.error('Error signing out:', error)
                    // Even if signout fails, redirect to landing page
                    router.push('/bmnl')
                  }
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Radar Visualization */}
        {radar && (
          <div className="bg-white dark:bg-white rounded-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-900">
              Your Radar Profile
            </h2>
            
            {/* Circular Radar Chart */}
            <div className="flex justify-center items-center mb-8 w-full overflow-visible px-4">
              <div className="w-full max-w-[1100px] flex justify-center">
                <BMNLRadarChart data={radar} />
              </div>
            </div>
          </div>
        )}

        {/* Summary Section */}
        {radar && (
          <div className="bg-white dark:bg-white rounded-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-purple-600 dark:text-purple-600">
              Summary
            </h2>
            {summaryLoading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>Generating summary...</span>
              </div>
            ) : summary ? (
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-8">
                {summary}
              </div>
            ) : (
              <p className="text-gray-600 mb-8">Summary will appear here once generated.</p>
            )}
            
            {/* Axis Descriptions */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-6 text-purple-600 dark:text-purple-600">
                About Your Dimensions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="font-semibold text-purple-600 mb-2">Participation</h4>
                  <p className="text-sm text-gray-600">Contribution mindset, willingness to engage, show up, and co-create</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="font-semibold text-purple-600 mb-2">Consent Literacy</h4>
                  <p className="text-sm text-gray-600">Navigating boundaries, ambiguity, and power with care and awareness</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="font-semibold text-purple-600 mb-2">Communal Responsibility</h4>
                  <p className="text-sm text-gray-600">Accountability, civic maturity, and shared ownership of the space</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="font-semibold text-purple-600 mb-2">Inclusion Awareness</h4>
                  <p className="text-sm text-gray-600">Impact awareness, difference navigation, harm response</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="font-semibold text-purple-600 mb-2">Self-Regulation</h4>
                  <p className="text-sm text-gray-600">Nervous system resilience, self-reliance under strain</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="font-semibold text-purple-600 mb-2">Openness to Learning</h4>
                  <p className="text-sm text-gray-600">Curiosity, humility, repair capacity, growth orientation</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Answers Section */}
        {answers.length > 0 && (
          <div className="bg-white dark:bg-white rounded-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-900">
              Your Answers
            </h2>
            <div className="space-y-6">
              {answers.map((answer) => (
                <div key={answer.question_number} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      Question {answer.question_number}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(answer.answered_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 mb-2">{answer.question_text}</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{answer.raw_answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GDPR Actions */}
        <div className="bg-white dark:bg-white rounded-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Your Rights</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <p>You can request:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>A human explanation of your results</li>
              <li>Deletion of your data (see button below)</li>
              <li>Export of your data (GDPR access right)</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={() => alert('Contact organizers at [email] to request explanation')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Request Explanation
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to permanently delete all your data? This action cannot be undone and will immediately delete all your assessment data, answers, and profile.')) {
                    fetch(`/api/bmnl/delete?participant_id=${participantId}`, { method: 'POST' })
                      .then(async (res) => {
                        if (res.ok) {
                          alert('All your data has been permanently deleted. You will be redirected to the landing page.')
                          router.push('/bmnl')
                        } else {
                          const error = await res.json()
                          alert(`Failed to delete data: ${error.error || 'Unknown error'}`)
                        }
                      })
                      .catch(() => alert('Failed to delete data. Please try again.'))
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
              >
                Delete All My Data
              </button>
              <button
                onClick={() => {
                  fetch(`/api/bmnl/export?participant_id=${participantId}`)
                    .then(res => res.json())
                    .then(data => {
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `bmnl-data-${Date.now()}.json`
                      a.click()
                    })
                    .catch(() => alert('Failed to export data'))
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Export My Data
              </button>
            </div>
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

export default function BMNLParticipantDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BMNLParticipantDashboardContent />
    </Suspense>
  )
}


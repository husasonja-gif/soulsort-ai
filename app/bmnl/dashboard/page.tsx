'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface RadarProfile {
  participation: 'low' | 'medium' | 'high'
  consent_literacy: 'low' | 'medium' | 'high'
  communal_responsibility: 'low' | 'medium' | 'high'
  inclusion_awareness: 'low' | 'medium' | 'high'
  self_regulation: 'low' | 'medium' | 'high'
  openness_to_learning: 'low' | 'medium' | 'high'
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
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [radar, setRadar] = useState<RadarProfile | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [participantId, setParticipantId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      router.push('/bmnl?error=no_token')
      return
    }

    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [id] = decoded.split(':')
      setParticipantId(id)
      loadDashboard(id)
    } catch (error) {
      console.error('Error decoding token:', error)
      router.push('/bmnl?error=invalid_token')
    }
  }, [token, router])

  const loadDashboard = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/bmnl/dashboard?participant_id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setRadar(data.radar)
        setAnswers(data.answers || [])
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

  const getSignalLabel = (level: 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'low': return 'Emerging'
      case 'medium': return 'Developing'
      case 'high': return 'Strong'
      default: return level
    }
  }

  const getSignalColor = (level: 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'low': return 'bg-gray-200 text-gray-700'
      case 'medium': return 'bg-purple-200 text-purple-700'
      case 'high': return 'bg-purple-600 text-white'
      default: return 'bg-gray-200 text-gray-700'
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
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-900">
            Your Cultural Onboarding Results
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-600">
            Where the Sheep Sleep - Burning Man Netherlands
          </p>
        </div>

        {/* Status Card */}
        {radar && (
          <div className="bg-white dark:bg-white rounded-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-900">
              Status
            </h2>
            {radar.gate_experience === 'basic' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold">You're good to go</p>
                <p className="text-green-700 text-sm mt-1">See you at the gate!</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-semibold">An organizer may want to have a short conversation with you at the gate</p>
                <p className="text-yellow-700 text-sm mt-1">This is an opportunity for orientation, not exclusion.</p>
              </div>
            )}
          </div>
        )}

        {/* Radar Visualization */}
        {radar && (
          <div className="bg-white dark:bg-white rounded-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-900">
              Your Radar Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(radar).filter(([key]) => key !== 'gate_experience').map(([axis, level]) => (
                <div key={axis} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {axis.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getSignalColor(level as 'low' | 'medium' | 'high')}`}>
                      {getSignalLabel(level as 'low' | 'medium' | 'high')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        level === 'high' ? 'bg-purple-600' :
                        level === 'medium' ? 'bg-purple-300' : 'bg-gray-400'
                      }`}
                      style={{ width: level === 'high' ? '100%' : level === 'medium' ? '66%' : '33%' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Axis Explanations */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">What these mean</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <strong>Participation:</strong> Engagement with event activities and community
                </div>
                <div>
                  <strong>Consent Literacy:</strong> Understanding and practice of consent and boundaries
                </div>
                <div>
                  <strong>Communal Responsibility:</strong> Contribution to shared community well-being
                </div>
                <div>
                  <strong>Inclusion Awareness:</strong> Recognition and respect for diverse identities and experiences
                </div>
                <div>
                  <strong>Self-Regulation:</strong> Ability to manage emotions and behavior in intense environments
                </div>
                <div>
                  <strong>Openness to Learning:</strong> Willingness to receive feedback and grow
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
              <li>Deletion of your data (will be processed within 30 days)</li>
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
                  if (confirm('Are you sure you want to request deletion? This cannot be undone.')) {
                    fetch(`/api/bmnl/delete?participant_id=${participantId}`, { method: 'POST' })
                      .then(() => alert('Deletion request submitted'))
                      .catch(() => alert('Failed to submit deletion request'))
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Request Deletion
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


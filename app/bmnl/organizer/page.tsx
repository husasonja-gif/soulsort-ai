'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface Participant {
  id: string
  email: string
  status: string
  assessment_completed_at: string | null
  needs_human_review: boolean
  gate_experience?: 'basic' | 'needs_orientation'
}

interface Flag {
  id: string
  participant_id: string
  flag_type: string
  flag_reason: string
  question_number: number | null
  severity: string
  reviewed_at: string | null
  review_decision: string | null
}

export default function BMNLOrganizerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticating, setAuthenticating] = useState(true)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [flaggedParticipants, setFlaggedParticipants] = useState<Array<Participant & { flags: Flag[] }>>([])
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    basic_gate: 0,
    needs_orientation: 0,
    flagged: 0,
  })

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        // Not authenticated - redirect to login with return URL
        console.log('Not authenticated, redirecting to login')
        router.push(`/login?redirect=${encodeURIComponent('/bmnl/organizer')}`)
        return
      }

      console.log('User authenticated:', user.email)
      setAuthenticating(false)
      loadDashboard()
    }

    checkAuth()
  }, [router])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/bmnl/organizer/overview')
      if (response.ok) {
        const data = await response.json()
        console.log('Organizer dashboard data received:', {
          participantsCount: data.participants?.length || 0,
          flaggedCount: data.flagged?.length || 0,
          stats: data.stats
        })
        setParticipants(data.participants || [])
        setFlaggedParticipants(data.flagged || [])
        setStats(data.stats || stats)
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Organizer dashboard API error:', {
          status: response.status,
          statusText: response.statusText,
          error
        })
        alert(error.error || 'Failed to load dashboard')
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      alert('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (authenticating || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{authenticating ? 'Checking authentication...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-50">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-900">
            Organizer Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-600">
            Burning Man Netherlands - Cultural Onboarding
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Participants</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed Radars</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.basic_gate}</div>
            <div className="text-sm text-gray-600">Basic Gate Experience</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.needs_orientation}</div>
            <div className="text-sm text-gray-600">Needs Orientation</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 col-span-2 sm:col-span-1">
            <div className="text-2xl font-bold text-purple-600">{stats.flagged}</div>
            <div className="text-sm text-gray-600">Flagged for Review</div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-purple-800">
            <strong>Important:</strong> AI flags → humans decide. No automatic exclusion. All flagged participants require human review.
          </p>
        </div>

        {/* Flagged Participants Table */}
        {flaggedParticipants.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900">
              Flagged Participants
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Flag Reason(s)</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Severity</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedParticipants.map((participant) => (
                    <tr key={participant.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{participant.email}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {participant.flags.map((flag) => (
                            <span
                              key={flag.id}
                              className="inline-block mr-2 px-2 py-1 text-xs rounded bg-purple-100 text-purple-800"
                            >
                              {flag.flag_type}: {flag.flag_reason}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {participant.flags.some(f => f.severity === 'high') ? (
                          <span className="text-red-600 font-semibold">High</span>
                        ) : participant.flags.some(f => f.severity === 'medium') ? (
                          <span className="text-purple-600 font-semibold">Medium</span>
                        ) : (
                          <span className="text-gray-600">Low</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {participant.flags.some(f => f.reviewed_at) ? (
                          <span className="text-green-600">Reviewed</span>
                        ) : (
                          <span className="text-purple-600">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/bmnl/organizer/participant/${participant.id}`}
                          className="text-purple-600 hover:underline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Participants Table */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900">
            All Participants
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Gate Experience</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Completed</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => (
                  <tr key={participant.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">{participant.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        participant.status === 'completed' ? 'bg-green-100 text-green-800' :
                        participant.status === 'flagged' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {participant.gate_experience === 'needs_orientation' ? (
                        <span className="text-purple-600">Needs Orientation</span>
                      ) : (
                        <span className="text-gray-600">Basic</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {participant.assessment_completed_at
                        ? new Date(participant.assessment_completed_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/bmnl/organizer/participant/${participant.id}`}
                        className="text-purple-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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





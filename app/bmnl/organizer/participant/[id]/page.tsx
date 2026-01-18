'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import BMNLRadarChart from '@/components/BMNLRadarChart'

interface ParticipantData {
  participant: {
    id: string
    email: string
    status: string
    created_at: string
    assessment_completed_at: string | null
    needs_human_review: boolean
    review_notes: string | null
  }
  radar: any
  answers: Array<{
    question_number: number
    question_text: string
    raw_answer: string
    answered_at: string
  }>
  flags?: Array<{
    id: string
    flag_type: string
    flag_reason: string
    question_number: number | null
    severity: string
    created_at: string
  }>
}

function ParticipantDetailContent() {
  const router = useRouter()
  const params = useParams()
  const participantId = params.id as string

  const [loading, setLoading] = useState(true)
  const [authenticating, setAuthenticating] = useState(true)
  const [data, setData] = useState<ParticipantData | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push(`/login?redirect=${encodeURIComponent(`/bmnl/organizer/participant/${participantId}`)}`)
        return
      }

      // Check if user is organizer
      const { data: organizer } = await supabase
        .from('bmnl_organizers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!organizer) {
        alert('Not authorized as organizer')
        router.push('/bmnl/organizer')
        return
      }

      setAuthenticating(false)
      loadParticipantData()
    }

    checkAuth()
  }, [router, participantId])

  const loadParticipantData = async () => {
    setLoading(true)
    try {
      // Use export endpoint to get all participant data
      const response = await fetch(`/api/bmnl/export?participant_id=${participantId}`)
      if (response.ok) {
        const exportData = await response.json()
        
        // Get flags directly for this participant
        let flags: any[] = []
        try {
          const flagsResponse = await fetch(`/api/bmnl/organizer/participant/${participantId}`)
          if (flagsResponse.ok) {
            const flagsData = await flagsResponse.json()
            flags = flagsData.flags || []
          }
        } catch (flagsError) {
          console.error('Error fetching flags:', flagsError)
        }

        setData({
          participant: exportData.participant,
          radar: exportData.radar,
          answers: exportData.answers || [],
          flags: flags
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to load participant data')
        router.push('/bmnl/organizer')
      }
    } catch (error) {
      console.error('Error loading participant data:', error)
      alert('Failed to load participant data')
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

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600">No data found</p>
          <Link href="/bmnl/organizer" className="text-purple-600 hover:underline mt-4 block">
            ← Back to Organizer Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-50">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/bmnl/organizer" className="text-purple-600 hover:underline mb-4 inline-block">
            ← Back to Organizer Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-900">
            Participant Details
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-600">{data.participant.email}</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className={`text-lg font-semibold ${
              data.participant.status === 'completed' ? 'text-green-600' :
              data.participant.status === 'flagged' ? 'text-purple-600' :
              'text-gray-600'
            }`}>
              {data.participant.status}
            </div>
          </div>
          <div className={`bg-white border rounded-lg p-4 ${
            data.participant.needs_human_review ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
          }`}>
            <div className="text-sm text-gray-600 mb-1">Needs Review</div>
            <div className={`text-lg font-semibold ${data.participant.needs_human_review ? 'text-purple-600' : 'text-gray-600'}`}>
              {data.participant.needs_human_review ? 'Yes' : 'No'}
            </div>
          </div>
          {data.participant.assessment_completed_at && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date(data.participant.assessment_completed_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Flags Section */}
        {data.flags && data.flags.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Flags</h2>
            <div className="space-y-2">
              {data.flags.map((flag) => (
                <div key={flag.id} className="bg-white rounded p-3 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800 font-semibold">
                      {flag.flag_type}
                    </span>
                    <span className={`text-sm font-semibold ${
                      flag.severity === 'high' ? 'text-red-600' :
                      flag.severity === 'medium' ? 'text-purple-600' :
                      'text-gray-600'
                    }`}>
                      {flag.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{flag.flag_reason}</p>
                  {flag.question_number && (
                    <p className="text-xs text-gray-500 mt-1">Question {flag.question_number}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Radar Chart */}
        {data.radar && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Radar Profile</h2>
            <BMNLRadarChart data={data.radar} />
          </div>
        )}

        {/* Answers */}
        {data.answers && data.answers.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Assessment Answers</h2>
            <div className="space-y-6">
              {data.answers.map((answer, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="font-semibold text-gray-900 mb-2">
                    Question {answer.question_number}: {answer.question_text}
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap">{answer.raw_answer}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Answered: {new Date(answer.answered_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Notes */}
        {data.participant.review_notes && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Review Notes</h2>
            <p className="text-gray-700">{data.participant.review_notes}</p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-gray-600 dark:text-gray-600 mt-8">
          <Link href="/bmnl/organizer" className="text-purple-600 hover:underline">
            ← Back to Organizer Dashboard
          </Link>
        </footer>
      </div>
    </div>
  )
}

export default function ParticipantDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ParticipantDetailContent />
    </Suspense>
  )
}


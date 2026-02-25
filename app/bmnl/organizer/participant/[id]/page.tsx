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
  chat_history?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
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
          chat_history: exportData.chat_history || null,
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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/bmnl/organizer" className="text-purple-300 hover:underline mb-4 inline-block">
            ← Back to Organizer Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">
            Participant Details
          </h1>
          <p className="text-lg text-purple-100">{data.participant.email}</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-xl border border-purple-300/20 rounded-2xl p-4">
            <div className="text-sm text-purple-100/80 mb-1">Status</div>
            <div className={`text-lg font-semibold ${
              data.participant.status === 'completed' ? 'text-green-600' :
              data.participant.status === 'flagged' ? 'text-purple-600' :
              'text-purple-100'
            }`}>
              {data.participant.status}
            </div>
          </div>
          <div className={`backdrop-blur-xl border rounded-2xl p-4 ${
            data.participant.needs_human_review ? 'border-purple-300/30 bg-purple-500/15' : 'border-purple-300/20 bg-white/10'
          }`}>
            <div className="text-sm text-purple-100/80 mb-1">Needs Review</div>
            <div className={`text-lg font-semibold ${data.participant.needs_human_review ? 'text-purple-200' : 'text-purple-100'}`}>
              {data.participant.needs_human_review ? 'Yes' : 'No'}
            </div>
          </div>
          {data.participant.assessment_completed_at && (
            <div className="bg-white/10 backdrop-blur-xl border border-purple-300/20 rounded-2xl p-4">
              <div className="text-sm text-purple-100/80 mb-1">Completed</div>
              <div className="text-lg font-semibold text-white">
                {new Date(data.participant.assessment_completed_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Flags Section */}
        {data.flags && data.flags.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl border border-purple-300/20 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">Flags</h2>
            <div className="space-y-2">
              {data.flags.map((flag) => (
                <div key={flag.id} className="bg-white/10 rounded-xl p-3 border border-purple-300/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-100 font-semibold border border-purple-300/20">
                      {flag.flag_type}
                    </span>
                    <span className={`text-sm font-semibold ${
                      flag.severity === 'high' ? 'text-red-600' :
                      flag.severity === 'medium' ? 'text-purple-600' :
                      'text-purple-100/80'
                    }`}>
                      {flag.severity}
                    </span>
                  </div>
                  <p className="text-sm text-purple-50/90">{flag.flag_reason}</p>
                  {flag.question_number && (
                    <p className="text-xs text-purple-100/70 mt-1">Question {flag.question_number}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Radar Chart */}
        {data.radar && (
          <div className="bg-white/10 backdrop-blur-xl border border-purple-300/20 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">Radar Profile</h2>
            <BMNLRadarChart data={data.radar} />
          </div>
        )}

        {/* Full Chat History */}
        {data.chat_history && data.chat_history.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl border border-purple-300/20 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">Full Conversation History</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {data.chat_history.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-purple-50 border border-purple-200 ml-8'
                      : 'bg-white/10 border border-purple-300/20 mr-8'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-semibold ${
                      message.role === 'user' ? 'text-purple-200' : 'text-purple-100'
                    }`}>
                      {message.role === 'user' ? 'Participant' : 'System'}
                    </span>
                    <span className="text-xs text-purple-100/70">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-purple-50 whitespace-pre-wrap">{message.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answers (fallback if no chat history) */}
        {!data.chat_history && data.answers && data.answers.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl border border-purple-300/20 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">Assessment Answers</h2>
            <div className="space-y-6">
              {data.answers.map((answer, index) => (
                <div key={index} className="border-b border-purple-300/20 pb-4 last:border-b-0">
                  <div className="font-semibold text-white mb-2">
                    Question {answer.question_number}: {answer.question_text}
                  </div>
                  <div className="text-purple-50/90 whitespace-pre-wrap">{answer.raw_answer}</div>
                  <div className="text-xs text-purple-100/70 mt-2">
                    Answered: {new Date(answer.answered_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Notes */}
        {data.participant.review_notes && (
          <div className="bg-white/10 backdrop-blur-xl border border-purple-300/20 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-2 text-white">Review Notes</h2>
            <p className="text-purple-50/90">{data.participant.review_notes}</p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-purple-100/80 mt-8">
          <Link href="/bmnl/organizer" className="text-purple-300 hover:underline">
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


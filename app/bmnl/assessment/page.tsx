'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ChatMessage } from '@/lib/types'

const BMNL_QUESTIONS = [
  'Why do you want to join this event, and what do you understand about what it is?',
  'Which Burning Man principle feels easiest for you to live by — and which one feels most challenging?',
  'Have you attended Burning Man–inspired events before? If so, which ones?',
  'Burning Man environments can be intense. How do you respond when you\'re tired, overstimulated, or out of your comfort zone in a group?',
  'Not all boundaries are explicit here. How do you act when you\'re unsure what\'s welcome or appropriate?',
  'If someone gently challenges your behavior during the event, how do you respond?',
  'How do you respond when you learn something you did affected someone negatively (even unintentionally)?',
  'How do you feel about there being expectations or standards of behaviour?',
  'Will you commit to one or two volunteer shifts during the event?',
  'What would you like to gift to the burn (time, skills, care, creativity)?',
  'What do you hope others will bring or offer — to you or to the community?',
]

export default function BMNLAssessmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [participantId, setParticipantId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      router.push('/bmnl?error=no_token')
      return
    }

    // Decode token to get participant ID
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [id] = decoded.split(':')
      setParticipantId(id)

      // Start assessment
      startAssessment(id)
    } catch (error) {
      console.error('Error decoding token:', error)
      router.push('/bmnl?error=invalid_token')
    }
  }, [token, router])

  const startAssessment = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/bmnl/assessment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: id }),
      })

      if (response.ok) {
        // Show first question
        setChatHistory([
          {
            role: 'assistant',
            content: BMNL_QUESTIONS[0],
            timestamp: new Date(),
          },
        ])
      } else {
        alert('Failed to start assessment')
      }
    } catch (error) {
      console.error('Error starting assessment:', error)
      alert('Failed to start assessment')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAnswer.trim() || loading || !participantId) return

    const questionNumber = currentQuestionIndex + 1
    const questionText = BMNL_QUESTIONS[currentQuestionIndex]

    // Add user answer to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: currentAnswer,
      timestamp: new Date(),
    }

    const updatedHistory = [...chatHistory, userMessage]
    setChatHistory(updatedHistory)
    setCurrentAnswer('')
    setLoading(true)

    try {
      // Save answer and extract signal
      const response = await fetch('/api/bmnl/assessment/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          question_number: questionNumber,
          question_text: questionText,
          answer: currentAnswer,
          chat_history: updatedHistory,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process answer')
      }

      const data = await response.json()

      // Check for garbage response
      if (data.signal?.is_garbage) {
        setChatHistory([
          ...updatedHistory,
          {
            role: 'assistant',
            content: 'Can you try answering that again? This response stays at the surface, and we\'re looking for lived understanding.',
            timestamp: new Date(),
          },
        ])
        setLoading(false)
        return
      }

      // Check for phobic language
      if (data.signal?.is_phobic) {
        setChatHistory([
          ...updatedHistory,
          {
            role: 'assistant',
            content: 'This answer contains language that conflicts with our commitment to radical inclusion. A human organizer will review this with you.',
            timestamp: new Date(),
          },
        ])
        // Continue to next question but flag for review
      }

      // Move to next question or complete
      if (currentQuestionIndex < BMNL_QUESTIONS.length - 1) {
        const nextIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextIndex)
        setChatHistory([
          ...updatedHistory,
          {
            role: 'assistant',
            content: BMNL_QUESTIONS[nextIndex],
            timestamp: new Date(),
          },
        ])
      } else {
        // All questions answered - complete assessment
        await completeAssessment(participantId, updatedHistory)
      }
    } catch (error) {
      console.error('Error processing answer:', error)
      alert('Failed to process answer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const completeAssessment = async (id: string, finalHistory: ChatMessage[]) => {
    setLoading(true)
    try {
      const response = await fetch('/api/bmnl/assessment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: id,
          chat_history: finalHistory,
        }),
      })

      if (response.ok) {
        router.push(`/bmnl/dashboard?token=${token}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to complete assessment')
      }
    } catch (error) {
      console.error('Error completing assessment:', error)
      alert('Failed to complete assessment')
    } finally {
      setLoading(false)
    }
  }

  if (!participantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2 text-orange-600 dark:text-orange-400">
            Cultural Onboarding
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Question {currentQuestionIndex + 1} of {BMNL_QUESTIONS.length}
          </p>
        </div>

        {/* Chat History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6 min-h-[400px] max-h-[600px] overflow-y-auto">
          <div className="space-y-4">
            {chatHistory.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="animate-pulse">Processing...</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 mb-4 min-h-[120px]"
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={!currentAnswer.trim() || loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : currentQuestionIndex < BMNL_QUESTIONS.length - 1 ? 'Next Question' : 'Complete Assessment'}
          </button>
        </form>
      </div>
    </div>
  )
}


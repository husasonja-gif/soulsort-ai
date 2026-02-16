'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { t, getCanonicalText, detectLanguage } from '@/lib/translations'
import type { ChatMessage } from '@/lib/types'

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

// Canonical English questions (for LLM - always English)
const BMNL_QUESTIONS_CANONICAL = [
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

// Helper to get translated questions
function getBMNLQuestions(lang: 'en' | 'nl' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'fi'): string[] {
  return [
    t('bmnl.q1', lang),
    t('bmnl.q2', lang),
    t('bmnl.q3', lang),
    t('bmnl.q4', lang),
    t('bmnl.q5', lang),
    t('bmnl.q6', lang),
    t('bmnl.q7', lang),
    t('bmnl.q8', lang),
    t('bmnl.q9', lang),
    t('bmnl.q10', lang),
    t('bmnl.q11', lang),
  ]
}

function BMNLAssessmentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [userLang, setUserLang] = useState<'en' | 'nl' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'fi'>('en')

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [gamingCount, setGamingCount] = useState(0)
  const [phobicCount, setPhobicCount] = useState(0)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const BMNL_QUESTIONS = getBMNLQuestions(userLang)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserLang(detectLanguage())
    }
  }, [])

  useEffect(() => {
    const loadParticipant = async () => {
      // Check for participant_id in URL params first (from start page)
      const participantIdParam = searchParams.get('participant_id')
      if (participantIdParam) {
        setParticipantId(participantIdParam)
        startAssessment(participantIdParam)
        return
      }

      // Otherwise, try to get from authenticated user
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
      startAssessment(participant.id)
    }

    loadParticipant()
  }, [searchParams, router])

  // Always keep the latest messages in view (especially important on mobile)
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [chatHistory, loading])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = navigator.language || 'en-US'

        // Use a ref-like pattern to track final transcript per recording session
        let sessionFinalTranscript = ''
        
        recognitionInstance.onstart = () => {
          // Reset transcript when starting a new recording session
          sessionFinalTranscript = ''
        }
        
        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              sessionFinalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          setCurrentAnswer(sessionFinalTranscript + interimTranscript)
        }

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          if (event.error === 'no-speech' || event.error === 'audio-capture') {
            setIsRecording(false)
          }
        }

        recognitionInstance.onend = () => {
          setIsRecording(false)
          // Reset transcript when recording ends
          sessionFinalTranscript = ''
        }

        setRecognition(recognitionInstance)
      }
    }
  }, [])

  const toggleRecording = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      setCurrentAnswer('') // Clear previous answer
      try {
        recognition.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Error starting recognition:', error)
        alert('Could not start recording. Please try again.')
      }
    }
  }

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
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = error.error || error.details || 'Failed to start assessment'
        alert(`Failed to start assessment: ${errorMessage}`)
        // Redirect back to landing page on error
        router.push('/bmnl?error=assessment_start_failed')
      }
    } catch (error) {
      console.error('Error starting assessment:', error)
      alert('Failed to start assessment. Please check your connection and try again.')
      router.push('/bmnl?error=network_error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAnswer.trim() || loading || !participantId) return

    const questionNumber = currentQuestionIndex + 1
    // Use canonical English question for LLM
    const questionText = BMNL_QUESTIONS_CANONICAL[currentQuestionIndex]

    // Add user answer to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: currentAnswer,
      timestamp: new Date(),
    }

    const updatedHistory = [...chatHistory, userMessage]
    setChatHistory(updatedHistory)
    const answerText = currentAnswer.trim()
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
          answer: answerText,
          chat_history: updatedHistory,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to process answer'
        try {
          const error = await response.json()
          errorMessage = error.error || error.details || errorMessage
        } catch (e) {
          // If response isn't JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Check for garbage response
      if (data.signal?.is_garbage) {
        // Stop any active recording
        if (isRecording && recognition) {
          recognition.stop()
          setIsRecording(false)
        }
        // Don't clear answer - let them edit it
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

      // Check for gaming response
      if (data.signal?.is_gaming) {
        const newGamingCount = gamingCount + 1
        setGamingCount(newGamingCount)
        
        // Stop any active recording
        if (isRecording && recognition) {
          recognition.stop()
          setIsRecording(false)
        }
        
        if (newGamingCount >= 3) {
          // After 3 gaming instances, stop assessment and redirect to dashboard
          setChatHistory([
            ...updatedHistory,
            {
              role: 'assistant',
              content: 'Unfortunately, the system was unable to verify your responses. A human will be in touch with you to discuss further.',
              timestamp: new Date(),
            },
          ])
          setLoading(false)
          
          // Complete assessment early with flagged status
          setTimeout(() => {
            completeAssessment(participantId, [
              ...updatedHistory,
              {
                role: 'assistant',
                content: 'Unfortunately, the system was unable to verify your responses. A human will be in touch with you to discuss further.',
                timestamp: new Date(),
              },
            ])
          }, 2000)
          return
        } else {
          // Call out gaming but allow continuation
          setChatHistory([
            ...updatedHistory,
            {
              role: 'assistant',
              content: 'We\'re looking for authentic, personal responses. Please answer from your own experience rather than trying to optimize your answers.',
              timestamp: new Date(),
            },
          ])
          setLoading(false)
          return
        }
      }

      // Add commentary if available (before flag messages)
      let historyWithCommentary = [...updatedHistory]
      if (data.commentary) {
        historyWithCommentary.push({
          role: 'assistant',
          content: data.commentary,
          timestamp: new Date(),
        })
      }

      // Check for phobic language
      if (data.signal?.is_phobic) {
        const newPhobicCount = phobicCount + 1
        setPhobicCount(newPhobicCount)
        
        if (newPhobicCount >= 3) {
          // After 3 phobic instances, stop assessment and redirect to dashboard
          setChatHistory([
            ...historyWithCommentary,
            {
              role: 'assistant',
              content: 'Unfortunately, the system was unable to verify your responses. A human will be in touch with you to discuss further.',
              timestamp: new Date(),
            },
          ])
          setLoading(false)
          
          // Complete assessment early with flagged status
          setTimeout(() => {
            completeAssessment(participantId, [
              ...historyWithCommentary,
              {
                role: 'assistant',
                content: 'Unfortunately, the system was unable to verify your responses. A human will be in touch with you to discuss further.',
                timestamp: new Date(),
              },
            ])
          }, 2000)
          return
        } else {
          // Call out phobic language but allow continuation
          historyWithCommentary.push({
            role: 'assistant',
            content: 'This answer contains language that conflicts with our commitment to radical inclusion. A human organizer will review this with you.',
            timestamp: new Date(),
          })
        }
      }

      // Move to next question or complete
      if (currentQuestionIndex < BMNL_QUESTIONS.length - 1) {
        const nextIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextIndex)
        
        // Stop any active recording and clear answer for next question
        if (isRecording && recognition) {
          recognition.stop()
          setIsRecording(false)
        }
        setCurrentAnswer('') // Clear answer for next question
        
        historyWithCommentary.push({
          role: 'assistant',
          content: BMNL_QUESTIONS[nextIndex],
          timestamp: new Date(),
        })
        setChatHistory(historyWithCommentary)
      } else {
        // All questions answered - complete assessment
        // Stop any active recording
        if (isRecording && recognition) {
          recognition.stop()
          setIsRecording(false)
        }
        setChatHistory(historyWithCommentary)
        await completeAssessment(participantId, historyWithCommentary)
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
        const data = await response.json()
        // Redirect to dashboard (uses authentication)
        router.push('/bmnl/dashboard')
      } else {
        let errorMessage = 'Failed to complete assessment'
        try {
          const error = await response.json()
          errorMessage = error.error || error.details || errorMessage
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error completing assessment:', error)
      alert('Failed to complete assessment. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!participantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
          <p className="text-sm text-gray-500 mt-2">If this takes too long, please go back and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <div className="bg-white dark:bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-900">
            Cultural Onboarding
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-600">
            Question {currentQuestionIndex + 1} of {BMNL_QUESTIONS.length}
          </p>
        </div>

        {/* Chat History */}
        <div className="bg-white dark:bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 min-h-[300px] sm:min-h-[400px] max-h-[500px] sm:max-h-[600px] overflow-y-auto">
          <div className="space-y-4">
            {chatHistory.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-100 text-gray-900 dark:text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-100 rounded-lg p-4">
                  <div className="animate-pulse text-gray-600">Processing...</div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-white rounded-lg p-4 sm:p-6">
          <div className="mb-2 text-xs text-gray-500">
            {t('ui.onboarding.chat.audio.hint', userLang)}
          </div>
          <div className="flex items-end gap-2 mb-4">
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Share your answer..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-white dark:text-gray-900 min-h-[100px] sm:min-h-[120px]"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={toggleRecording}
              disabled={loading}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-xl ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-700'
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? '■' : '🎤'}
            </button>
          </div>

          <button
            type="submit"
            disabled={!currentAnswer.trim() || loading || isRecording}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : currentQuestionIndex < BMNL_QUESTIONS.length - 1 ? 'Next Question' : 'Complete Assessment'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function BMNLAssessmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BMNLAssessmentPageContent />
    </Suspense>
  )
}


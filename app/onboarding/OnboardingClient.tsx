'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { t, detectLanguage } from '@/lib/translations'
import { CANONICAL_DATING_QUESTIONS } from '@/lib/datingQuestions'
import type { ChatMessage } from '@/lib/types'

interface OnboardingClientProps {
  userId: string
  skipChat?: boolean
}

// Basic Speech Recognition types (browser-only)
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: (() => void) | null
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

type SurveySection = 'dealbreakers' | 'preferences' | 'chat' | 'complete'

export default function OnboardingClient({ userId, skipChat = false }: OnboardingClientProps) {
  const router = useRouter()
  const [section, setSection] = useState<SurveySection>('dealbreakers')
  const [dealbreakers, setDealbreakers] = useState<string[]>([])
  const [preferences, setPreferences] = useState<Record<string, number>>({
    erotic_pace: 50,
    novelty_depth_preference: 50,
    vanilla_kinky: 50,
    open_monogamous: 50,
    boundaries_ease: 50, // New: 0 = Hard, 100 = Easy
  })
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<number>(0)
  const [currentMessage, setCurrentMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatComplete, setChatComplete] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  // Always keep the latest messages in view (especially important on mobile)
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [chatHistory, loading])

  // Initialise speech recognition for audio answering (where supported)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const AnyWindow = window as any
    const SR = AnyWindow.webkitSpeechRecognition || AnyWindow.SpeechRecognition
    if (!SR) return

    const recognitionInstance: SpeechRecognition = new SR()
    recognitionInstance.continuous = true
    recognitionInstance.interimResults = true
    recognitionInstance.lang = navigator.language || 'en-US'

    let sessionFinalTranscript = ''

    recognitionInstance.onstart = () => {
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
      setCurrentMessage((sessionFinalTranscript + interimTranscript).trimStart())
    }

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error (onboarding):', event.error)
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setIsRecording(false)
      }
    }

    recognitionInstance.onend = () => {
      setIsRecording(false)
      sessionFinalTranscript = ''
    }

    setRecognition(recognitionInstance)
  }, [])

  const toggleRecording = () => {
    if (!recognition) {
      alert('Voice input is not supported in this browser. Please use a recent version of Chrome or Edge.')
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      setCurrentMessage('')
      try {
        recognition.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Error starting onboarding recognition:', error)
        alert('Could not start recording. Please try again.')
      }
    }
  }

  const dealbreakerOptions = [
    'Communication avoidance',
    'Frequent explosive conflict',
    'Lack of self-awareness',
    'Monogamy mismatch',
    'Kink incompatibility',
    'Consent misalignment',
    'Deceptive/manipulative language',
    'Status-oriented dating',
  ]

  const preferenceLabels = [
    { id: 'erotic_pace', label: 'Slow pace', opposite: 'Fast pace' },
    { id: 'novelty_depth_preference', label: 'Depth first', opposite: 'Novelty first' },
    { id: 'vanilla_kinky', label: 'Vanilla', opposite: 'Kinky' },
    { id: 'open_monogamous', label: 'Open relationship', opposite: 'Monogamous' },
    { id: 'boundaries_ease', label: 'Hard', opposite: 'Easy', title: 'Ease of setting boundaries' },
  ]

  // Get user's language preference
  const [userLang, setUserLang] = useState<'en' | 'nl' | 'de' | 'fr' | 'es' | 'it' | 'pt'>('en')
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserLang(detectLanguage())
    }
  }, [])

  // Canonical English questions (for LLM - always English)
  const canonicalQuestions = CANONICAL_DATING_QUESTIONS.map(
    (question, index) => `[[Q${index + 1}]] ${question}`
  )
  
  // Translated questions (for UI display)
  const chatQuestions = [
    `[[Q1]] ${t('onboarding.q1', userLang)}`,
    `[[Q2]] ${t('onboarding.q2', userLang)}`,
    `[[Q3]] ${t('onboarding.q3', userLang)}`,
    `[[Q4]] ${t('onboarding.q4', userLang)}`,
    `[[Q5]] ${t('onboarding.q5', userLang)}`,
    `[[Q6]] ${t('onboarding.q6', userLang)}`,
    `[[Q7]] ${t('onboarding.q7', userLang)}`,
    `[[Q8]] ${t('onboarding.q8', userLang)}`,
    `[[Q9]] ${t('onboarding.q9', userLang)}`,
  ]

  const handleDealbreakerToggle = (option: string) => {
    setDealbreakers(prev =>
      prev.includes(option)
        ? prev.filter(d => d !== option)
        : [...prev, option]
    )
  }

  const handlePreferenceChange = (id: string, value: number) => {
    setPreferences(prev => ({ ...prev, [id]: value }))
  }

  const handleDealbreakersNext = () => {
    setSection('preferences')
  }

  const handlePreferencesNext = () => {
    if (skipChat) {
      // Skip chat and go directly to profile generation
      setSection('complete')
      generateProfile([]) // Empty chat history since they already answered in requester flow
    } else {
      setSection('chat')
      // Initialize chat with first question
      initializeChat()
    }
  }

  const initializeChat = async () => {
    setLoading(true)
    setChatHistory([
      {
        role: 'assistant',
        content: chatQuestions[0],
        timestamp: new Date(),
      },
    ])
    setCurrentQuestion(0)
    setLoading(false)
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentMessage.trim() || loading) return

    // Stop recording when sending
    if (isRecording && recognition) {
      recognition.stop()
      setIsRecording(false)
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date(),
    }

    const updatedHistory = [...chatHistory, userMessage]
    setChatHistory(updatedHistory)
    setCurrentMessage('')
    setLoading(true)

    try {
      // Get AI commentary for this answer
      // Use canonical English question for LLM, but translated for display
      const response = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex: currentQuestion,
          question: canonicalQuestions[currentQuestion], // Always send English to LLM
          answer: currentMessage,
          chatHistory: updatedHistory.map(msg => {
            // Replace translated questions with canonical English in chat history for LLM
            if (msg.role === 'assistant' && msg.content.startsWith('[[')) {
              const qMatch = msg.content.match(/\[\[Q(\d+)\]\]/)
              if (qMatch) {
                const qIndex = parseInt(qMatch[1]) - 1
                if (qIndex >= 0 && qIndex < canonicalQuestions.length) {
                  return { ...msg, content: canonicalQuestions[qIndex] }
                }
              }
            }
            return msg
          }),
          dealbreakers,
          preferences,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error:', errorText)
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Add AI commentary
      if (data.commentary) {
        setChatHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.commentary,
            timestamp: new Date(),
          },
        ])
      }

      // Move to next question or complete
      if (currentQuestion < chatQuestions.length - 1) {
        const nextQuestion = currentQuestion + 1
        setCurrentQuestion(nextQuestion)
        setChatHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: chatQuestions[nextQuestion], // Display translated version
            timestamp: new Date(),
          },
        ])
      } else {
        // All questions answered
        setChatComplete(true)
        await generateProfile(updatedHistory)
      }
    } catch (error) {
      console.error('Error in chat:', error)
      alert('Error processing your response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateProfile = async (finalChatHistory: ChatMessage[]) => {
    setLoading(true)
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          dealbreakers,
          preferences,
          chatHistory: finalChatHistory,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Complete API error (raw):', errorText)
        let errorData: any = { error: errorText }
        try {
          errorData = JSON.parse(errorText)
          console.error('Complete API error (parsed):', errorData)
        } catch (e) {
          console.error('Failed to parse error response as JSON')
        }
        
        // Extract error message properly
        const errorMessage = errorData.details || errorData.error || errorData.message || `API error: ${response.status}`
        console.error('Extracted error message:', errorMessage)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        throw new Error(data.error || 'Failed to generate profile')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error generating your profile: ${errorMessage}\n\nCheck the console for more details.`)
    } finally {
      setLoading(false)
    }
  }

  if (section === 'dealbreakers') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">{t('ui.onboarding.title', userLang)}</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {skipChat ? 'Section 1 of 1: Dealbreakers' : 'Section 1 of 2: Dealbreakers'}
          </p>
          <p className="text-lg font-medium mb-6 text-gray-900 dark:text-gray-100">
            {t('ui.onboarding.dealbreakers.title', userLang)}
          </p>

          <div className="space-y-3 mb-8">
            {dealbreakerOptions.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={dealbreakers.includes(option)}
                  onChange={() => handleDealbreakerToggle(option)}
                  className="w-5 h-5 text-purple-600 dark:text-purple-400 rounded"
                />
                <span className="flex-1 text-gray-900 dark:text-gray-100">{option}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleDealbreakersNext}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Continue to Preferences
          </button>
        </div>
      </div>
    )
  }

  if (section === 'preferences') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">{t('ui.onboarding.title', userLang)}</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {skipChat ? 'Section 1 of 1: Preferences' : 'Section 2 of 2: Preferences'}
          </p>
          <p className="text-lg font-medium mb-6 text-gray-900 dark:text-gray-100">
            {t('ui.onboarding.preferences.title', userLang)}
          </p>

          <div className="space-y-6 mb-8">
            {preferenceLabels.map((pref) => (
              <div key={pref.id} className="space-y-2">
                {pref.title && (
                  <div className="text-center mb-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pref.title}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{pref.label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{pref.opposite}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={preferences[pref.id]}
                  onChange={(e) => handlePreferenceChange(pref.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="text-center text-sm text-gray-700 dark:text-gray-300">
                  {preferences[pref.id]}%
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handlePreferencesNext}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            {skipChat ? 'Complete Profile' : 'Continue to Chat'}
          </button>
        </div>
      </div>
    )
  }

  if (section === 'chat') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 pb-24 sm:pb-12">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-8 flex flex-col" style={{ minHeight: 'calc(100vh - 6rem)', maxHeight: 'calc(100vh - 6rem)' }}>
          <h1 className="text-2xl font-bold mb-4 dark:text-white">Let's Chat</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            {t('ui.onboarding.chat.intro', userLang, { count: chatQuestions.length })}
          </p>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-800 dark:text-gray-100'
                  }`}
                >
                  {msg.role === 'assistant'
                    ? msg.content.replace(/^\[\[Q\d+\]\]\s*/, '')
                    : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 p-3 rounded-lg">
                  <span className="animate-pulse dark:text-gray-100">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {!chatComplete ? (
            <form onSubmit={handleChatSubmit} className="flex gap-2 items-end pb-safe">
              <div className="flex-1 flex items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={t('ui.onboarding.chat.audio.hint', userLang)}
                  className="flex-1 bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                  disabled={loading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={loading}
                  className={`ml-2 w-9 h-9 rounded-full flex items-center justify-center text-white text-lg ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } disabled:bg-gray-400`}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? '■' : '🎤'}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || !currentMessage.trim()}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-300">Generating your profile...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}





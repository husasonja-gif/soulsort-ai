'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import RadarOverlay from '@/components/RadarOverlay'
import DeepInsightsSection from '@/components/DeepInsightsSection'
import type { CanonicalSignalScores, ChatMessage, RadarDimensions, QuickReplyOption } from '@/lib/types'
import { CANONICAL_DATING_QUESTIONS } from '@/lib/datingQuestions'

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  start: () => void
  stop: () => void
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
}

interface SpeechRecognitionAlternative {
  transcript: string
}

interface RequesterClientProps {
  linkId: string
  userId: string
}

type FlowState = 'intro' | 'chat' | 'consent-denied' | 'results'
type VoiceLangOption =
  | 'auto'
  | 'en-US'
  | 'sv-SE'
  | 'ar-SA'
  | 'zh-CN'
  | 'hi-IN'
  | 'it-IT'
  | 'de-DE'
  | 'fr-FR'
  | 'es-ES'
  | 'pt-PT'
  | 'nl-NL'
  | 'fi-FI'

const QUESTIONS = [...CANONICAL_DATING_QUESTIONS]

// Requester now mirrors canonical 9 free-text questions.
const QUICK_REPLY_QUESTIONS: Record<number, QuickReplyOption[]> = {}

export default function RequesterClient({ linkId, userId }: RequesterClientProps) {
  const router = useRouter()
  const [flowState, setFlowState] = useState<FlowState>('intro')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null)
  const [communicationStyle, setCommunicationStyle] = useState<string | null>(null)
  const [exclusions, setExclusions] = useState<string | null>(null)
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set())
  // Structured fields captured from quick replies
  const [structuredFields, setStructuredFields] = useState<Record<string, string>>({})
  // Requester consent for analytics (default OFF for privacy-first)
  const [analyticsOptIn, setAnalyticsOptIn] = useState<boolean>(false)
  const [assessment, setAssessment] = useState<{
    score: number
    summary: string
    userRadar: RadarDimensions
    requesterRadar: RadarDimensions
    showDeepInsights?: boolean
    abuseFlags?: string[]
    userPreferences?: Record<string, number | undefined> | null
    userSignalScores?: Partial<CanonicalSignalScores> | null
    deepInsightsCopy?: Record<string, string>
  } | null>(null)
  
  // Analytics tracking
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [voiceLang, setVoiceLang] = useState<VoiceLangOption>('auto')
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const resolveVoiceRecognitionLang = (selected: VoiceLangOption): string => {
    if (selected !== 'auto') return selected
    if (typeof window === 'undefined') return 'en-US'
    const primary = navigator.language || 'en-US'
    const languageList = navigator.languages || []
    // On some Nordic devices, Swedish may be spoken despite Finnish locale.
    if (primary.toLowerCase().startsWith('fi')) {
      const swedishFromPrefs = languageList.find((lang) => lang.toLowerCase().startsWith('sv'))
      return swedishFromPrefs || 'sv-SE'
    }
    return primary
  }

  useEffect(() => {
    const AnyWindow = window as Window & {
      webkitSpeechRecognition?: new () => SpeechRecognition
      SpeechRecognition?: new () => SpeechRecognition
    }
    const SR = AnyWindow.webkitSpeechRecognition || AnyWindow.SpeechRecognition
    if (!SR) return

    const recognitionInstance: SpeechRecognition = new SR()
    recognitionInstance.lang = resolveVoiceRecognitionLang(voiceLang)
    recognitionInstance.continuous = true
    recognitionInstance.interimResults = true
    recognitionInstance.onstart = () => setIsRecording(true)
    recognitionInstance.onend = () => setIsRecording(false)
    recognitionInstance.onerror = () => setIsRecording(false)
    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setCurrentMessage(transcript.trim())
    }

    setRecognition(recognitionInstance)
    return () => {
      recognitionInstance.stop()
    }
  }, [voiceLang])

  useEffect(() => {
    const scrollToBottom = (smooth = true) => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        })
      } else if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' })
      }
    }

    const timer = window.setTimeout(() => scrollToBottom(true), 30)
    const viewport = window.visualViewport
    const onViewportChange = () => scrollToBottom(false)
    viewport?.addEventListener('resize', onViewportChange)
    viewport?.addEventListener('scroll', onViewportChange)

    return () => {
      window.clearTimeout(timer)
      viewport?.removeEventListener('resize', onViewportChange)
      viewport?.removeEventListener('scroll', onViewportChange)
    }
  }, [chatHistory, loading, currentQuestionIndex, currentMessage])

  const toggleRecording = () => {
    if (!recognition) return
    if (isRecording) recognition.stop()
    else recognition.start()
  }

  // Generate session token for anonymous tracking
  const generateSessionToken = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  const handleStart = () => {
    // Track requester start
    const token = generateSessionToken()
    setSessionToken(token)
    setStartTime(Date.now())
    
    // Track analytics event with consent info
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'requester_started',
        event_data: {
          link_id: linkId,
          session_token: token,
          analytics_opt_in: analyticsOptIn,
        },
      }),
    }).catch(err => console.error('Analytics tracking error:', err))
    
    setFlowState('chat')
    setCurrentQuestionIndex(0)
    const firstQuestion = QUESTIONS[0]
    const firstQuickReplies = QUICK_REPLY_QUESTIONS[0]
    setChatHistory([
      {
        role: 'assistant',
        content: firstQuestion,
        timestamp: new Date(),
        quickReplies: firstQuickReplies,
      },
    ])
  }

  // Handle structured field capture from quick replies
  const handleQuickReplySelect = async (option: QuickReplyOption, questionIndex: number) => {
    // Prevent multiple rapid clicks
    if (loading) return
    
    // Prevent processing if this question has already been answered
    const quickReplyField = option.field
    if (structuredFields[quickReplyField]) {
      return
    }
    
    setLoading(true)
    
    try {
      // Store the structured value
      setStructuredFields(prev => ({
        ...prev,
        [option.field]: option.value,
      }))

      // Handle Q1 consent specially
      if (questionIndex === 0 && option.field === 'consent') {
        if (option.value === 'no') {
          setConsentGiven(false)
          setFlowState('consent-denied')
          const userMessage: ChatMessage = {
            role: 'user',
            content: option.label,
            timestamp: new Date(),
          }
          setChatHistory(prev => [
            ...prev,
            userMessage,
            {
              role: 'assistant',
              content: 'Thank you for your honesty. The assessment cannot proceed without your consent. Take care!',
              timestamp: new Date(),
            },
          ])
          setLoading(false)
          return
        } else {
          setConsentGiven(true)
          
          // Track consent granted
          if (sessionToken) {
            fetch('/api/analytics/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event_type: 'requester_consent_granted',
                event_data: {
                  session_token: sessionToken,
                },
              }),
            }).catch(err => console.error('Analytics tracking error:', err))
          }
        }
      }

      // Store values for Q2 and Q3
      if (questionIndex === 1 && option.field === 'communication_style') {
        setCommunicationStyle(option.value)
      }
      if (questionIndex === 2 && option.field === 'exclusions') {
        setExclusions(option.value === 'no_exclusions' ? 'none' : option.value)
      }

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: option.label,
        timestamp: new Date(),
      }

      // Handle inserted quick-reply questions (relationship_structure, kink_openness, status_orientation)
      // These are not in the QUESTIONS array, so we need special handling
      if (option.field === 'relationship_structure') {
        // After relationship_structure, show disagreements question (index 4)
        const nextIndex = 4
        const nextQuestion = QUESTIONS[nextIndex]
        setChatHistory(prev => [
          ...prev,
          userMessage,
          {
            role: 'assistant',
            content: nextQuestion,
            timestamp: new Date(),
            quickReplies: undefined, // Disagreements is open-ended
          },
        ])
        setCurrentQuestionIndex(nextIndex)
        setLoading(false)
        return
      }
      
      if (option.field === 'kink_openness') {
        // After kink_openness, show erotic question (index 5)
        const nextIndex = 5
        const nextQuestion = QUESTIONS[nextIndex]
        setChatHistory(prev => [
          ...prev,
          userMessage,
          {
            role: 'assistant',
            content: nextQuestion,
            timestamp: new Date(),
            quickReplies: undefined, // Erotic is open-ended
          },
        ])
        setCurrentQuestionIndex(nextIndex)
        setLoading(false)
        return
      }
      
      if (option.field === 'status_orientation') {
        // After status_orientation, we're done with all questions
        const finalHistory = [...chatHistory, userMessage]
        setChatHistory(finalHistory)
        setLoading(false)
        // Generate assessment immediately (no setTimeout to avoid race conditions)
        generateAssessment(finalHistory, skippedQuestions).catch(err => {
          console.error('Error in generateAssessment:', err)
          setLoading(false)
        })
        return
      }

      // Handle regular quick-reply questions (Q1-Q3: consent, communication_style, exclusions)
      // Move to next question
      const nextIndex = questionIndex + 1
      if (nextIndex < QUESTIONS.length) {
        const nextQuestion = QUESTIONS[nextIndex]
        const nextQuickReplies = QUICK_REPLY_QUESTIONS[nextIndex]
        
        // Update chat history and question index - use functional updates to avoid stale state
        setChatHistory(prev => [
          ...prev,
          userMessage,
          {
            role: 'assistant',
            content: nextQuestion,
            timestamp: new Date(),
            quickReplies: nextQuickReplies || undefined,
          },
        ])
        setCurrentQuestionIndex(nextIndex)
        setLoading(false)
      } else {
        // All questions answered - generate assessment
        setChatHistory(prev => {
          const finalHistory = [...prev, userMessage]
          // Generate assessment after state update completes
          setTimeout(() => {
            generateAssessment(finalHistory, skippedQuestions)
          }, 0)
          return finalHistory
        })
      }
    } catch (error) {
      console.error('Error in handleQuickReplySelect:', error)
      setLoading(false)
    }
  }

  // Check if a question should be skipped based on exclusions
  const shouldSkipQuestion = (questionIndex: number): boolean => {
    const exclusionValue = exclusions || structuredFields.exclusions
    if (!exclusionValue || exclusionValue === 'none' || exclusionValue === 'no_exclusions') return false
    
    const exclusionLower = exclusionValue.toString().toLowerCase()
    
    // Q6 (index 5) is the erotic question - skip if sex/erotic/kink is excluded
    if (questionIndex === 5) {
      const sexRelatedTerms = ['sex', 'sexual', 'erotic', 'intimacy', 'kink', 'kinky']
      return sexRelatedTerms.some(term => exclusionLower.includes(term))
    }
    
    return false
  }

  // Get the next valid question index (skipping excluded questions)
  // Note: We insert quick-reply questions between regular questions
  const getNextQuestionIndex = (currentIndex: number): number | null => {
    let nextIndex = currentIndex + 1
    
    // Skip questions based on exclusions
    while (nextIndex < QUESTIONS.length && shouldSkipQuestion(nextIndex)) {
      nextIndex++
    }
    
    return nextIndex < QUESTIONS.length ? nextIndex : null
  }

  // Get quick replies for current question
  const getCurrentQuickReplies = (questionIndex: number): QuickReplyOption[] | null => {
    return QUICK_REPLY_QUESTIONS[questionIndex] || null
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentMessage.trim() || loading) return

    // Check if current question has quick replies - use same logic as render
    // Priority: last message's quickReplies > getCurrentQuickReplies for current index
    const lastAssistantMessage = chatHistory.filter(m => m.role === 'assistant').pop()
    let currentQuickReplies: QuickReplyOption[] | null = null
    
    if (lastAssistantMessage) {
      // If the last message has quickReplies property explicitly set, use it
      if ('quickReplies' in lastAssistantMessage) {
        currentQuickReplies = lastAssistantMessage.quickReplies || null
      } else {
        // No quickReplies property, fallback to checking current question index
        currentQuickReplies = getCurrentQuickReplies(currentQuestionIndex)
      }
    } else {
      // No messages yet, use current question index
      currentQuickReplies = getCurrentQuickReplies(currentQuestionIndex)
    }

    // If current question has quick replies, don't accept text input (use quick replies instead)
    if (currentQuickReplies) {
      // Try to match typed text to quick reply options (fallback)
      const normalizedMessage = currentMessage.toLowerCase().trim()
      for (const option of currentQuickReplies) {
        if (normalizedMessage === option.value || normalizedMessage === option.label.toLowerCase()) {
          await handleQuickReplySelect(option, currentQuestionIndex)
          setCurrentMessage('')
          return
        }
      }
      // If no match, just return (user should use quick replies)
      return
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
      let historyWithCommentary = [...updatedHistory]
      try {
        const commentaryResponse = await fetch('/api/requester/commentary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionIndex: currentQuestionIndex,
            question: QUESTIONS[currentQuestionIndex],
            answer: currentMessage,
            chatHistory: updatedHistory,
            communicationStyle,
          }),
        })

        if (commentaryResponse.ok) {
          const { commentary } = await commentaryResponse.json()
          if (commentary) {
            historyWithCommentary = [
              ...historyWithCommentary,
              {
                role: 'assistant',
                content: commentary,
                timestamp: new Date(),
              },
            ]
          }
        }
      } catch (error) {
        console.error('Error getting commentary:', error)
      }

      const scriptedNextIndex = currentQuestionIndex + 1
      if (scriptedNextIndex < QUESTIONS.length) {
        setCurrentQuestionIndex(scriptedNextIndex)
        setChatHistory([
          ...historyWithCommentary,
          {
            role: 'assistant',
            content: QUESTIONS[scriptedNextIndex],
            timestamp: new Date(),
          },
        ])
      } else {
        await generateAssessment(historyWithCommentary, new Set<number>())
      }
    } catch (error) {
      console.error('Error in chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAssessment = async (finalChatHistory: ChatMessage[], skipped: Set<number> = new Set()) => {
    setLoading(true)
    try {
      console.log('Calling /api/requester/assess with:', {
        linkId,
        userId,
        chatHistoryLength: finalChatHistory.length,
        skippedQuestions: Array.from(skipped),
        structuredFields,
      })
      
      const response = await fetch('/api/requester/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId,
          userId,
          chatHistory: finalChatHistory,
          skippedQuestions: Array.from(skipped),
          structuredFields: structuredFields, // Include structured fields
          session_token: sessionToken, // Include session token for tracking
          analytics_opt_in: analyticsOptIn, // Requester consent for analytics
          user_lang: 'en',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Assessment received:', { score: data.score, hasRadar: !!data.requesterRadar })
        setAssessment(data)
        setFlowState('results')
        
        // Track completion with assessment ID
        if (sessionToken && startTime) {
          const completionTime = Date.now() - startTime
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'requester_completed',
              event_data: {
                session_token: sessionToken,
                completion_time_ms: completionTime,
                link_id: linkId,
                assessment_id: data.assessmentId,
                analytics_opt_in: analyticsOptIn,
              },
            }),
          }).catch(err => console.error('Analytics tracking error:', err))
        }
      } else {
        // Get response text first to see what we're dealing with
        const responseText = await response.text()
        console.error('Assessment error - Status:', response.status, 'Response:', responseText)
        
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` }
        }
        
        console.error('Assessment error data:', errorData)
        const errorMsg = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`
        alert(`Failed to generate assessment: ${errorMsg}`)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error generating assessment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate assessment'
      console.error('Full error:', error)
      alert(`Error: ${errorMessage}. Please try refreshing the page.`)
      setLoading(false) // Reset loading on network errors
    }
  }

  if (flowState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold mb-4 text-purple-600">Save time, test the vibe</h1>
          <p className="text-gray-700 mb-4 text-lg">
            Just 9 questions. Get clarity if they are worth your time. You keep the results, they can only see them if you want them to.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your responses are analyzed by AI and compared against their profile. No raw data is stored-only compatibility metrics.
          </p>
          
          {/* Analytics consent toggle - privacy-first, default OFF */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={analyticsOptIn}
                onChange={(e) => setAnalyticsOptIn(e.target.checked)}
                className="mt-1 w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I consent to anonymized analytics being used to improve SoulSort (no raw answers stored).
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-7">
              Optional. You can still complete the vibe check without this.
            </p>
          </div>
          
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Start vibe check
          </button>
        </div>
      </div>
    )
  }

  if (flowState === 'consent-denied') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (flowState === 'chat') {
    // Get quick replies from the last assistant message (handles inserted questions too)
    // Priority: last message's quickReplies > getCurrentQuickReplies for current index
    const lastAssistantMessage = chatHistory.filter(m => m.role === 'assistant').pop()
    let currentQuickReplies: QuickReplyOption[] | null = null
    
    if (lastAssistantMessage) {
      // If the last message has quickReplies property explicitly set, use it
      // undefined means no quick replies (open-ended question)
      // null/array means quick replies exist
      if ('quickReplies' in lastAssistantMessage) {
        currentQuickReplies = lastAssistantMessage.quickReplies || null
      } else {
        // No quickReplies property, fallback to checking current question index
        currentQuickReplies = getCurrentQuickReplies(currentQuestionIndex)
      }
    } else {
      // No messages yet, use current question index
      currentQuickReplies = getCurrentQuickReplies(currentQuestionIndex)
    }
    
    const quickReplyField = currentQuickReplies?.[0]?.field
    const hasQuickReplyFieldCaptured = quickReplyField ? !!structuredFields[quickReplyField] : false
    
    return (
      <div className="h-[100dvh] bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-2 sm:px-4 sm:py-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-lg p-3 sm:p-8 flex flex-col h-[100dvh] sm:h-[calc(100dvh-4rem)]">
          <h1 className="text-2xl font-bold mb-4 text-purple-600 dark:text-purple-400">Vibe-check</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            You'll get the best results by answering honestly and reflectively on what feels true for you in this moment.
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-xs">
            You can answer in any language.
          </p>
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Voice language</span>
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value as VoiceLangOption)}
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              <option value="auto">Auto (browser)</option>
              <option value="sv-SE">Svenska</option>
              <option value="ar-SA">Arabic</option>
              <option value="zh-CN">Chinese</option>
              <option value="hi-IN">Hindi</option>
              <option value="en-US">English</option>
              <option value="it-IT">Italiano</option>
              <option value="de-DE">Deutsch</option>
              <option value="fr-FR">Francais</option>
              <option value="es-ES">Espanol</option>
              <option value="pt-PT">Portugues</option>
              <option value="nl-NL">Nederlands</option>
              <option value="fi-FI">Suomi</option>
            </select>
          </div>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto overscroll-contain space-y-4 mb-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-800 dark:text-gray-100'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
                {/* Don't render quick replies in chat history - they're shown below for the current question */}
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

          {/* Show quick replies if current question has them and field not captured */}
          {currentQuickReplies && !hasQuickReplyFieldCaptured && (
            <div className="flex flex-wrap gap-2 mb-3 px-2">
              {currentQuickReplies.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReplySelect(option, currentQuestionIndex)}
                  className="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-full text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors border border-purple-300 dark:border-purple-700"
                  disabled={loading}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleChatSubmit} className="mt-auto flex gap-2 items-end pb-[calc(env(safe-area-inset-bottom)+0.25rem)]">
            <div className="flex-1 flex items-end border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder={
                  currentQuickReplies
                    ? 'Or answer in any language...'
                    : 'Answer in any language...'
                }
                className="flex-1 bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 resize-none overflow-y-auto min-h-[40px] max-h-[140px]"
                disabled={loading}
                autoComplete="off"
                rows={1}
                wrap="soft"
              />
              <button
                type="button"
                onClick={toggleRecording}
                disabled={loading || !recognition}
                className={`ml-2 w-9 h-9 rounded-full flex items-center justify-center text-white ${
                  isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-purple-600 hover:bg-purple-700'
                } disabled:bg-gray-400`}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                title={recognition ? 'Voice input' : 'Voice input unavailable on this browser'}
              >
                {isRecording ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
                    <path d="M12 19v3" />
                  </svg>
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !currentMessage.trim() || currentQuickReplies !== null}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (flowState === 'results' && assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-center text-purple-600">Compatibility Results</h1>

          {/* Summary */}
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-lg mb-3 text-purple-600">Summary</h2>
            <p className="text-gray-700 dark:text-gray-200">{assessment.summary}</p>
          </div>

          {/* Radar Overlay */}
          <div className="mb-8">
            <h2 className="font-semibold text-lg mb-4 text-center text-purple-600">Radar Comparison</h2>
            <RadarOverlay
              userData={assessment.userRadar}
              requesterData={assessment.requesterRadar}
            />
          </div>

          {assessment.showDeepInsights !== false && (
            <DeepInsightsSection
              mode="requester"
              userRadar={assessment.requesterRadar}
              requesterRadar={assessment.userRadar}
              requesterPreferences={assessment.userPreferences || null}
              requesterSignalScores={assessment.userSignalScores || null}
              insightOverrides={assessment.deepInsightsCopy || null}
            />
          )}

          {/* Feedback Section */}
          <FeedbackSection linkId={linkId} />

          {/* CTA to create account */}
          <div className="text-center mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-700 mb-4">
              Want to create your own vibe-check link and see how others match with you?
            </p>
            <a
              href="/login"
              className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Create Your Profile
            </a>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function FeedbackSection({ linkId }: { linkId: string }) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleFeedback = async (value: 'positive' | 'negative') => {
    if (submitted || feedback) return
    
    setFeedback(value)
    
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'compatibility_feedback',
          event_data: {
            link_id: linkId,
            feedback: value,
          },
        }),
      })
      setSubmitted(true)
    } catch (error) {
      console.error('Error tracking feedback:', error)
    }
  }

  if (submitted) {
    return (
      <div className="text-center mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">Thank you for your feedback!</p>
      </div>
    )
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <p className="text-center text-gray-700 mb-4 font-medium">Does the result resonate?</p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => handleFeedback('positive')}
          disabled={feedback !== null}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors border-2 ${
            feedback === 'positive'
              ? 'bg-white text-purple-600 border-purple-600'
              : 'bg-white text-purple-600 border-purple-600 hover:bg-purple-50'
          } disabled:opacity-50`}
        >
          Yeah, that landed
        </button>
        <button
          onClick={() => handleFeedback('negative')}
          disabled={feedback !== null}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors border-2 ${
            feedback === 'negative'
              ? 'bg-white text-purple-600 border-purple-600'
              : 'bg-white text-purple-600 border-purple-600 hover:bg-purple-50'
          } disabled:opacity-50`}
        >
          Hmm, not quite
        </button>
      </div>
    </div>
  )
}


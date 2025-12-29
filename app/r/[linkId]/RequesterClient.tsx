'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RadarOverlay from '@/components/RadarOverlay'
import type { ChatMessage, RadarDimensions, QuickReplyOption } from '@/lib/types'

interface RequesterClientProps {
  linkId: string
  userId: string
}

type FlowState = 'intro' | 'chat' | 'consent-denied' | 'results'

const QUESTIONS = [
  'Do you consent to a short convo to check alignment?',
  'What communication style do you prefer?',
  'Is there anything you do NOT want to discuss?',
  'What are three values you try to practice in your relationships?',
  'How do you like to navigate disagreements or misunderstandings?',
  'What helps you feel erotically connected to someone?',
  'How much do you need and seek freedom in your romantic relationships and what does freedom look like to you?',
]

// Quick-reply configurations for structured questions
const QUICK_REPLY_QUESTIONS: Record<number, QuickReplyOption[]> = {
  // Q1: Consent (yes/no)
  0: [
    { label: 'Yes', value: 'yes', field: 'consent' },
    { label: 'No', value: 'no', field: 'consent' },
  ] as QuickReplyOption[],
  // Q2: Communication style
  1: [
    { label: 'Direct', value: 'direct', field: 'communication_style' },
    { label: 'Playful', value: 'playful', field: 'communication_style' },
    { label: 'Reflective', value: 'reflective', field: 'communication_style' },
    { label: 'Short-answer', value: 'short-answer', field: 'communication_style' },
  ] as QuickReplyOption[],
  // Q3: Exclusions
  2: [
    { label: 'Sex', value: 'sex', field: 'exclusions' },
    { label: 'Past relationships', value: 'past_relationships', field: 'exclusions' },
    { label: 'Kink', value: 'kink', field: 'exclusions' },
    { label: 'No exclusions', value: 'no_exclusions', field: 'exclusions' },
  ] as QuickReplyOption[],
  // Q5: Inserted after Q4 (values) - Relationship structure
  4: [
    { label: 'Monogamous', value: 'monogamous', field: 'relationship_structure' },
    { label: 'Open to ENM', value: 'open_to_enm', field: 'relationship_structure' },
    { label: 'ENM only', value: 'enm_only', field: 'relationship_structure' },
    { label: 'Unsure', value: 'unsure', field: 'relationship_structure' },
  ] as QuickReplyOption[],
  // Q6: Kink openness (before erotic connection question)
  5: [
    { label: 'No', value: 'no', field: 'kink_openness' },
    { label: 'Maybe', value: 'maybe', field: 'kink_openness' },
    { label: 'Yes', value: 'yes', field: 'kink_openness' },
  ] as QuickReplyOption[],
  // Q8: Status orientation (after Q7 - freedom)
  7: [
    { label: 'Low', value: 'low', field: 'status_orientation' },
    { label: 'Medium', value: 'medium', field: 'status_orientation' },
    { label: 'High', value: 'high', field: 'status_orientation' },
  ] as QuickReplyOption[],
}

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
  const [assessment, setAssessment] = useState<{
    score: number
    summary: string
    userRadar: RadarDimensions
    requesterRadar: RadarDimensions
  } | null>(null)
  
  // Analytics tracking
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)

  // Generate session token for anonymous tracking
  const generateSessionToken = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  const handleStart = () => {
    // Track requester start
    const token = generateSessionToken()
    setSessionToken(token)
    setStartTime(Date.now())
    
    // Track analytics event
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'requester_started',
        event_data: {
          link_id: linkId,
          session_token: token,
        },
      }),
    }).catch(err => console.error('Analytics tracking error:', err))
    
    setFlowState('chat')
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
        setChatHistory(prev => [...prev, userMessage])
        setTimeout(() => {
          generateAssessment([...chatHistory, userMessage], skippedQuestions)
        }, 0)
        setLoading(false)
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
      // Get AI commentary for this answer (Q4+ only, Q1-Q3 use quick replies)
      if (currentQuestionIndex > 2) {
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
              setChatHistory(prev => [
                ...prev,
                {
                  role: 'assistant',
                  content: commentary,
                  timestamp: new Date(),
                },
              ])
            }
          }
        } catch (error) {
          console.error('Error getting commentary:', error)
          // Continue even if commentary fails
        }
      }

      // Handle structured field capture from quick replies or typed text
      // Check if the last assistant message had quick replies
      const lastAssistantMessage = chatHistory.filter(m => m.role === 'assistant').pop()
      if (lastAssistantMessage?.quickReplies) {
        // Try to match typed text to quick reply options
        const normalizedMessage = currentMessage.toLowerCase().trim()
        for (const option of lastAssistantMessage.quickReplies) {
          if (normalizedMessage === option.value || normalizedMessage === option.label.toLowerCase() || normalizedMessage.includes(option.value)) {
            setStructuredFields(prev => ({
              ...prev,
              [option.field]: option.value,
            }))
            break
          }
        }
        
        // If we just answered a quick-reply question, move to the next regular question
        const quickReplyField = lastAssistantMessage.quickReplies[0]?.field
        if (quickReplyField && structuredFields[quickReplyField]) {
          // We already captured this field via quick reply button, just continue
        } else if (quickReplyField && !structuredFields[quickReplyField]) {
          // We're answering it now via text, continue to next question after this
          const nextRegularIndex = getNextQuestionIndex(currentQuestionIndex)
          if (nextRegularIndex !== null) {
            // After capturing quick-reply answer, show next regular question
            setTimeout(() => {
              setCurrentQuestionIndex(nextRegularIndex)
              setChatHistory(prev => [
                ...prev,
                {
                  role: 'assistant',
                  content: QUESTIONS[nextRegularIndex],
                  timestamp: new Date(),
                },
              ])
            }, 0)
          }
        }
      }

      // Move to next question or complete
      const nextIndex = getNextQuestionIndex(currentQuestionIndex)
      
      if (nextIndex !== null) {
        // Check if we're skipping any questions between current and next
        for (let i = currentQuestionIndex + 1; i < nextIndex; i++) {
          if (shouldSkipQuestion(i)) {
            setSkippedQuestions(prev => new Set(prev).add(i))
          }
        }
        
        // Check if we need to insert a quick-reply question before the next regular question
        let nextQuestion = QUESTIONS[nextIndex]
        let quickReplies: QuickReplyOption[] | null = null
        
        // Insert structured questions at appropriate points:
        // After Q4 (index 3, just answered) -> relationship_structure (shown as index 4)
        if (currentQuestionIndex === 3 && !structuredFields.relationship_structure) {
          nextQuestion = 'How do you feel about exclusivity in romantic or sexual relationships?'
          quickReplies = QUICK_REPLY_QUESTIONS[4] || null
          // Don't increment question index yet - we'll handle this after answer
        }
        // Before Q6 (index 5 - erotic) -> kink_openness
        else if (nextIndex === 5 && !structuredFields.kink_openness) {
          nextQuestion = 'Are you open to kink/BDSM in your relationships?'
          quickReplies = QUICK_REPLY_QUESTIONS[5] || null
          // Show kink question, then after answer show erotic (index 5)
        }
        // After Q7 (index 6, just answered) -> status_orientation
        else if (currentQuestionIndex === 6 && !structuredFields.status_orientation) {
          nextQuestion = 'How important is status or success when choosing a partner?'
          quickReplies = QUICK_REPLY_QUESTIONS[7] || null
          // Don't increment question index yet
        }
        
        // Only increment index if we're showing a regular question, not a quick-reply question
        if (!quickReplies) {
          setCurrentQuestionIndex(nextIndex)
        }
        
        setChatHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: nextQuestion,
            timestamp: new Date(),
            quickReplies: quickReplies || undefined,
          },
        ])
        
        // If we showed a quick-reply question, the next answer will capture it
        // and then we'll show the next regular question
      } else {
        // All questions answered (including skipped ones) - generate assessment
        // Pass skipped questions info and structured fields to the assessment
        await generateAssessment(updatedHistory, skippedQuestions)
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
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAssessment(data)
        setFlowState('results')
        
        // Track completion
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
        alert(`Failed to generate assessment: ${errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`}`)
      }
    } catch (error) {
      console.error('Error generating assessment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate assessment'
      console.error('Full error:', error)
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (flowState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold mb-4 text-purple-600">Save time, test the vibe</h1>
          <p className="text-gray-700 mb-4 text-lg">
            Just 7 questions. Get clarity if they are worth your time. You keep the results, they can only see them if you want them to.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Your responses are analyzed by AI and compared against their profile. No raw data is stored—only compatibility metrics.
          </p>
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
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 pb-24 sm:pb-12">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-8 flex flex-col" style={{ minHeight: 'calc(100vh - 6rem)', maxHeight: 'calc(100vh - 6rem)' }}>
          <h1 className="text-2xl font-bold mb-4 text-purple-600 dark:text-purple-400">Vibe-check</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            You'll get the best results by answering honestly and reflectively on what feels true for you in this moment.
          </p>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
          <form onSubmit={handleChatSubmit} className="flex gap-2 pb-safe">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder={currentQuickReplies ? "Or type your response..." : "Type your response..."}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !currentMessage.trim() || currentQuickReplies !== null}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
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
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-center text-purple-600">Compatibility Results</h1>
          
          {/* Score */}
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-purple-600 mb-2">
              {assessment.score}%
            </div>
            <p className="text-gray-600">Compatibility Score</p>
          </div>

          {/* Summary */}
          <div className="bg-purple-50 rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-lg mb-3 text-purple-600">Summary</h2>
            <p className="text-gray-700">{assessment.summary}</p>
          </div>

          {/* Radar Overlay */}
          <div className="mb-8">
            <h2 className="font-semibold text-lg mb-4 text-center text-purple-600">Radar Comparison</h2>
            <RadarOverlay
              userData={assessment.userRadar}
              requesterData={assessment.requesterRadar}
            />
          </div>

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
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            feedback === 'positive'
              ? 'bg-green-600 text-white'
              : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-300'
          } disabled:opacity-50`}
        >
          Yeah, that landed
        </button>
        <button
          onClick={() => handleFeedback('negative')}
          disabled={feedback !== null}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            feedback === 'negative'
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300'
          } disabled:opacity-50`}
        >
          Hmm, not quite
        </button>
      </div>
    </div>
  )
}


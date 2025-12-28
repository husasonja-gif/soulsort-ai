'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import type { ChatMessage } from '@/lib/types'

interface OnboardingClientProps {
  userId: string
  skipChat?: boolean
}

type SurveySection = 'dealbreakers' | 'preferences' | 'chat' | 'complete'

export default function OnboardingClient({ userId, skipChat = false }: OnboardingClientProps) {
  const router = useRouter()
  const [section, setSection] = useState<SurveySection>('dealbreakers')
  const [dealbreakers, setDealbreakers] = useState<string[]>([])
  const [preferences, setPreferences] = useState<Record<string, number>>({
    pace: 50,
    connection_chemistry: 50,
    vanilla_kinky: 50,
    open_monogamous: 50,
    boundaries: 50,
  })
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<number>(0)
  const [currentMessage, setCurrentMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatComplete, setChatComplete] = useState(false)

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
    { id: 'pace', label: 'Slow pace', opposite: 'Fast pace' },
    { id: 'connection_chemistry', label: 'Connection first', opposite: 'Chemistry first' },
    { id: 'vanilla_kinky', label: 'Vanilla', opposite: 'Kinky' },
    { id: 'open_monogamous', label: 'Open relationship', opposite: 'Monogamous' },
    { id: 'boundaries', label: 'Easy to set boundaries', opposite: 'Difficulty setting limits' },
  ]

  const chatQuestions = [
    'What are three values you try to practice in your relationships?',
    'How do you like to navigate disagreements or misunderstandings?',
    'What helps you feel erotically connected to someone?',
    'How much do you need and seek freedom in your romantic relationships and what does freedom look like to you?',
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
      const response = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex: currentQuestion,
          question: chatQuestions[currentQuestion],
          answer: currentMessage,
          chatHistory: updatedHistory,
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
            content: chatQuestions[nextQuestion],
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
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 sm:py-12 px-4">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 dark:text-gray-100">Create Your SoulSort Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm sm:text-base">
            {skipChat ? 'Section 1 of 1: Dealbreakers' : 'Section 1 of 2: Dealbreakers'}
          </p>
          <p className="text-base sm:text-lg font-medium mb-6 dark:text-gray-200">
            Check all boxes that would be dealbreakers for you in a partner:
          </p>

          <div className="space-y-3 mb-8">
            {dealbreakerOptions.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={dealbreakers.includes(option)}
                  onChange={() => handleDealbreakerToggle(option)}
                  className="w-5 h-5 text-purple-600 dark:text-purple-400 rounded accent-purple-600 dark:accent-purple-400"
                />
                <span className="flex-1 dark:text-gray-200 text-sm sm:text-base">{option}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleDealbreakersNext}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base"
          >
            Continue to Preferences
          </button>
        </div>
      </div>
    )
  }

  if (section === 'preferences') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 sm:py-12 px-4">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 dark:text-gray-100">Create Your SoulSort Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm sm:text-base">
            {skipChat ? 'Section 1 of 1: Preferences' : 'Section 2 of 2: Preferences'}
          </p>
          <p className="text-base sm:text-lg font-medium mb-6 dark:text-gray-200">
            Use the sliders to select the spot that describes you best:
          </p>

          <div className="space-y-6 mb-8">
            {preferenceLabels.map((pref) => (
              <div key={pref.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{pref.label}</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{pref.opposite}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={preferences[pref.id]}
                  onChange={(e) => handlePreferenceChange(pref.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-400"
                />
                <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {preferences[pref.id]}%
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handlePreferencesNext}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base"
          >
            {skipChat ? 'Complete Profile' : 'Continue to Chat'}
          </button>
        </div>
      </div>
    )
  }

  if (section === 'chat') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 sm:py-12 px-4">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-8 flex flex-col h-[calc(100vh-4rem)] sm:h-[600px]">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 dark:text-gray-100">Let's Chat</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-xs sm:text-sm">
            I'll ask you {chatQuestions.length} questions to understand what matters most to you in relationships.
          </p>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-lg text-sm sm:text-base ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg">
                  <span className="animate-pulse text-gray-600 dark:text-gray-300">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {!chatComplete ? (
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-700 dark:text-gray-100 text-sm sm:text-base"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !currentMessage.trim()}
                className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
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





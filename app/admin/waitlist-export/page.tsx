'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function WaitlistExportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticating, setAuthenticating] = useState(true)
  const [waitlistData, setWaitlistData] = useState<{
    count: number
    emails: string
    csv: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push(`/login?redirect=${encodeURIComponent('/admin/waitlist-export')}`)
        return
      }

      // Admin check is done server-side in the API route
      // Just proceed to load waitlist - API will handle authorization

      setAuthenticating(false)
      loadWaitlist()
    }

    checkAuth()
  }, [router])

  const loadWaitlist = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/waitlist-export')
      if (response.ok) {
        const data = await response.json()
        setWaitlistData(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load waitlist')
      }
    } catch (err) {
      setError('Failed to load waitlist')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const downloadCSV = () => {
    if (!waitlistData) return
    const blob = new Blob([waitlistData.csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-export-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-purple-600 hover:underline"
          >
            ← Back to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-50">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-900">
          Waitlist Export
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-600 mb-8">
          Export waitlist subscribers for email campaigns
        </p>

        {waitlistData && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Total Subscribers</h2>
                <span className="text-2xl font-bold text-purple-600">{waitlistData.count}</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Email List (for Gmail BCC)</h2>
                <button
                  onClick={() => copyToClipboard(waitlistData.emails)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  Copy
                </button>
              </div>
              <textarea
                readOnly
                value={waitlistData.emails}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">CSV Format</h2>
                <button
                  onClick={downloadCSV}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  Download CSV
                </button>
              </div>
              <textarea
                readOnly
                value={waitlistData.csv}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={() => router.push('/')}
            className="text-purple-600 hover:underline"
          >
            ← Back to Homepage
          </button>
        </div>
      </div>
    </div>
  )
}


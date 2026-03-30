'use client'

import { useState } from 'react'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // TODO: Integrate with email service (e.g., Resend, Mailchimp)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900">
        <div className="max-w-md rounded-2xl border border-purple-300/20 bg-white/10 p-8 text-center shadow-lg backdrop-blur-xl">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="mb-4 text-2xl font-bold text-white">You're on the list!</h1>
          <p className="mb-6 text-purple-100/80">
            We'll notify you when new features launch and when we're ready for more users.
          </p>
          <a href="/" className="text-purple-300 hover:underline">Back to home</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-purple-300/20 bg-white/10 p-8 shadow-lg backdrop-blur-xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-white">Join the Waitlist</h1>
        <p className="mb-6 text-center text-purple-100/80">
          Be the first to know about new features and early access.
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-4 w-full rounded-xl border border-purple-300/25 bg-white/90 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:from-fuchsia-600 hover:to-purple-700 disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join Waitlist'}
          </button>
        </form>
      </div>
    </div>
  )
}









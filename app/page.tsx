'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

// CSS for flip cards
const flipCardStyles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  .preserve-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
`

function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setSubmitted(true)
        setEmail('')
      } else {
        setError(data.error || 'Failed to join waitlist')
      }
    } catch (err) {
      setError('Failed to join waitlist. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-2">✨</div>
        <p className="text-purple-600 dark:text-purple-400 font-semibold">You're on the list!</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          We'll notify you when new features launch.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Joining...' : 'Join Waitlist'}
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </form>
  )
}

export default function LandingPage() {
  const [pillHover, setPillHover] = useState<{ [key: string]: boolean }>({})
  const [cardFlipped, setCardFlipped] = useState<{ dating: boolean; festivals: boolean; shared: boolean }>({
    dating: false,
    festivals: false,
    shared: false,
  })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: flipCardStyles }} />
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          SoulSort AI
        </h1>
        <p className="text-2xl sm:text-3xl text-gray-700 dark:text-gray-200 mb-3 max-w-3xl mx-auto font-semibold">
          A vibe-check engine for those who seek & build presence.
        </p>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Create radar. Share link. Compare alignment.
        </p>

        {/* Core Principles */}
        <div className="flex flex-wrap gap-4 justify-center mb-8 text-sm text-gray-600 dark:text-gray-400">
          <span>AI powered</span>
          <span>•</span>
          <span>Privacy First</span>
          <span>•</span>
          <span>Consent-led</span>
          <span>•</span>
          <span>Inclusive</span>
        </div>
      </section>

      {/* Create Your Vibe-Check Section */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
          Create your vibe-check:
        </h2>
        
        {/* Pill Tags */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Link
            href="/login"
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full font-semibold hover:from-purple-700 hover:to-purple-800 transition-all min-w-[180px] text-center"
            onMouseEnter={() => setPillHover({ ...pillHover, dating: true })}
            onMouseLeave={() => setPillHover({ ...pillHover, dating: false })}
          >
            {pillHover.dating ? 'Create profile' : 'Dating'}
          </Link>
          <button
            onClick={() => window.location.href = 'mailto:soulsort.ai.official@gmail.com?subject=Festivals & Events Demo Request'}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full font-semibold hover:from-purple-700 hover:to-purple-800 transition-all min-w-[180px] text-center"
            onMouseEnter={() => setPillHover({ ...pillHover, festivals: true })}
            onMouseLeave={() => setPillHover({ ...pillHover, festivals: false })}
          >
            {pillHover.festivals ? 'Email us' : 'Festivals & Events'}
          </button>
          <div className="px-8 py-3 bg-gradient-to-r from-purple-300 to-purple-400 text-white rounded-full font-semibold cursor-not-allowed min-w-[180px] text-center">
            Shared Spaces (soon)
          </div>
        </div>

        {/* Flip Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {/* Dating Card */}
          <div
            className="group perspective-1000 cursor-pointer"
            onClick={() => setCardFlipped(prev => ({ ...prev, dating: !prev.dating }))}
          >
            <div className={`relative h-64 preserve-3d transition-transform duration-500 ${cardFlipped.dating ? 'rotate-y-180' : ''}`}>
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-500 to-purple-700 opacity-80 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-bold mb-2 text-white">Dating</h3>
                <p className="text-white/90">Save energy. Reduce noise. Reward maturity.</p>
              </div>
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border-2 border-purple-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <p className="text-gray-900">
                  AI asks the questions people usually avoid. You only share what you see. Raw answers not stored.
                </p>
              </div>
            </div>
          </div>

          {/* Festivals & Events Card */}
          <div
            className="group perspective-1000 cursor-pointer"
            onClick={() => setCardFlipped(prev => ({ ...prev, festivals: !prev.festivals }))}
          >
            <div className={`relative h-64 preserve-3d transition-transform duration-500 ${cardFlipped.festivals ? 'rotate-y-180' : ''}`}>
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-pink-500 to-purple-500 opacity-80 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-bold mb-2 text-white">Festivals & Events</h3>
                <p className="text-white/90">Name your culture. Set standards early. Create safer spaces.</p>
              </div>
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border-2 border-purple-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <p className="text-gray-900">
                  AI facilitates at scale. Humans decide. Raw answers encrypted.
                </p>
              </div>
            </div>
          </div>

          {/* Shared Spaces Card */}
          <div
            className="group perspective-1000 cursor-pointer"
            onClick={() => setCardFlipped(prev => ({ ...prev, shared: !prev.shared }))}
          >
            <div className={`relative h-64 preserve-3d transition-transform duration-500 ${cardFlipped.shared ? 'rotate-y-180' : ''}`}>
              <div className="absolute inset-0 backface-hidden opacity-80 rounded-2xl p-6 flex flex-col items-center justify-center text-center" style={{ background: 'linear-gradient(to bottom right, rgb(168, 85, 247), #DD97DB)' }}>
                <h3 className="text-xl font-bold mb-2 text-white">Shared Spaces</h3>
                <p className="text-white/90">Atmosphere isn't accidental. Name care, expectations, boundaries.</p>
              </div>
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border-2 border-purple-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <p className="text-gray-900">
                  In development. Get in touch at <a href="mailto:soulsort.ai.official@gmail.com" className="underline font-semibold text-gray-900">soulsort.ai.official@gmail.com</a>!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-12 bg-white dark:bg-gray-800">
        <h2 className="text-4xl font-bold text-center mb-8 dark:text-gray-100">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
              1
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2 dark:text-gray-100">Create your profile & name your vibe</h3>
            </div>
          </div>
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
              2
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2 dark:text-gray-100">Invite participants or applicants</h3>
            </div>
          </div>
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
              3
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2 dark:text-gray-100">Compare alignment visually</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-6 dark:text-gray-100">Waitlist</h2>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-purple-600" />
              <span className="text-gray-700 dark:text-gray-300">Dating</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-purple-600" />
              <span className="text-gray-700 dark:text-gray-300">Festivals & Events</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-purple-600" />
              <span className="text-gray-700 dark:text-gray-300">Shared Spaces</span>
            </label>
          </div>
          <WaitlistForm />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
            Ready to create your profile? It's fun, easy and informative → <Link href="/login" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">get started for free</Link>
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Questions? Get in touch at <a href="mailto:soulsort.ai.official@gmail.com" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">soulsort.ai.official@gmail.com</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          <Link href="/login" className="text-purple-600 dark:text-purple-400 hover:underline">
            Login
          </Link>
        </div>
        <p>© 2025 SoulSort AI. Privacy-first vibe filtering.</p>
      </footer>
    </div>
    </>
  )
}

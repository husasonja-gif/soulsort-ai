'use client'

import { useState } from 'react'
import Link from 'next/link'

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
        className="flex-1 rounded-xl border border-purple-300/25 bg-white/90 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:from-fuchsia-600 hover:to-purple-700 disabled:opacity-50"
      >
        {loading ? 'Joining...' : 'Join Waitlist'}
      </button>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
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
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_10%,#4c1d95_0%,#1f1634_36%,#0b0a14_72%)]">
        <div className="pointer-events-none absolute -top-24 -left-12 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="pointer-events-none absolute top-24 -right-14 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      {/* Hero Section */}
      <section className="container relative z-10 mx-auto px-4 py-14 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          SoulSort AI
        </h1>
        <p className="text-2xl sm:text-3xl text-purple-50 mb-3 max-w-3xl mx-auto font-semibold">
          A vibe-check engine for those who seek & build presence.
        </p>
        <p className="text-xl text-purple-100/80 mb-8 max-w-2xl mx-auto">
          Create radar. Share link. Compare alignment.
        </p>
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-purple-100 shadow-sm transition-colors hover:bg-white/20"
          >
            Read the SoulSort Blog →
          </Link>
        </div>

      </section>

      {/* Create Your Vibe-Check Section */}
      <section className="container relative z-10 mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-white">
          Create your vibe-check:
        </h2>
        
        {/* Pill Tags */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Link
            href="/login"
            className="px-8 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-full font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all min-w-[180px] text-center"
            onMouseEnter={() => setPillHover({ ...pillHover, dating: true })}
            onMouseLeave={() => setPillHover({ ...pillHover, dating: false })}
          >
            {pillHover.dating ? 'Create profile' : 'Dating'}
          </Link>
          <button
            onClick={() => window.location.href = 'mailto:soulsort.ai.official@gmail.com?subject=Festivals & Events Demo Request'}
            className="px-8 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-full font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all min-w-[180px] text-center"
            onMouseEnter={() => setPillHover({ ...pillHover, festivals: true })}
            onMouseLeave={() => setPillHover({ ...pillHover, festivals: false })}
          >
            {pillHover.festivals ? 'Email us' : 'Festivals & Events'}
          </button>
          <div className="px-8 py-3 bg-white/20 text-purple-100 rounded-full font-semibold cursor-not-allowed min-w-[180px] text-center border border-purple-300/20">
            Shared Spaces (soon)
          </div>
        </div>

        {/* Core Principles */}
        <div className="flex flex-wrap gap-4 justify-center mb-8 text-sm text-purple-100/80">
          <span>AI powered</span>
          <span>•</span>
          <span>Privacy First</span>
          <span>•</span>
          <span>Consent-led</span>
          <span>•</span>
          <span>Inclusive</span>
        </div>

        {/* Flip Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {/* Dating Card */}
          <div
            className="group perspective-1000 cursor-pointer"
            onClick={() => setCardFlipped(prev => ({ ...prev, dating: !prev.dating }))}
          >
            <div className={`relative h-64 preserve-3d transition-transform duration-500 ${cardFlipped.dating ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-md border border-purple-300/20 backdrop-blur-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center mb-3 text-white text-2xl">
                  ♥
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Dating</h3>
                <p className="text-purple-100/80 text-sm max-w-xs">
                  Save energy. Reduce noise. Reward maturity.
                </p>
              </div>
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-md border border-purple-300/20 backdrop-blur-xl">
                <p className="text-purple-50 text-sm">
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
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-md border border-purple-300/20 backdrop-blur-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center mb-3 text-white text-2xl">
                  ✦
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Festivals & Events</h3>
                <p className="text-purple-100/80 text-sm max-w-xs">
                  Name your culture. Set standards early. Create safer spaces.
                </p>
              </div>
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-md border border-purple-300/20 backdrop-blur-xl">
                <p className="text-purple-50 text-sm">
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
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-md border border-purple-300/20 backdrop-blur-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center mb-3 text-white text-2xl">
                  ⌂
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Shared Spaces</h3>
                <p className="text-purple-100/80 text-sm max-w-xs">
                  Atmosphere isn't accidental. Name care, expectations, boundaries.
                </p>
              </div>
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-md border border-purple-300/20 backdrop-blur-xl">
                <p className="text-purple-50 text-sm">
                  In development. Get in touch at{' '}
                  <a
                    href="mailto:soulsort.ai.official@gmail.com"
                    className="underline font-semibold text-purple-100"
                  >
                    soulsort.ai.official@gmail.com
                  </a>
                  !
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container relative z-10 mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto rounded-2xl border border-purple-300/20 bg-white/10 p-8 backdrop-blur-xl">
        <h2 className="text-4xl font-bold text-center mb-8 text-white">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
              1
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2 text-purple-50">Create your profile & name your vibe</h3>
            </div>
          </div>
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
              2
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2 text-purple-50">Invite participants or applicants</h3>
            </div>
          </div>
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
              3
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2 text-purple-50">Compare alignment visually</h3>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="container relative z-10 mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white/10 rounded-2xl border border-purple-300/20 shadow-lg p-8 text-center backdrop-blur-xl">
          <h2 className="text-2xl font-bold mb-6 text-white">Waitlist</h2>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-purple-600" />
              <span className="text-purple-100">Dating</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-purple-600" />
              <span className="text-purple-100">Festivals & Events</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-purple-600" />
              <span className="text-purple-100">Shared Spaces</span>
            </label>
          </div>
          <WaitlistForm />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container relative z-10 mx-auto px-4 py-12 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xl text-purple-50 mb-4">
            Ready to create your profile? It&apos;s fun, easy and informative → <Link href="/login" className="text-purple-300 font-semibold hover:underline">get started for free</Link>
          </p>
          <p className="text-lg text-purple-100/80 mb-6">
            Questions? Get in touch at <a href="mailto:soulsort.ai.official@gmail.com" className="text-purple-300 font-semibold hover:underline">soulsort.ai.official@gmail.com</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container relative z-10 mx-auto px-4 py-8 text-center text-sm text-purple-100/70">
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          <Link href="/login" className="text-purple-300 hover:underline">
            Login
          </Link>
        </div>
        <p>© SoulSort AI. Privacy-first vibe filtering.</p>
        <p className="mt-3 text-xs text-purple-100/30">KVK: 42049281 · VAT: NL005455917B63</p>
      </footer>
    </div>
    </>
  )
}

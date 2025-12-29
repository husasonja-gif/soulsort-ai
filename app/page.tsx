import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          SoulSort AI
        </h1>
        <p className="text-2xl text-gray-700 mb-3 max-w-2xl mx-auto font-semibold">
          Save energy. Reduce noise. Reward maturity.
        </p>
        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          A vibe-check engine designed to prevent selection fatigue. Get informed - let AI ask the important questions.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-8">
          <Link
            href="/login"
            className="px-8 py-4 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors shadow-lg"
          >
            Create Your Profile
          </Link>
        </div>
      </section>

      {/* Trust Mechanisms */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <span className="text-2xl" style={{ filter: 'grayscale(100%) brightness(200%)' }}>🔒</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Privacy first</h3>
            <p className="text-gray-600 text-sm">
              Your raw responses are never stored - only your anonymized scores. 
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-2xl" style={{ filter: 'grayscale(100%) brightness(200%)' }}>✨</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">AI Powered</h3>
            <p className="text-gray-600 text-sm">
              Quick and friendly chat instead of a stale form.
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <span className="text-2xl" style={{ filter: 'grayscale(100%) brightness(200%)' }}>🌈</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Inclusive by design</h3>
            <p className="text-gray-600 text-sm">
              Built for women, queers and good guys who seek real connection.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-12 bg-white">
        <h2 className="text-4xl font-bold text-center mb-8">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
              1
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2">Create your profile</h3>
              <p className="text-gray-600">
                Complete a quick survey and chat with our AI to define your SoulSort radar—your unique fingerprint
              </p>
            </div>
          </div>
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
              2
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2">Share your link</h3>
              <p className="text-gray-600">
                Share your personalized link with someone you’re curious about — a date, a friend, or a room full of people.
              </p>
            </div>
          </div>
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
              3
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2">Check the vibe</h3>
              <p className="text-gray-600">
                See how your values, boundaries, and orientation toward connection align — visually, not performatively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xl text-gray-700 mb-8">
            Ready to create your profile? It's fun, easy and informative → <Link href="/login" className="text-purple-600 font-semibold hover:underline">get started for free</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-gray-600">
        <p>© 2024 SoulSort AI. Privacy-first vibe filtering.</p>
      </footer>
    </div>
  )
}

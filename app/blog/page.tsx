import Link from 'next/link'
import type { Metadata } from 'next'
import { blogPosts } from '@/lib/blogPosts'

export const metadata: Metadata = {
  title: 'SoulSort Blog | AI Dating Apps, Consent, and Connection',
  description:
    'Analysis and stories on AI dating apps, dating app fatigue, AI catfishing, consent in AI dating, and values-based alternatives.',
  alternates: {
    canonical: 'https://soulsortai.com/blog',
  },
}

export default function BlogPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900">
      <div className="pointer-events-none absolute -top-24 -left-12 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -right-14 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

      <div className="container relative z-10 mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              SoulSort AI
            </h1>
          </Link>
          <p className="text-lg sm:text-xl text-gray-300 mt-2">
            Stories about connection, culture, and building better spaces
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="space-y-8">
          {blogPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="block overflow-hidden rounded-2xl border border-purple-300/20 bg-white/10 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-[0_16px_45px_rgba(168,85,247,0.25)] group"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-3 text-sm text-gray-400">
                  <span className="rounded-full bg-gradient-to-r from-fuchsia-500/30 to-violet-500/30 px-3 py-1 text-xs font-semibold text-fuchsia-300">
                    {post.category}
                  </span>
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white group-hover:text-purple-300 transition-colors">
                  {post.title}
                </h2>
                <p className="mb-4 text-gray-300">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    By {post.author}
                  </span>
                  <span className="text-purple-400 font-semibold group-hover:underline">
                    Read more →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {blogPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              No blog posts yet. Check back soon!
            </p>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-white/10 border border-purple-300/20 px-4 py-2 text-purple-300 transition-colors hover:bg-white/20"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}



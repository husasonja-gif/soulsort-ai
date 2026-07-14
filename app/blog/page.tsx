import Link from 'next/link'
import type { Metadata } from 'next'
import { blogPosts } from '@/lib/blogPosts'

export const metadata: Metadata = {
  title: 'SoulSort Blog | High-trust spaces & cultural onboarding',
  description:
    'Stories on event culture, consent at scale, and building better onboarding for raves, festivals, and high-trust communities.',
  alternates: {
    canonical: 'https://soulsortai.com/blog',
  },
}

export default function BlogPage() {
  return (
    <div className="relative min-h-screen bg-[var(--background)]">
      <div className="container relative z-10 mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="mb-12 text-center">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--accent)] glow-accent">
              SoulSort
            </h1>
          </Link>
          <p className="text-lg sm:text-xl text-[var(--muted)] mt-2">
            High-trust spaces, consent culture, and onboarding that scales
          </p>
        </div>

        <div className="space-y-8">
          {blogPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8 transition hover:border-[var(--accent)]/40"
            >
              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                <span className="rounded-full border border-[var(--accent)]/30 px-3 py-1 font-data text-xs text-[var(--accent)]">
                  {post.category}
                </span>
                <span>{post.date}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-[var(--foreground)]">
                {post.title}
              </h2>
              <p className="mb-4 text-[var(--muted)]">{post.excerpt}</p>
              <span className="font-data text-sm text-[var(--accent)]">Read more →</span>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--muted)] transition hover:border-[var(--accent)]"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

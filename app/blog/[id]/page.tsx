'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { useParams } from 'next/navigation'

// Blog post content - you can fetch from a CMS/database
const blogPosts: Record<string, {
  title: string
  content: string
  date: string
  author: string
  category: string
  readTime: string
}> = {
  '1': {
    title: 'Welcome to SoulSort AI',
    content: `# Welcome to SoulSort AI

We're building a vibe-check engine that helps people find authentic connections while respecting privacy and consent.

## What We're Building

SoulSort AI is designed to prevent selection fatigue by asking the important questions upfront. We use AI to facilitate conversations that help people understand alignment before investing energy.

## Our Principles

- **Privacy First**: Your raw responses are never stored - only anonymized scores
- **Consent-led**: Everything is opt-in, transparent, and reversible
- **Inclusive**: Built for women, queers, and good guys who seek real connection
- **Human-centered**: AI facilitates, humans decide

## What's Next

We're expanding into events and shared spaces. Stay tuned for updates!`,
    date: '2025-01-18',
    author: 'SoulSort Team',
    category: 'Product',
    readTime: '3 min read',
  },
}

export default function BlogPostPage() {
  const params = useParams()
  const postId = params.id as string
  const post = blogPosts[postId]

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">Post Not Found</h1>
          <Link href="/blog" className="text-purple-600 dark:text-purple-400 hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <article className="container mx-auto px-4 py-12 sm:py-16 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/blog" className="text-purple-600 dark:text-purple-400 hover:underline mb-4 inline-block">
            ← Back to Blog
          </Link>
          <div className="flex items-center gap-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
              {post.category}
            </span>
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {post.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            By {post.author}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
              {post.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            ← Back to Blog
          </Link>
        </div>
      </article>
    </div>
  )
}


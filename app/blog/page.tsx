'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  readTime: string
}

// Blog posts - you can add more here or fetch from a CMS/database
const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Welcome to SoulSort AI',
    excerpt: 'Discover how we\'re building a vibe-check engine that helps people find authentic connections while respecting privacy and consent.',
    date: '2025-01-18',
    author: 'SoulSort Team',
    category: 'Product',
    readTime: '3 min read',
  },
  // Add more posts here as needed
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              SoulSort AI
            </h1>
          </Link>
          <p className="text-xl text-gray-600 dark:text-gray-300 mt-2">
            Stories about connection, culture, and building better spaces
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="space-y-8">
          {blogPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden group"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                    {post.category}
                  </span>
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    By {post.author}
                  </span>
                  <span className="text-purple-600 dark:text-purple-400 font-semibold group-hover:underline">
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
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No blog posts yet. Check back soon!
            </p>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}



import Link from 'next/link'
import Script from 'next/script'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import { blogPosts, getBlogPostById } from '@/lib/blogPosts'

interface BlogPostPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { id } = await params
  const post = getBlogPostById(id)
  if (!post) {
    return {
      title: 'Post Not Found | SoulSort Blog',
      robots: { index: false, follow: false },
    }
  }

  const canonicalUrl = `https://soulsortai.com/blog/${post.id}`
  const isPrimaryPost = post.id === 'ai-dating-apps-women-queers-product'

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    keywords: isPrimaryPost
      ? [
          'AI dating apps',
          'dating app fatigue',
          'AI catfishing',
          'consent in AI dating',
          'are dating apps using AI without consent',
          'why dating apps feel exhausting',
          'alternatives to Tinder and Hinge',
          'AI surveillance in dating apps',
          'privacy concerns with Bumble AI',
          'authentic dating for queer people',
          'values-based dating',
          'ghosting culture',
          'dating burnout',
          'AI transparency',
        ]
      : ['SoulSort', 'dating compatibility', 'privacy-first dating'],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: isPrimaryPost
        ? 'Are Women & Queers the Product? The AI Dating Dilemma'
        : post.title,
      description: isPrimaryPost
        ? "Dating apps are betting on AI. But as deception scales, trust collapses. Here's why people are leaving—and what SoulSort is building instead."
        : post.excerpt,
      url: canonicalUrl,
      type: 'article',
      images: [
        {
          url: 'https://soulsortai.com/images/blog-ai-dating-cover.jpg',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: ['https://soulsortai.com/images/blog-ai-dating-cover.jpg'],
    },
  }
}

function PrimaryBlogPostContent() {
  return (
    <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
      <p>
        AI dating apps promised better matching, but many daters now report dating app fatigue, burnout, and distrust.
        Men often describe feeling invisible. Women, queers, and sex-positive people often describe a noise problem:
        too much volume, too little sincerity, and too much emotional labor. Add AI catfishing and opaque data
        practices, and the question becomes urgent: are dating apps using AI without consent in ways people never
        truly agreed to?
      </p>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Most People Hate Dating Apps—Here&apos;s Why
        </h2>
        <p>
          This is the contradiction at the core of swipe culture. One side struggles to be seen, the other side is
          overwhelmed by low-quality outreach and ghosting culture. Everyone is doing more effort for less trust.
          That imbalance drives dating burnout and makes authentic connection harder to find.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          The AI Takeover: What&apos;s Changing in 2024-2025
        </h2>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Bumble&apos;s Privacy Stumble</h3>
        <p>
          Privacy advocates have challenged Bumble&apos;s AI features in Europe over consent and transparency
          expectations. This is exactly where consent in AI dating stops being abstract and becomes a product design
          test: are users clearly informed, and can they decline meaningfully?
        </p>
        <p>
          Source:{' '}
          <a
            href="https://noyb.eu/en/bumbles-ai-icebreakers-are-mainly-breaking-eu-law"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            noyb complaint analysis
          </a>
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">
          Match Group&apos;s AI Bet—and Why It Matters
        </h3>
        <p>
          Match Group publicly appointed Spencer Rascoff as CEO and signaled deeper AI integration across its dating
          portfolio. That makes AI transparency and privacy concerns with Bumble AI or Tinder-level platforms a core
          market issue, not a niche one.
        </p>
        <p>
          Source:{' '}
          <a
            href="https://www.reuters.com/technology/match-group-names-spencer-rascoff-ceo-2025-02-04/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            Reuters
          </a>
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">
          The Rise of &quot;Rizz&quot; AI Tools (and AI Catfishing)
        </h3>
        <p>
          A parallel ecosystem now writes messages for users: AI &quot;rizz&quot; assistants, profile optimizers, and
          response generators. When people cannot tell whether they&apos;re speaking to a person or a prompt stack,
          relational trust erodes fast. That is AI catfishing at scale.
        </p>
        <p>
          Source:{' '}
          <a
            href="https://www.scientificamerican.com/article/the-rise-of-ai-chatfishing-in-online-dating-poses-a-modern-turing-test/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            Scientific American
          </a>
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          The Great Exodus: Why Dating Apps Feel Exhausting
        </h2>
        <p>
          Why dating apps feel exhausting is no longer a fringe complaint. People increasingly describe the process as
          transactional admin, not connection. Many are investing more in chosen family, friendships, and values-led
          relationships than in endless swiping.
        </p>
        <p>
          Source:{' '}
          <a
            href="https://www.theguardian.com/lifeandstyle/2024/dec/08/it-feels-like-admin-why-are-people-falling-out-of-love-with-dating-apps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            The Guardian
          </a>
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          SoulSort&apos;s Answer: Leading with Values, Not Deception
        </h2>
        <p>
          SoulSort is built as a values-based alternative to swipe gamification: compatibility through consent,
          emotional clarity, and transparent intent. We care about authentic dating for queer people, women, and
          progressive daters who want depth over performance.
        </p>
        <p>
          If you&apos;re looking for alternatives to Tinder and Hinge that center values alignment, privacy, and honest
          communication, this is where we&apos;re focused.
        </p>
        <p>
          Internal links:{' '}
          <Link href="/" className="text-purple-600 dark:text-purple-400 hover:underline">
            SoulSort homepage
          </Link>
          {' '}•{' '}
          <Link href="/onboarding" className="text-purple-600 dark:text-purple-400 hover:underline">
            Try the compatibility flow
          </Link>
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Is Another AI Tool Really the Solution?</h2>
        <p>
          The honest answer is: maybe, but only if the product architecture rejects deception. AI can facilitate
          reflection, but it should not hide identity, automate emotional labor, or bypass consent.
        </p>
        <p>
          SoulSort is our attempt to align product design with that principle: privacy-first, consent-forward, and
          centered on real relational presence. Because trust is still the core infrastructure of connection.
        </p>
      </section>
    </div>
  )
}

function WelcomePostContent() {
  return (
    <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
      <p>
        We&apos;re building a vibe-check engine that helps people find authentic connections while respecting privacy and
        consent.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">What We&apos;re Building</h2>
      <p>
        SoulSort AI helps reduce selection fatigue by asking high-signal questions upfront. AI facilitates reflection;
        people still make the final call.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Our Principles</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Privacy first</strong>: raw responses are not stored as plain chat logs.</li>
        <li><strong>Consent-led</strong>: opt-in, transparent, reversible patterns.</li>
        <li><strong>Inclusive</strong>: built for women, queers, and people seeking depth.</li>
        <li><strong>Human-centered</strong>: AI supports; humans decide.</li>
      </ul>
    </div>
  )
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id: postId } = await params
  const post = getBlogPostById(postId)
  if (!post) notFound()

  const canonicalUrl = `https://soulsortai.com/blog/${post.id}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline:
      post.id === 'ai-dating-apps-women-queers-product'
        ? 'Are Women & Queers the Product? AI Dating Apps Explained'
        : post.title,
    description:
      post.id === 'ai-dating-apps-women-queers-product'
        ? 'An analysis of AI’s growing role in dating apps, privacy concerns, and the rise of authentic alternatives.'
        : post.excerpt,
    image: 'https://soulsortai.com/images/blog-ai-dating-cover.jpg',
    author: {
      '@type': 'Person',
      name: 'SoulSort Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SoulSort',
      logo: {
        '@type': 'ImageObject',
        url: 'https://soulsortai.com/logo.png',
      },
    },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <article className="container mx-auto px-4 py-12 sm:py-16 max-w-3xl">
        <Script
          id={`blogposting-jsonld-${post.id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

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
            {post.id === 'ai-dating-apps-women-queers-product' ? <PrimaryBlogPostContent /> : <WelcomePostContent />}
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



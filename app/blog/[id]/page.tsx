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
      title: post.seoTitle || post.title,
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
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: ['https://soulsortai.com/images/blog-ai-dating-cover.jpg'],
    },
  }
}

function PrimaryBlogPostContent() {
  return (
    <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
      <section>
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">Most People Hate AI Dating Apps - Here&apos;s Why</h2>
        <p>
          Men describe the experience as exhausting and demoralizing. No matter which premiums they buy, they often
          remain invisible: ignored, unseen, ghosted. Women, queers, and sex-positive profiles face the opposite: too
          much noise, objectification, and emotional labor. It&apos;s a lose-lose setup. And now, as platforms double down
          on AI, the problem is likely getting worse.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">The AI Takeover: What&apos;s Changing</h2>
        <p>
          Since around 2023, dating platforms have been increasingly betting on AI. That shift hasn&apos;t come without
          friction. Bumble, for example, faced a privacy complaint over failing to properly ask for consent in relation
          to its AI conversation starter. It has since announced an attachment-style-informed dating feature that
          collects users&apos; dating history and emotional preference data.
        </p>
        <p>
          On the Match Group side (the company behind Tinder, Hinge, Match.com, OkCupid, Meetic, POF, OurTime, Pairs,
          Salams, BLK, and Chispa), Spencer Rascoff was appointed CEO. Why is this interesting? Rascoff has spoken
          openly about expanding the role of AI in dating products. He also previously served on the board of Palantir
          - a company frequently in the news for AI surveillance and U.S. security controversies.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
          The Rise of &quot;Rizz&quot; AI Tools (and AI Catfishing)
        </h2>
        <p>
          Alongside these platform-level changes, an entire ecosystem of &quot;rizz&quot; or message-writing AI tools has
          emerged. These apps serve hundreds of thousands - if not millions - of users, helping people draft messages
          on their behalf. Many are deceptive by design; relying on the fact that the human on the other side
          doesn&apos;t know they are interacting with machine-assisted communication, or that their personal texts are
          being shared with third-party vendors.
        </p>
        <p>
          The downstream effect of AI catfishing is an even more distrusting, jaded, and fatigued online dating
          population.
        </p>
        <p>And what does a tired population ultimately do?</p>
        <p>It doesn&apos;t get angry.</p>
        <p>It simply leaves the room.</p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
          The Great Exodus: Why People Are Leaving Dating Apps
        </h2>
        <p>
          The great &quot;de-centering&quot; of romantic relationships is already underway. People are increasingly finding
          fulfillment from investing in friendships, chosen family, and non-romantic forms of intimacy. After actively
          dating online as a sex-positive queer woman, I can feel that pull myself.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
          SoulSort&apos;s Answer: Leading with Values, Not Deception
        </h2>
        <p>
          So consider SoulSort a last-hurrah attempt to help people like me get to the real person behind the
          &quot;rizz.&quot; Call me naive, but perhaps leveling the playing field isn&apos;t about optimizing deception.
          Maybe it&apos;s about leading with our values and naming what we believe in. Not to replace conversation, but to
          spark the real ones sooner.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">Is Another AI Tool Really the Solution?</h2>
        <p>The honest answer is: I don&apos;t know.</p>
        <p>
          What I do know is where my own values lie. I am building a product that tries to cater to the pain-points
          of the people, communities and sub-scenes that still believe in the magick of connection. A tool that
          centers privacy, consent and equality as key design principles, rather than as an afterthought.
        </p>
        <p>Because being real and vulnerable are the things that ultimately build trust.</p>
        <p>And trust is what enhances vibes and that real relational presence.</p>
        <p>Lots of love,</p>
        <p>Sonja</p>
      </section>

      <section>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sources mentioned:{' '}
          <a href="https://noyb.eu/en/bumbles-ai-icebreakers-are-mainly-breaking-eu-law" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">noyb</a>
          {' '}•{' '}
          <a href="https://www.reuters.com/technology/match-group-names-spencer-rascoff-ceo-2025-02-04/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Reuters</a>
          {' '}•{' '}
          <a href="https://www.scientificamerican.com/article/the-rise-of-ai-chatfishing-in-online-dating-poses-a-modern-turing-test/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Scientific American</a>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Explore SoulSort:{' '}
          <Link href="/onboarding" className="text-purple-600 dark:text-purple-400 hover:underline">compatibility tool</Link>
        </p>
      </section>
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
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_10%,#f5d0fe_0%,#f3e8ff_28%,#ffffff_58%)] dark:bg-[radial-gradient(circle_at_20%_15%,#581c87_0%,#1f2937_42%,#111827_70%)]">
      <div className="pointer-events-none absolute -top-24 -left-12 h-72 w-72 rounded-full bg-pink-300/30 blur-3xl dark:bg-fuchsia-500/20" />
      <div className="pointer-events-none absolute top-24 -right-14 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl dark:bg-purple-500/20" />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <article className="container relative z-10 mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <Script
          id={`blogposting-jsonld-${post.id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Header */}
        <div className="mb-8">
          <Link href="/blog" className="mb-4 inline-flex items-center rounded-full bg-white/70 px-4 py-2 text-purple-700 transition-colors hover:bg-white dark:bg-gray-900/60 dark:text-purple-300 dark:hover:bg-gray-900/90">
            ← Back to Blog
          </Link>
          <div className="mb-4 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="rounded-full bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 px-3 py-1 text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-300">
              {post.category}
            </span>
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl dark:text-gray-100">
            {post.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            By {post.author}
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-white/60 bg-white/75 p-8 shadow-[0_8px_30px_rgba(168,85,247,0.12)] backdrop-blur-xl dark:border-purple-300/15 dark:bg-gray-900/65 dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:p-12">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <PrimaryBlogPostContent />
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



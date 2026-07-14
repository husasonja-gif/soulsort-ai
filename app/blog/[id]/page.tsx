import Link from 'next/link'
import Script from 'next/script'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { blogPosts, getBlogPostById } from '@/lib/blogPosts'

interface BlogPostPageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ id: post.id }))
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

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    keywords: [
      'cultural onboarding',
      'event consent culture',
      'rave culture mainstream',
      'high-trust spaces',
      'SoulSort PORTAL',
      'event selection tools for organizers',
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.excerpt,
      url: canonicalUrl,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
    },
  }
}

function MagicBlogPostContent() {
  return (
    <div className="space-y-8 leading-relaxed text-[var(--muted)]">
      <p>Atmospheres matter. Presence is life. Vibes make or break a party.</p>
      <p>
        At the surface, an event looks like a success when the music is good and people are dancing, playing, and
        flirting with each other. Those of us who organize these gatherings know — and feel — that there is more at
        play.
      </p>
      <p>
        Shared spaces are dynamic, evolving, breathing ecosystems. Just like a perceptive DJ knows how to listen to
        and converse with a crowd, the crowd knows how to play with energy, tension, and release.
      </p>
      <p>
        This is why good intentions are infectious and can create benevolence at scale. Unfortunately, misaligned
        intentions can just as easily disrupt — and even collapse — that very same vibe.
      </p>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-[var(--foreground)]">
          When Magic Breaks Down: The Structural Problems
        </h2>
        <p>
          Most of the time, this isn&apos;t a &quot;bad people&quot; problem. Events tend to run into the same few structural issues
          when shared-space magic starts to break down:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Unclear norms and expectations — New attendees don&apos;t know the unwritten rules</li>
          <li>Inconsistent or late cultural onboarding — Education often only happens at entry or at the gate, when it&apos;s too late</li>
          <li>A critical mass of ill-informed newcomers — People who haven&apos;t yet learned the dance of respect, consent, and inclusion</li>
          <li>Ill-intentioned participants — Driven by greed, biases, mental health challenges, or substance misuse</li>
        </ul>
        <p>And these problems are becoming systemic.</p>
        <p>
          For the past few years, I&apos;ve watched scenes, spaces, and events I love become more commercial and less
          attentive to inclusion, participation, and consent. Rave culture is appealing to the masses, and more events
          are entering mainstream consciousness.
        </p>
        <p>This is what I call death by success.</p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-[var(--foreground)]">The Retreat vs. The Rebuild</h2>
        <p>So what can we do to protect what we love without excluding new entrants?</p>
        <p>
          Many believe the answer is retreat: going back to the woods, downsizing, keeping things small and
          underground. That is my personal last resort.
        </p>
        <p>
          For those of us who still see the magic of mass events, there is another way forward: becoming more
          organized and intentional about cultural onboarding.
        </p>
        <p>
          Many events already use intake forms, filtering strategies, and gate experiences. I personally love standing
          at the door and asking people about consent awareness. But structurally, this approach comes late in the
          selection process, and its success depends heavily on the pedagogical skills of gate volunteers.
        </p>
        <p>Forms are useful, but cumbersome at scale. When populations grow, important nuance often gets lost in the noise.</p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-[var(--foreground)]">
          SoulSort PORTAL: A New Way to Culturally Onboard
        </h2>
        <p>
          That&apos;s why I created SoulSort PORTAL — hype and onboarding for high-trust spaces, built on behavioural
          assessment instead of dead checkboxes.
        </p>
        <p>It&apos;s designed to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Rehearse real scenarios early — Before people arrive at the gate</li>
          <li>Set the tone from first contact — Make consent culture explicit, not assumed</li>
          <li>Give attendees a profile — Self-knowledge without surveillance framing</li>
          <li>Give organizers aggregate crowd reads — Never individual answers</li>
        </ul>
        <p>
          SoulSort PORTAL isn&apos;t a replacement for gate volunteers or intake forms. It&apos;s infrastructure that helps them
          work better.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-[var(--foreground)]">Building in Community, Not in Isolation</h2>
        <p>
          If this resonates with you — whether you&apos;re an event organizer, a space holder, or someone who cares about
          protecting intimate communities — I&apos;d love to hear from you.
        </p>
        <p>Because the magic is worth protecting.</p>
        <p>Sonja</p>
        <p>
          <Link href="/#organizers" className="font-semibold text-[var(--accent)] underline">
            Bring PORTAL to your space
          </Link>
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
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'SoulSort' },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  }

  return (
    <div className="relative min-h-screen bg-[var(--background)]">
      <article className="container relative z-10 mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <Script
          id={`blogposting-jsonld-${post.id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="mb-8">
          <Link
            href="/blog"
            className="mb-4 inline-flex items-center rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--muted)] transition hover:border-[var(--accent)]"
          >
            ← Back to Blog
          </Link>
          <div className="mb-4 mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            <span className="rounded-full border border-[var(--accent)]/30 px-3 py-1 font-data text-xs text-[var(--accent)]">
              {post.category}
            </span>
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-[var(--foreground)] sm:text-5xl">
            {post.title}
          </h1>
          <p className="text-[var(--muted)]">By {post.author}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 sm:p-12">
          <MagicBlogPostContent />
        </div>

        <div className="mt-12 text-center">
          <Link href="/blog" className="text-[var(--accent)] hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </article>
    </div>
  )
}

import Link from 'next/link'
import Script from 'next/script'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
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
  const isMagicPost = post.id === 'for-the-love-of-magic-event-cultural-onboarding'

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
      : isMagicPost
        ? [
            'cultural onboarding',
            'event consent culture',
            'rave culture mainstream',
            'AI for event organizers',
            'how to culturally onboard event attendees',
            'protecting consent culture at scale',
            'event selection tools for organizers',
            'why rave culture is changing',
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
          remain invisible: ignored, unseen, ghosted. Women, queers, and values-led profiles face the opposite: too
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
          dating online as a queer woman, I can feel that pull myself.
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

function MagicBlogPostContent() {
  return (
    <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
      <p>Atmospheres matter. Presence is life. Vibes make or break a party.</p>
      <p>
        At the surface, an event looks like a success when the music is good and people are dancing, playing, and
        flirting with each other. Those of us who organize these gatherings know - and feel - that there is more at
        play.
      </p>
      <p>
        Shared spaces are dynamic, evolving, breathing ecosystems. Just like a perceptive DJ knows how to listen to
        and converse with a crowd, the crowd knows how to play with energy, tension, and release.
      </p>
      <p>
        This is why good intentions are infectious and can create benevolence at scale. Unfortunately, misaligned
        intentions can just as easily disrupt- and even collapse - that very same vibe.
      </p>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">When Magic Breaks Down: The Structural Problems</h2>
        <p>
          Most of the time, this isn&apos;t a &quot;bad people&quot; problem. Events tend to run into the same few structural issues
          when shared-space magic starts to break down:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Unclear norms and expectations - New attendees don&apos;t know the unwritten rules</li>
          <li>Inconsistent or late cultural onboarding - Education often only happens at entry or at the gate, when it&apos;s too late</li>
          <li>A critical mass of ill-informed newcomers - People who haven&apos;t yet learned the dance of respect, consent, and inclusion</li>
          <li>Ill-intentioned participants - Driven by greed, biases, mental health challenges, or substance misuse</li>
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
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">The Retreat vs. The Rebuild</h2>
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
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">SoulSort: A New Way to Culturally Onboard</h2>
        <p>
          That&apos;s why I created SoulSort - a tool for cultural onboarding, selection, and education, powered by AI.
        </p>
        <p>It&apos;s designed to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Ask the right questions early - Before people arrive at the gate</li>
          <li>Set the tone from first contact - Make consent culture explicit, not assumed</li>
          <li>Flag phobic or exclusionary responses - Surface red flags for human moderators</li>
          <li>Support human judgment, not replace it - Give organizers better data to make informed decisions</li>
        </ul>
        <p>
          SoulSort isn&apos;t a replacement for gate volunteers or intake forms. It&apos;s infrastructure that helps them work
          better.
        </p>
        <p>
          Think of it as pre-flight checks for shared spaces. Just like a pilot reviews systems before takeoff, event
          organizers can use SoulSort to assess cultural fit before someone enters the space.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">Why AI? Why Now?</h2>
        <p>Some will ask: Isn&apos;t adding AI to events the problem, not the solution?</p>
        <p>
          I understand the concern. AI has been weaponized to surveil, manipulate, and extract value from communities.
          That&apos;s not what this is.
        </p>
        <p>SoulSort is built on three core principles:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Privacy-first: No data is sold or shared. Responses are encrypted. Organizers see only what they need to make selection decisions.</li>
          <li>Consent-forward: Participants know they&apos;re being assessed and why. Transparency and explicit consent are baked in.</li>
          <li>Human-centered: AI asks the questions, but humans make the final call. This is augmentation, not automation.</li>
        </ul>
        <p>
          The alternative to intentional AI use isn&apos;t &quot;no AI&quot; - it&apos;s unintentional AI. It&apos;s people using ChatGPT to
          write fake intake form responses. It&apos;s organizers drowning in thousands of unstructured Google Form
          submissions with no way to spot patterns.
        </p>
        <p>If we&apos;re going to scale consent culture, we need better tools. SoulSort is my attempt to build one.</p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">Building in Community, Not in Isolation</h2>
        <p>
          I&apos;m building this consciously and slowly, grounded in lived experience and continuous feedback.
        </p>
        <p>
          I&apos;ve spent years attending raves, intimate events, and queer gatherings. I&apos;ve seen what happens when
          spaces grow without intentional cultural scaffolding. I&apos;ve also seen the magic that&apos;s possible when
          organizers get selection right.
        </p>
        <p>This tool exists because I needed it. Because my community needed it.</p>
        <p>
          If this resonates with you - whether you&apos;re an event organizer, a space holder, or someone who cares about
          protecting intimate communities - I&apos;d love to hear from you.
        </p>
        <p>Reach out. Share your experiences. Help shape what this becomes.</p>
        <p>Because the magic is worth protecting.</p>
        <p>Sonja</p>
        <p>
          <Link href="/" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
            Try SoulSort
          </Link>
        </p>
      </section>

      <section>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Back to{' '}
          <Link href="/blog" className="text-purple-600 dark:text-purple-400 hover:underline">the blog index</Link>
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
      name: post.id === 'for-the-love-of-magic-event-cultural-onboarding' ? 'Sonja' : 'SoulSort Team',
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900">
      <div className="pointer-events-none absolute -top-24 -left-12 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -right-14 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      <article className="container relative z-10 mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <Script
          id={`blogposting-jsonld-${post.id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Header */}
        <div className="mb-8">
          <Link href="/blog" className="mb-4 inline-flex items-center rounded-full bg-white/10 border border-purple-300/20 px-4 py-2 text-purple-300 transition-colors hover:bg-white/20">
            ← Back to Blog
          </Link>
          <div className="mb-4 flex items-center gap-3 text-sm text-gray-400 mt-4">
            <span className="rounded-full bg-gradient-to-r from-fuchsia-500/30 to-violet-500/30 px-3 py-1 text-xs font-semibold text-fuchsia-300">
              {post.category}
            </span>
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            {post.title}
          </h1>
          <p className="text-gray-400">
            By {post.author}
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-purple-300/20 bg-white/10 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:p-12">
          <div className="prose prose-lg prose-invert prose-p:my-5 prose-p:leading-8 prose-headings:mb-4 prose-headings:mt-10 prose-headings:text-white prose-p:text-gray-300 prose-a:text-purple-400 prose-strong:text-white max-w-none">
            {post.id === 'for-the-love-of-magic-event-cultural-onboarding' ? (
              <MagicBlogPostContent />
            ) : (
              <PrimaryBlogPostContent />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="text-purple-400 hover:underline"
          >
            ← Back to Blog
          </Link>
        </div>
      </article>
    </div>
  )
}



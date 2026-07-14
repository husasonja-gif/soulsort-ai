export interface BlogPostSummary {
  id: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  readTime: string
  seoTitle?: string
  seoDescription?: string
}

export const blogPosts: BlogPostSummary[] = [
  {
    id: 'for-the-love-of-magic-event-cultural-onboarding',
    title: 'For the Love of Magic: Why Event Culture Needs Better Cultural Onboarding',
    excerpt:
      "Rave culture is going mainstream, but consent culture isn't scaling with it. Here's why event organizers need intentional cultural onboarding - and how AI can help protect the magic.",
    date: '2025-02-27',
    author: 'Sonja',
    category: 'Events',
    readTime: '8 min read',
    seoTitle: 'For the Love of Magic: Why Event Culture Needs Better Cultural Onboarding',
    seoDescription:
      "Rave culture is going mainstream, but consent culture isn't scaling with it. Here's why event organizers need intentional cultural onboarding - and how AI can help protect the magic.",
  },
]

export function getBlogPostById(id: string): BlogPostSummary | undefined {
  return blogPosts.find((post) => post.id === id)
}

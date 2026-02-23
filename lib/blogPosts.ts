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
    id: 'ai-dating-apps-women-queers-product',
    title: 'Are Women & Queers the Product? The Hidden Cost of AI Dating Apps',
    excerpt:
      'Most people hate dating apps. As AI takes over, trust keeps falling. A deep dive into dating app fatigue, AI catfishing, consent failures, and what comes next.',
    date: '2025-02-24',
    author: 'SoulSort Team',
    category: 'Culture',
    readTime: '8 min read',
    seoTitle: 'Are Women & Queers the Product? AI Dating Apps and Connection',
    seoDescription:
      'Most people hate dating apps. As AI takes over platforms like Bumble and Tinder, are we losing trust—or just leaving? A deep dive into AI catfishing, consent failures, and what comes next.',
  },
  {
    id: 'welcome-to-soulsort-ai',
    title: 'Welcome to SoulSort AI',
    excerpt:
      "Discover how we're building a vibe-check engine that helps people find authentic connections while respecting privacy and consent.",
    date: '2025-01-18',
    author: 'SoulSort Team',
    category: 'Product',
    readTime: '3 min read',
    seoTitle: 'Welcome to SoulSort AI',
    seoDescription:
      "Discover SoulSort AI's privacy-first compatibility approach for authentic, consent-forward dating.",
  },
]

export function getBlogPostById(id: string): BlogPostSummary | undefined {
  return blogPosts.find((post) => post.id === id)
}

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
    title: 'Are women & queers the product? AI Dating Apps and Connection',
    excerpt:
      'Most people hate AI dating apps. Here is why.',
    date: '2025-02-24',
    author: 'SoulSort Team',
    category: 'Culture',
    readTime: '8 min read',
    seoTitle: 'Are Women & Queers the Product? AI Dating Apps and Connection',
    seoDescription:
      'Most people hate dating apps. As AI takes over platforms like Bumble and Tinder, are we losing trust—or just leaving? A deep dive into AI catfishing, consent failures, and what comes next.',
  },
]

export function getBlogPostById(id: string): BlogPostSummary | undefined {
  return blogPosts.find((post) => post.id === id)
}

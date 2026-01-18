/**
 * Calculate OpenAI API costs based on model and token usage
 * Pricing as of 2024 (gpt-4o-mini)
 */

interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

// Pricing per 1M tokens (as of 2024)
const PRICING = {
  'gpt-4o-mini': {
    prompt: 0.15 / 1_000_000, // $0.15 per 1M input tokens
    completion: 0.60 / 1_000_000, // $0.60 per 1M output tokens
  },
  'gpt-4o': {
    prompt: 2.50 / 1_000_000, // $2.50 per 1M input tokens
    completion: 10.00 / 1_000_000, // $10.00 per 1M output tokens
  },
  'gpt-4-turbo': {
    prompt: 10.00 / 1_000_000, // $10.00 per 1M input tokens
    completion: 30.00 / 1_000_000, // $30.00 per 1M output tokens
  },
} as const

export function calculateOpenAICost(
  model: string,
  usage: TokenUsage
): number {
  const modelKey = model as keyof typeof PRICING
  const pricing = PRICING[modelKey]
  
  if (!pricing) {
    console.warn(`Unknown model pricing for ${model}, using gpt-4o-mini pricing`)
    const fallbackPricing = PRICING['gpt-4o-mini']
    return (
      usage.prompt_tokens * fallbackPricing.prompt +
      usage.completion_tokens * fallbackPricing.completion
    )
  }
  
  return (
    usage.prompt_tokens * pricing.prompt +
    usage.completion_tokens * pricing.completion
  )
}





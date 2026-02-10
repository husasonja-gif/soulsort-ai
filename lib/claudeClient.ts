// Claude API client for SoulSort V4
// Replaces OpenAI with Claude Sonnet 4.5

import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
})

export const CURRENT_MODEL_VERSION = 'claude-sonnet-4-20250514' // Claude Sonnet 4.5
export const CURRENT_SCORING_VERSION = 'v4.0-claude'
export const CURRENT_SCHEMA_VERSION = 4

export { claude }

/**
 * Convert OpenAI-style messages to Claude format
 * Claude uses a different message structure with separate system and messages
 */
export function convertMessagesToClaude(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): { system?: string; messages: Anthropic.MessageParam[] } {
  // Claude separates system messages
  const systemMessage = messages.find(m => m.role === 'system')?.content
  const conversationMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })) as Anthropic.MessageParam[]

  return {
    ...(systemMessage ? { system: systemMessage } : {}),
    messages: conversationMessages,
  }
}

/**
 * Calculate Claude API cost (approximate, based on current pricing)
 * Claude Sonnet 4.5 pricing (as of 2025):
 * - Input: $3.00 per 1M tokens
 * - Output: $15.00 per 1M tokens
 */
export function calculateClaudeCost(
  model: string,
  usage: { input_tokens: number; output_tokens: number }
): number {
  const inputCostPerMillion = 3.0
  const outputCostPerMillion = 15.0

  const inputCost = (usage.input_tokens / 1_000_000) * inputCostPerMillion
  const outputCost = (usage.output_tokens / 1_000_000) * outputCostPerMillion

  return inputCost + outputCost
}

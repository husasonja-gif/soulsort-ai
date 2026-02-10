// Unified LLM usage tracking (supports both OpenAI and Claude)
import { createSupabaseServerClient } from './supabaseServer'
import { calculateOpenAICost } from './openaiCost'
import { calculateClaudeCost } from './claudeClient'

interface TokenUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  // Claude uses different field names
  input_tokens?: number
  output_tokens?: number
}

interface TrackUsageParams {
  userId?: string | null
  linkId?: string | null
  requesterSessionId?: string | null
  endpoint: string
  model: string
  usage: TokenUsage
  responseTimeMs: number
  success?: boolean
  errorMessage?: string | null
}

export async function trackLLMUsage(params: TrackUsageParams): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Normalize token usage (handle both OpenAI and Claude formats)
    const promptTokens = params.usage.prompt_tokens || params.usage.input_tokens || 0
    const completionTokens = params.usage.completion_tokens || params.usage.output_tokens || 0
    const totalTokens = params.usage.total_tokens || (promptTokens + completionTokens)
    
    // Calculate cost based on provider
    const isClaude = params.model.includes('claude')
    const cost = isClaude
      ? calculateClaudeCost(params.model, { input_tokens: promptTokens, output_tokens: completionTokens })
      : calculateOpenAICost(params.model, { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: totalTokens })
    
    await supabase.from('openai_usage').insert({
      user_id: params.userId || null,
      link_id: params.linkId || null,
      requester_session_id: params.requesterSessionId || null,
      endpoint: params.endpoint,
      model: params.model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost_usd: cost,
      response_time_ms: params.responseTimeMs,
      success: params.success !== false,
      error_message: params.errorMessage || null,
    })
  } catch (error) {
    // Don't throw - analytics tracking shouldn't break the main flow
    console.error('Error tracking LLM usage:', error)
  }
}

// Legacy function name for backward compatibility
export const trackOpenAIUsage = trackLLMUsage


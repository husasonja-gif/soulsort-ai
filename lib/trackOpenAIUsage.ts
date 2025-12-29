import { createSupabaseServerClient } from './supabaseServer'
import { calculateOpenAICost } from './openaiCost'

interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
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

export async function trackOpenAIUsage(params: TrackUsageParams): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient()
    
    await supabase.from('openai_usage').insert({
      user_id: params.userId || null,
      link_id: params.linkId || null,
      requester_session_id: params.requesterSessionId || null,
      endpoint: params.endpoint,
      model: params.model,
      prompt_tokens: params.usage.prompt_tokens,
      completion_tokens: params.usage.completion_tokens,
      total_tokens: params.usage.total_tokens,
      cost_usd: calculateOpenAICost(params.model, params.usage),
      response_time_ms: params.responseTimeMs,
      success: params.success !== false,
      error_message: params.errorMessage || null,
    })
  } catch (error) {
    // Don't throw - analytics tracking shouldn't break the main flow
    console.error('Error tracking OpenAI usage:', error)
  }
}


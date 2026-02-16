import { claude, CURRENT_MODEL_VERSION, convertMessagesToClaude } from '@/lib/claudeClient'
import type { DeepInsightArea } from '@/lib/deepInsights'

export type DeepInsightsCopy = Record<string, string>

function fallbackCopy(areas: DeepInsightArea[]): DeepInsightsCopy {
  return Object.fromEntries(areas.map((area) => [area.id, area.insight]))
}

function sanitizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 420)
}

function parseClaudeJson(content: string): { insights?: Record<string, unknown> } {
  const trimmed = content.trim()
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(withoutFences)
  } catch {
    const start = withoutFences.indexOf('{')
    const end = withoutFences.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(withoutFences.slice(start, end + 1))
    }
    throw new Error('No valid JSON object found in Deep Insights copy response')
  }
}

export async function generateDeepInsightsCopy(
  mode: 'user' | 'requester',
  areas: DeepInsightArea[]
): Promise<DeepInsightsCopy> {
  if (!process.env.CLAUDE_API_KEY || areas.length === 0) {
    return fallbackCopy(areas)
  }

  const fallback = fallbackCopy(areas)
  const compactAreas = areas.map((area) => ({
    id: area.id,
    title: area.title,
    leftLabel: area.leftLabel,
    rightLabel: area.rightLabel,
    youValue: Math.round(area.youValue),
    themValue: typeof area.themValue === 'number' ? Math.round(area.themValue) : undefined,
    bandWidth: Math.max(0, Math.round((area.zoneEnd ?? area.youValue) - (area.zoneStart ?? area.youValue))),
    themBandWidth:
      typeof area.themZoneEnd === 'number' && typeof area.themZoneStart === 'number'
        ? Math.max(0, Math.round(area.themZoneEnd - area.themZoneStart))
        : undefined,
    descriptor: area.descriptor,
    secondary:
      area.secondary &&
      typeof area.secondary === 'object' && {
        leftLabel: area.secondary.leftLabel,
        rightLabel: area.secondary.rightLabel,
        youValue: Math.round(area.secondary.youValue),
        themValue:
          typeof area.secondary.themValue === 'number' ? Math.round(area.secondary.themValue) : undefined,
      },
  }))

  const systemPrompt = `You write SoulSort Deep Insights body copy.

Rules:
- Titles and bands are fixed; write only body copy for each area id.
- Return ONLY valid JSON: {"insights":{"<id>":"<text>"}}.
- Each text is 2-3 sentences, plain language, reflective, concrete, insight-led.
- Tone is descriptive and human, not instructional. Avoid "Try this", "Do this", checklist language, or commands.
- No diagnosis, no moralizing, no pathologizing, no absolutes, no emojis.
- Ground each text in score position, band width, and descriptor.
- If mode=user: write about "you".
- If mode=requester: write enmeshed comparison language about "you" and "they" together.
- Max 420 characters per text.`

  const userPrompt = `Mode: ${mode}
Areas:
${JSON.stringify(compactAreas, null, 2)}

Generate one body copy string per area id.`

  try {
    const claudeMessages = convertMessagesToClaude([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    const response = await claude.messages.create({
      model: CURRENT_MODEL_VERSION,
      max_tokens: 2200,
      temperature: 0.35,
      ...claudeMessages,
    })

    const content = response.content[0]?.type === 'text' ? response.content[0].text : ''
    if (!content) return fallback

    let parsed: { insights?: Record<string, unknown> } = {}
    try {
      parsed = parseClaudeJson(content)
    } catch {
      return fallback
    }

    const merged = Object.fromEntries(
      areas.map((area) => {
        const raw = parsed?.insights?.[area.id]
        const cleaned = typeof raw === 'string' ? sanitizeText(raw) : ''
        return [area.id, cleaned || fallback[area.id]]
      })
    )

    return merged
  } catch (error) {
    console.error('Error generating deep insights copy:', error)
    return fallback
  }
}


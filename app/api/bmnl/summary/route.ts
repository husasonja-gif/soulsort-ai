import { NextResponse } from 'next/server'
import { claude, CURRENT_MODEL_VERSION, convertMessagesToClaude } from '@/lib/claudeClient'
import type { ChatMessage } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { participant_id, radar, answers } = body

    if (!radar) {
      return NextResponse.json(
        { error: 'Radar profile required' },
        { status: 400 }
      )
    }

    // Check for garbage/gaming/phobic flags or signals - if present, return generic message
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (serviceRoleKey && supabaseUrl && participant_id) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
      
      // Check for flags (more reliable)
      const { data: flags } = await supabaseAdmin
        .from('bmnl_flags')
        .select('flag_type')
        .eq('participant_id', participant_id)
        .in('flag_type', ['garbage', 'gaming', 'phobic'])
      
      // Also check signals directly (in case flags weren't created)
      const { data: signals } = await supabaseAdmin
        .from('bmnl_signals')
        .select('is_garbage, is_gaming, is_phobic')
        .eq('participant_id', participant_id)
      
      // If any garbage/gaming/phobic flags or signals exist, return generic message
      const hasFlag = flags && flags.length > 0
      const hasSignal = signals && signals.some(s => s.is_garbage || s.is_gaming || s.is_phobic)
      
      if (hasFlag || hasSignal) {
        return NextResponse.json({
          success: true,
          summary: 'Unfortunately, the system was unable to verify your responses and provide an accurate result. A human will be in touch with you to discuss further.',
        })
      }
    }

    if (!process.env.CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      )
    }

    // Build summary prompt
    const systemPrompt = `You are a cultural onboarding assistant for Burning Man Netherlands. Generate a personalized summary that:
- Identifies 2-3 specific strengths based on their radar profile
- Explicitly identifies 2-3 growth areas/opportunities where they can develop - be clear and direct about what needs work
- Uses a relaxed, friendly, conversational tone — warm but not overly casual or "street"
- CRITICAL: Never use organizational/clinical terms like "consent literacy", "inclusion awareness", "self-regulation", "communal responsibility", "openness to learning", "participation" as technical terms
- Instead use natural, accessible language:
  * "consent literacy" → "how you handle asking permission and reading social cues"
  * "inclusion awareness" → "how you make space for everyone"
  * "self-regulation" → "how you handle yourself when things get intense"
  * "communal responsibility" → "how you contribute to and look out for the community"
  * "openness to learning" → "how open you are to feedback and growth"
  * "participation" → "how much you show up and contribute"
- Example phrasing: "Vibes really matter to us, and how you ask for permission can make or break a moment of magic. If you're unsure about how to behave, join the workshops, listen, learn and overcommunicate rather than assume."
- Never mention "low", "emerging", "stable", "mastering", "medium levels", or similar technical terms
- Never use phrases like "your radar shows" or "according to your profile"
- CRITICAL: Never mention "gate experience" or "basic gate experience" unless explicitly told the person needs orientation at the gate. This cultural check happens BEFORE the gate, never after.
- Be specific to their profile (don't be generic)
- For growth areas, be explicit and direct: "One area to focus on is..." or "You'll want to pay attention to..." 
- Focuses on actionable guidance for participating in the event
- Keeps it to 2-3 short paragraphs maximum

Tone: Relaxed, friendly, warm, conversational. Like a helpful guide who knows the community well, not overly casual or trying too hard.`

    // Map radar axes to street-friendly descriptions
    const axisMapping: Record<string, string> = {
      participation: 'how much you show up and contribute',
      consent_literacy: 'how you handle vibes and asking permission',
      communal_responsibility: 'how you look out for the community',
      inclusion_awareness: 'how you make space for everyone',
      self_regulation: 'how you handle yourself when things get intense',
      openness_to_learning: 'how open you are to feedback and growth',
    }

    const radarDescription = Object.entries(radar)
      .filter(([key]) => key !== 'gate_experience')
      .map(([axis, level]) => {
        const friendlyAxis = axisMapping[axis] || axis.replace(/_/g, ' ')
        return `${friendlyAxis}: ${level}`
      })
      .join(', ')

    // Only mention gate experience if they need orientation (this happens BEFORE the gate, not after)
    const gateExperienceNote = radar.gate_experience === 'needs_orientation' 
      ? `\n\nIMPORTANT: This person needs extra attention at the gate. They should receive orientation before entering.`
      : ''

    const userPrompt = `Radar Profile:
${radarDescription}${gateExperienceNote}

Generate a relaxed, friendly summary. Be explicit about 2-3 growth areas where they need to focus. Use natural language, avoid organizational terms, never mention technical levels. Be specific about their strengths and clearly identify what they should work on.

CRITICAL: Only mention gate experience if the person needs orientation at the gate. This cultural check happens BEFORE the gate, never after. Do NOT mention "gate experience" or "basic gate experience" unless they need orientation.`

    const claudeMessages = convertMessagesToClaude([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])
    
    const completion = await claude.messages.create({
      model: CURRENT_MODEL_VERSION,
      max_tokens: 300,
      temperature: 0.8,
      ...claudeMessages,
    })

    const summary = completion.content[0].type === 'text' ? completion.content[0].text.trim() : ''

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error) {
    console.error('Error generating summary:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to generate summary', details: errorMessage },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import type { ChatMessage } from '@/lib/types'

// Debug endpoint to extract and show onboarding answers
// This helps verify the extraction logic is working correctly
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the most recent onboarding completion attempt
    // Since we don't store chat history, we'll need to reconstruct from the API route
    // For now, this endpoint shows how to extract answers from a chat history
    
    const onboardingQuestions = [
      'What are three values you try to practice in your relationships?',
      'How do you like to navigate disagreements or misunderstandings?',
      'What helps you feel erotically connected to someone?',
      'How much do you need and seek freedom in your romantic relationships and what does freedom look like to you?',
    ]

    return NextResponse.json({
      message: 'To see extracted answers, check your server console logs during onboarding completion.',
      instructions: [
        '1. Complete the onboarding flow',
        '2. Check the terminal/console where your Next.js dev server is running',
        '3. Look for the log: "Extracted onboarding answers:"',
        '4. The answers will be shown as Q1, Q2, Q3, Q4 with the first 100 characters of each',
      ],
      questions: onboardingQuestions,
      note: 'Raw chat answers are not stored in the database (GDPR compliance). They are only logged during profile generation.',
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve debug info' },
      { status: 500 }
    )
  }
}


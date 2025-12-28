import { NextResponse } from 'next/server'
import { generateUserRadarProfile } from '@/lib/llm'
import { upsertUserRadarProfile, completeOnboarding } from '@/lib/db'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import type { ChatMessage } from '@/lib/types'

export async function POST(request: Request) {
  try {
    console.log('Starting onboarding completion...')
    const { userId, dealbreakers, preferences, chatHistory } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    console.log('User ID:', userId)
    console.log('Dealbreakers:', dealbreakers)
    console.log('Preferences:', preferences)
    console.log('Chat history length:', chatHistory?.length)

    // Combine survey data for radar generation
    const surveyData = {
      dealbreakers: Array.isArray(dealbreakers) ? dealbreakers : [],
      preferences: preferences || {},
    }

    // Validate chat history has all 4 questions answered
    const userAnswers = (chatHistory as ChatMessage[]).filter(m => m.role === 'user')
    console.log('User answers count:', userAnswers.length)
    if (userAnswers.length < 4) {
      return NextResponse.json(
        { error: 'All 4 chat questions must be answered' },
        { status: 400 }
      )
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Ensure user profile exists (in case trigger didn't fire)
    const supabase = await createSupabaseServerClient()
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !user.email) {
        return NextResponse.json(
          { error: 'User not found in auth system' },
          { status: 404 }
        )
      }

      // Create user profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: user.email,
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to create user profile', details: profileError.message },
          { status: 500 }
        )
      }
      console.log('Created missing user profile for:', userId)
    }

    console.log('Generating radar profile...')
    // Generate radar profile from survey and chat
    const profile = await generateUserRadarProfile(surveyData, chatHistory as ChatMessage[])
    console.log('Profile generated:', profile)

    console.log('Saving to database...')
    // Extract chart values from the profile
    const chart = profile.chart
    // Save to database
    await upsertUserRadarProfile(
      userId,
      {
        self_transcendence: chart.Self_Transcendence,
        self_enhancement: chart.Self_Enhancement,
        rooting: chart.Rooting,
        searching: chart.Searching,
        relational: chart.Relational,
        erotic: chart.Erotic,
        consent: chart.Consent,
      },
      profile.dealbreakers
    )
    console.log('Profile saved to database')

    console.log('Marking onboarding as complete...')
    // Mark onboarding as complete
    await completeOnboarding(userId)
    console.log('Onboarding marked as complete')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
    
    // Extract error message properly
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      // Try to extract message from error object
      errorMessage = (error as any).message || (error as any).error || JSON.stringify(error)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to complete onboarding',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}





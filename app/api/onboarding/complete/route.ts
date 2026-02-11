import { NextResponse } from 'next/server'
import { generateUserRadarProfile } from '@/lib/llm'
import { upsertUserRadarProfile, completeOnboarding } from '@/lib/db'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import type { ChatMessage } from '@/lib/types'
import { DATING_QUESTION_COUNT } from '@/lib/datingQuestions'

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

    // Validate chat history has all required chat questions answered
    const userAnswers = (chatHistory as ChatMessage[]).filter(m => m.role === 'user')
    console.log('User answers count:', userAnswers.length)
    if (userAnswers.length < DATING_QUESTION_COUNT) {
      return NextResponse.json(
        { error: `All ${DATING_QUESTION_COUNT} chat questions must be answered` },
        { status: 400 }
      )
    }

    // Check Claude API key
    if (!process.env.CLAUDE_API_KEY) {
      console.error('Claude API key not configured')
      return NextResponse.json(
        { error: 'Claude API key not configured' },
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
    const profile = await generateUserRadarProfile(surveyData, chatHistory as ChatMessage[], userId, null)
    console.log('Profile generated:', profile)

    console.log('Saving to database...')
    // Extract chart values from the profile
    const chart = profile.chart
    const v4Axes = profile.axis_scores
      ? {
          meaning_values: Math.round(profile.axis_scores.meaning_values * 100),
          regulation_nervous_system: Math.round(profile.axis_scores.regulation_nervous_system * 100),
          erotic_attunement: Math.round(profile.axis_scores.erotic_attunement * 100),
          autonomy_orientation: Math.round(profile.axis_scores.autonomy_orientation * 100),
          consent_orientation: Math.round(profile.axis_scores.consent_orientation * 100),
          conflict_repair: Math.round(profile.axis_scores.conflict_repair * 100),
        }
      : undefined
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
      profile.dealbreakers,
      v4Axes
    )
    console.log('Profile saved to database')

    console.log('Saving preferences...')
    // Save preferences with boundaries_scale_version for new users
    const preferencesToSave = {
      ...preferences,
      boundaries_scale_version: preferences.boundaries_ease !== undefined ? 2 : 1, // v2 if boundaries_ease exists
    }
    const { error: prefsError } = await supabase
      .from('user_profiles')
      .update({ preferences: preferencesToSave })
      .eq('id', userId)
    
    if (prefsError) {
      console.error('Error saving preferences:', prefsError)
      // Don't fail onboarding if preferences save fails
    } else {
      console.log('Preferences saved')
    }

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





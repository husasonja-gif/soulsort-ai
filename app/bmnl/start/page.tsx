'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

function BMNLStartContent() {
  const router = useRouter()

  useEffect(() => {
    const initializeParticipant = async () => {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !user.email) {
        router.push('/bmnl/login')
        return
      }

      // Check if participant already exists (by auth_user_id first, then by email)
      let existingParticipant = null
      
      // First check by auth_user_id
      const { data: participantByAuth } = await supabase
        .from('bmnl_participants')
        .select('id, status, email')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      
      if (participantByAuth) {
        existingParticipant = participantByAuth
      } else {
        // If not found by auth_user_id, check by email
        const { data: participantByEmail } = await supabase
          .from('bmnl_participants')
          .select('id, status, email, auth_user_id')
          .eq('email', user.email.toLowerCase())
          .maybeSingle()
        
        if (participantByEmail) {
          // Link this participant to the authenticated user
          if (!participantByEmail.auth_user_id) {
            await supabase
              .from('bmnl_participants')
              .update({ auth_user_id: user.id })
              .eq('id', participantByEmail.id)
          }
          existingParticipant = participantByEmail
        }
      }

      if (existingParticipant) {
        // Participant exists - check status
        if (existingParticipant.status === 'completed') {
          // Assessment completed - go to dashboard
          router.push('/bmnl/dashboard')
          return
        } else {
          // Assessment in progress - go to assessment
          router.push(`/bmnl/assessment?participant_id=${existingParticipant.id}`)
          return
        }
      }

      // No participant - create one
      try {
        // Create participant and get consent
        const response = await fetch('/api/bmnl/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.email,
            consent_granted: true,
            auth_user_id: user.id 
          }),
        })

        if (response.ok) {
          const data = await response.json()
          
          // Verify we got a participant_id
          if (!data.participant_id) {
            console.error('No participant_id in response:', data)
            alert('Failed to create participant: no participant ID returned')
            router.push('/bmnl/login')
            return
          }
          
          // Start assessment tracking
          const startResponse = await fetch('/api/bmnl/assessment/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participant_id: data.participant_id }),
          })
          
          if (!startResponse.ok) {
            console.error('Failed to start assessment tracking')
            // Continue anyway - assessment can still proceed
          }
          
          // Redirect to assessment
          router.push(`/bmnl/assessment?participant_id=${data.participant_id}`)
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }))
          console.error('Error starting assessment:', errorData)
          const errorMessage = errorData.error || errorData.details || 'Failed to start assessment'
          alert(`Error: ${errorMessage}`)
          router.push('/bmnl/login')
        }
      } catch (error) {
        console.error('Error initializing participant:', error)
        alert('Failed to start assessment. Please try again.')
        router.push('/bmnl')
      }
    }

    initializeParticipant()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your assessment...</p>
      </div>
    </div>
  )
}

export default function BMNLStartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BMNLStartContent />
    </Suspense>
  )
}


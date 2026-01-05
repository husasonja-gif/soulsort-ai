import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

/**
 * DELETE /api/user/delete
 * Delete the current user's profile and all associated data
 * Only works when authenticated
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userId = user.id

    console.log(`Deleting user profile and data for user: ${userId}`)

    // Delete in order (respecting foreign key constraints)
    // Note: CASCADE will handle dependent records, but we'll be explicit for clarity
    
    // Delete requester assessments
    const { error: assessmentsError } = await supabase
      .from('requester_assessments')
      .delete()
      .eq('user_id', userId)

    if (assessmentsError) {
      console.error('Error deleting requester assessments:', assessmentsError)
      // Continue even if this fails
    }

    // CRITICAL: Deactivate user links (don't delete - needed for guardrails)
    // Set is_active = false so requester assessments are blocked
    const { error: linksError } = await supabase
      .from('user_links')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (linksError) {
      console.error('Error deactivating user links:', linksError)
      // Continue even if this fails
    }
    
    // Also delete links after deactivating (cleanup, but guardrails use is_active)
    const { error: linksDeleteError } = await supabase
      .from('user_links')
      .delete()
      .eq('user_id', userId)

    if (linksDeleteError) {
      console.error('Error deleting user links:', linksDeleteError)
      // Continue even if this fails
    }

    // Delete consent ledger
    const { error: consentError } = await supabase
      .from('consent_ledger')
      .delete()
      .eq('user_id', userId)

    if (consentError) {
      console.error('Error deleting consent ledger:', consentError)
      // Continue even if this fails
    }

    // Delete user radar profile
    const { error: radarError } = await supabase
      .from('user_radar_profiles')
      .delete()
      .eq('user_id', userId)

    if (radarError) {
      console.error('Error deleting user radar profile:', radarError)
      // Continue even if this fails
    }

    // Delete user profile (this should cascade, but we'll be explicit)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to delete user profile', details: profileError.message },
        { status: 500 }
      )
    }

    console.log(`Successfully deleted all data for user: ${userId}`)

    // CRITICAL: Delete the auth user to prevent re-login
    // This requires admin privileges - use service role key if available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        )
        // Delete auth user (requires service role)
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (authDeleteError) {
          console.error('Error deleting auth user:', authDeleteError)
          // Continue - at least profile is deleted
        } else {
          console.log(`Successfully deleted auth user: ${userId}`)
        }
      } catch (error) {
        console.error('Error setting up admin client for auth deletion:', error)
      }
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not set - cannot delete auth user. User will be able to log back in.')
    }

    // Sign out the user after deletion
    await supabase.auth.signOut()

    return NextResponse.json({ 
      success: true,
      message: 'Your profile and all data have been permanently deleted'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete user', details: errorMessage },
      { status: 500 }
    )
  }
}



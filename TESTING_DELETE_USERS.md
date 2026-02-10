# How to Delete Test Users

There are 3 ways to delete your test user accounts:

## Method 1: Using the Dashboard (Easiest) ✅

1. Log into your account at http://localhost:3000
2. Go to your Dashboard
3. Scroll down to the "Warning: irrevocable step" section
4. Click "Delete my profile and all data"
5. Confirm the deletion
6. You'll be automatically signed out

This will delete all your profile data. **Note:** You'll still need to delete the auth user manually via Supabase Dashboard (see Method 3, step 2).

## Method 2: Using SQL Scripts (Quick for multiple users)

### Option A: List all users first, then delete specific ones

1. Open Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/010_list_all_users.sql` to see all users with their emails
3. Copy the user ID for the user you want to delete
4. Update `supabase/migrations/008_delete_user_profile.sql` with your user ID
5. Run the updated script

### Option B: Delete by email address

1. Open Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/012_delete_user_by_email.sql`
3. Replace `'your-email@example.com'` with your actual email
4. Run the script
5. Delete the auth user via Supabase Dashboard (see Method 3, step 2)

### Option C: Delete ALL users (⚠️ Use with caution!)

1. Open Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/011_delete_all_test_users.sql`
3. Delete all auth users via Supabase Dashboard (see Method 3, step 2)

## Method 3: Delete Auth Users via Supabase Dashboard

After deleting profile data using Method 1 or 2, you also need to delete the auth user:

1. Go to Supabase Dashboard → Authentication → Users
2. Find your user by email
3. Click the three dots (⋮) next to the user
4. Select "Delete user"
5. Confirm deletion

## What Gets Deleted

When you delete a user profile, the following data is removed:
- ✅ User profile (`user_profiles`)
- ✅ Radar profile (`user_radar_profiles`)
- ✅ Consent ledger entries (`consent_ledger`)
- ✅ User links (`user_links`)
- ✅ Requester assessments (`requester_assessments`)
- ⚠️ Auth user (`auth.users`) - must be deleted manually via Supabase Dashboard

## After Deletion

After deleting your test account:
1. You can sign up again with the same email (or a different one)
2. You'll go through the onboarding flow again
3. The new dealbreaker engine and quick-reply features will be available







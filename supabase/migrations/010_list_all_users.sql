-- List all users with their emails and IDs
-- Run this in Supabase SQL Editor to find your user ID for deletion

SELECT 
  u.id,
  u.email,
  u.created_at as auth_created_at,
  up.onboarding_completed,
  up.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
ORDER BY u.created_at DESC;







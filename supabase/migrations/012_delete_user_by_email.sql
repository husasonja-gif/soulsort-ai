-- Delete a specific user by email address
-- Replace 'your-email@example.com' with your actual email
-- Run this in Supabase SQL Editor

-- First, find the user ID for the email
DO $$
DECLARE
  target_email TEXT := 'your-email@example.com';  -- ⚠️ REPLACE THIS WITH YOUR EMAIL
  target_user_id UUID;
BEGIN
  -- Find the user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found', target_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Found user ID: %', target_user_id;

  -- Delete in order (respecting foreign key constraints)
  DELETE FROM public.requester_assessments WHERE user_id = target_user_id;
  DELETE FROM public.user_links WHERE user_id = target_user_id;
  DELETE FROM public.consent_ledger WHERE user_id = target_user_id;
  DELETE FROM public.user_radar_profiles WHERE user_id = target_user_id;
  DELETE FROM public.user_profiles WHERE id = target_user_id;

  RAISE NOTICE 'Deleted all data for user: % (email: %)', target_user_id, target_email;
  RAISE NOTICE 'Note: You still need to delete the auth.users entry manually via Supabase Dashboard > Authentication > Users';
END $$;






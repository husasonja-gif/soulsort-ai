-- Delete user profile script
-- Run this in Supabase SQL editor to delete your user profile and start fresh
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users

-- First, find your user ID:
-- SELECT id, email FROM auth.users;

-- Then replace YOUR_USER_ID below and run:

-- Delete in order (respecting foreign key constraints)
DELETE FROM public.requester_assessments WHERE user_id = 'YOUR_USER_ID';
DELETE FROM public.user_links WHERE user_id = 'YOUR_USER_ID';
DELETE FROM public.consent_ledger WHERE user_id = 'YOUR_USER_ID';
DELETE FROM public.user_radar_profiles WHERE user_id = 'YOUR_USER_ID';
DELETE FROM public.user_profiles WHERE id = 'YOUR_USER_ID';
-- Note: auth.users entry will be deleted when you delete your account in Supabase Auth

-- To find your user ID, run this first:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';






-- DELETE ALL USERS AND DATA (USE WITH CAUTION!)
-- This deletes ALL users and all their data for testing purposes
-- Only run this in development/testing environments

-- Delete in order (respecting foreign key constraints)
DELETE FROM public.requester_assessments;
DELETE FROM public.user_links;
DELETE FROM public.consent_ledger;
DELETE FROM public.user_radar_profiles;
DELETE FROM public.user_profiles;

-- Note: auth.users entries will need to be deleted manually via Supabase Auth UI
-- Or you can delete them via Supabase Dashboard > Authentication > Users






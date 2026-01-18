-- Fix RLS policies: Add missing INSERT policy for user_radar_profiles
-- This migration is idempotent - safe to run multiple times

-- Add INSERT policy for users to create their own radar profile (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_radar_profiles' 
    AND policyname = 'Users can insert own radar'
  ) THEN
    CREATE POLICY "Users can insert own radar" ON public.user_radar_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;







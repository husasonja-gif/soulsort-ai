-- Migration: Add preferences JSONB column to user_profiles
-- This stores slider values (pace, connection_chemistry, vanilla_kinky, open_monogamous, boundaries_ease, boundaries_scale_version)
-- This migration is idempotent - safe to run multiple times

-- Add preferences column if it doesn't exist
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add index for analytics queries (optional, but helpful for filtering)
-- Drop index first if it exists to avoid errors
DROP INDEX IF EXISTS idx_user_profiles_preferences;
CREATE INDEX idx_user_profiles_preferences 
  ON public.user_profiles USING gin(preferences);


-- Migration: Add preferences JSONB column to user_profiles
-- This stores slider values (pace, connection_chemistry, vanilla_kinky, open_monogamous, boundaries_ease, boundaries_scale_version)

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add index for analytics queries (optional, but helpful for filtering)
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferences 
  ON public.user_profiles USING gin(preferences);


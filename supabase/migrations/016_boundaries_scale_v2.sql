-- Migration: Add boundaries_ease and boundaries_scale_version for new slider UX
-- This allows backward compatibility: old users keep boundaries (difficulty), new users use boundaries_ease (ease)
-- Backend will compute unified boundariesEase at runtime to maintain consistency

-- Add new columns to profile_generation_traces for debugging
ALTER TABLE public.profile_generation_traces
  ADD COLUMN IF NOT EXISTS boundaries_raw INTEGER, -- old field if present
  ADD COLUMN IF NOT EXISTS boundaries_ease INTEGER, -- new field if present
  ADD COLUMN IF NOT EXISTS boundaries_scale_version INTEGER DEFAULT 1, -- 1 = old (difficulty), 2 = new (ease)
  ADD COLUMN IF NOT EXISTS boundaries_ease_unified INTEGER; -- computed unified value for analytics

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_profile_traces_boundaries_scale_version 
  ON public.profile_generation_traces(boundaries_scale_version);

-- Note: We do NOT add these columns to user_profiles or any other table
-- The preferences JSONB in user_profiles will store boundaries_ease and boundaries_scale_version
-- as part of the JSON structure, not as separate columns
-- This keeps the schema flexible and avoids breaking existing queries






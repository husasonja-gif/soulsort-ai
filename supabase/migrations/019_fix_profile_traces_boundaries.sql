-- Migration: Add boundaries_ease columns to profile_generation_traces
-- This migration is idempotent - safe to run multiple times

-- Add new columns to profile_generation_traces for boundaries scale v2
ALTER TABLE public.profile_generation_traces
  ADD COLUMN IF NOT EXISTS boundaries_raw INTEGER, -- old field if present
  ADD COLUMN IF NOT EXISTS boundaries_ease INTEGER, -- new field if present
  ADD COLUMN IF NOT EXISTS boundaries_scale_version INTEGER DEFAULT 1, -- 1 = old (difficulty), 2 = new (ease)
  ADD COLUMN IF NOT EXISTS boundaries_ease_unified INTEGER; -- computed unified value for analytics

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_profile_traces_boundaries_scale_version 
  ON public.profile_generation_traces(boundaries_scale_version);






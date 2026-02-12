-- Store generated Deep Insights body copy (titles/bands remain static in UI).
ALTER TABLE public.user_radar_profiles
ADD COLUMN IF NOT EXISTS deep_insights_copy JSONB;

ALTER TABLE public.requester_assessments
ADD COLUMN IF NOT EXISTS deep_insights_copy JSONB;


-- Store canonical underlying signal list for explainability and Deep Insights.
ALTER TABLE public.user_radar_profiles
ADD COLUMN IF NOT EXISTS signal_scores JSONB;

ALTER TABLE public.requester_assessments
ADD COLUMN IF NOT EXISTS signal_scores JSONB;

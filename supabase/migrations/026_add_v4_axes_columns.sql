-- Store canonical 6-axis radar values directly (0-100) for exact V4 rendering.
ALTER TABLE public.user_radar_profiles
ADD COLUMN IF NOT EXISTS v4_axes JSONB;

ALTER TABLE public.requester_assessments
ADD COLUMN IF NOT EXISTS v4_axes JSONB;

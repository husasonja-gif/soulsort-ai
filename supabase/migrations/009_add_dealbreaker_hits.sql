-- Add dealbreaker_hits JSONB column to requester_assessments
-- This stores private dealbreaker hits for the profile owner (not visible to requester)

ALTER TABLE requester_assessments
ADD COLUMN IF NOT EXISTS dealbreaker_hits JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining privacy
COMMENT ON COLUMN requester_assessments.dealbreaker_hits IS 'Private dealbreaker hits (JSON array) visible only to profile owner. Never exposed to requester.';


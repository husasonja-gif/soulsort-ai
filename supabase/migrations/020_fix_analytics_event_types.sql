-- Migration: Add missing event types to analytics_events constraint
-- Fixes: requester_consent_granted and compatibility_feedback not in valid list

-- Drop existing constraint
ALTER TABLE IF EXISTS public.analytics_events
  DROP CONSTRAINT IF EXISTS valid_event_type;

-- Recreate with all valid event types
ALTER TABLE IF EXISTS public.analytics_events
  ADD CONSTRAINT valid_event_type CHECK (event_type IN (
    'requester_started',
    'requester_consent_granted',
    'requester_completed',
    'requester_abandoned',
    'radar_viewed',
    'share_clicked',
    'dashboard_visited',
    'onboarding_started',
    'onboarding_completed',
    'onboarding_abandoned',
    'compatibility_feedback'
  ));






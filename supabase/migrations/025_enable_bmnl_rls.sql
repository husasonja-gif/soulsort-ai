-- Enable Row Level Security on BMNL tables that have policies but RLS disabled
-- Fixes Security Advisor warnings

-- Enable RLS on bmnl_signals (policies already exist)
ALTER TABLE public.bmnl_signals ENABLE ROW LEVEL SECURITY;

-- Enable RLS on bmnl_flags (policies already exist)
ALTER TABLE public.bmnl_flags ENABLE ROW LEVEL SECURITY;

-- Enable RLS on bmnl_consent_log and create policies
ALTER TABLE public.bmnl_consent_log ENABLE ROW LEVEL SECURITY;

-- Participants can view their own consent log
CREATE POLICY "Participants can view own consent log"
  ON public.bmnl_consent_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bmnl_participants
      WHERE bmnl_participants.id = bmnl_consent_log.participant_id
        AND bmnl_participants.auth_user_id = auth.uid()
    )
  );

-- Service role has full access to consent log
CREATE POLICY "Service role full access consent log"
  ON public.bmnl_consent_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Enable RLS on bmnl_organizers and create policies
ALTER TABLE public.bmnl_organizers ENABLE ROW LEVEL SECURITY;

-- Users can view their own organizer record
CREATE POLICY "Users can view own organizer record"
  ON public.bmnl_organizers FOR SELECT
  USING (auth.uid() = user_id);

-- Service role has full access to organizers
CREATE POLICY "Service role full access organizers"
  ON public.bmnl_organizers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- Allow anonymous requesters to read radar profiles via active links
-- This enables the requester flow to work without requiring public_radar consent
-- Update the existing policy to include access via active links

DROP POLICY IF EXISTS "Users can view own radar" ON public.user_radar_profiles;

CREATE POLICY "Users can view own radar" ON public.user_radar_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.consent_ledger cl
      WHERE cl.user_id = user_radar_profiles.user_id
        AND cl.consent_type = 'public_radar'
        AND cl.granted = TRUE
        AND cl.revoked_at IS NULL
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_links ul
      WHERE ul.user_id = user_radar_profiles.user_id
        AND ul.is_active = true
    )
  );


